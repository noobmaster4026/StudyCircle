const mongoose = require('mongoose');
const AiStudySchedule = require('../models/AiStudySchedule');

function geminiModelCandidates() {
  const fromEnv = (process.env.GEMINI_MODEL || '').trim();
  const chain = [
    fromEnv,
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
  ].filter(Boolean);
  const seen = new Set();
  return chain.filter((model) => {
    if (seen.has(model)) return false;
    seen.add(model);
    return true;
  });
}

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

const buildPrompt = (inputs) => {
  const {
    subjectSummary,
    goals,
    hoursPerWeek,
    durationWeeks,
    preferredStudyTimes,
    deadlines,
    subjectCount,
  } = inputs;

  const timesBlock =
    Array.isArray(preferredStudyTimes) && preferredStudyTimes.length > 0
      ? preferredStudyTimes.map((time, index) => `${index + 1}. ${time}`).join('\n')
      : 'Not specified';
  const deadlinesBlock =
    Array.isArray(deadlines) && deadlines.length > 0
      ? deadlines
          .map(
            (deadline, index) =>
              `${index + 1}. Course: ${deadline.subject}. Deadline / note: ${
                deadline.description || '(none)'
              }`
          )
          .join('\n')
      : 'None listed';

  return `You are an expert academic coach for students using a platform called StudyCircle.

Create a realistic, actionable MULTI-COURSE study schedule based ONLY on these inputs:

Courses in scope (${subjectCount}):
${subjectSummary}

Learning goals / context:
${goals || 'Not specified'}

Total study hours the student can commit per week (shared across ALL courses above): ${hoursPerWeek}
Planning horizon in weeks: ${durationWeeks}

Preferred study time windows:
${timesBlock}

Deadlines and milestones:
${deadlinesBlock}

Rules:
- Split the weekly ${hoursPerWeek} hours across the ${subjectCount} courses in a sensible way.
- Use ${durationWeeks} week(s) in "weeklyPlan" with one entry per week.
- In session "task" text, mention which course the block is for when relevant.
- Sessions should be concrete: readings, problem sets, review, mock exams, or project work.
- Honor urgent deadlines by increasing intensity for that subject in the weeks before the due date.
- Keep language encouraging and practical.

Respond with valid JSON only, using exactly this shape:
{
  "title": "short title for the plan",
  "summary": "2-4 sentences overview",
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "main theme for the week across courses",
      "days": [
        {
          "name": "Monday",
          "sessions": [
            { "durationMinutes": 45, "task": "specific task" }
          ]
        }
      ]
    }
  ],
  "tips": ["study tip 1", "study tip 2"]
}

Include 4-7 days per week where appropriate. Sum of session durations per week should be close to ${
    hoursPerWeek * 60
  } minutes.`;
};

function extractGeminiText(data) {
  const feedback = data?.promptFeedback;
  if (feedback?.blockReason) {
    const extra = feedback.blockReasonMessage ? ` ${feedback.blockReasonMessage}` : '';
    throw new Error(`Prompt blocked (${feedback.blockReason}).${extra}`);
  }

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new Error('No candidate in Gemini response. Check API key, model name, and quota.');
  }

  const reason = candidate.finishReason;
  if (reason === 'SAFETY' || reason === 'RECITATION') {
    throw new Error(`Generation blocked (${reason}). Try rephrasing inputs.`);
  }

  const parts = candidate?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
    : '';

  if (!text.trim()) {
    throw new Error('Empty text from Gemini. Try again or switch GEMINI_MODEL.');
  }

  return text;
}

function parseScheduleJson(text) {
  let scheduleText = text.trim();
  if (scheduleText.startsWith('```')) {
    scheduleText = scheduleText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  }
  return JSON.parse(scheduleText);
}

async function geminiGenerateOnce(model, prompt, useJsonMime) {
  const key = getGeminiApiKey();
  if (!key) {
    const err = new Error('GEMINI_API_KEY_MISSING');
    err.code = 'GEMINI_API_KEY_MISSING';
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    key
  )}`;
  const generationConfig = {
    temperature: 0.65,
    ...(useJsonMime ? { responseMimeType: 'application/json' } : {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || response.statusText || 'Gemini request failed';
    const err = new Error(`${message} (model: ${model})`);
    err.status = response.status;
    throw err;
  }

  return data;
}

async function callGeminiJsonRobust(prompt) {
  if (!getGeminiApiKey()) {
    const err = new Error('GEMINI_API_KEY_MISSING');
    err.code = 'GEMINI_API_KEY_MISSING';
    throw err;
  }

  const models = geminiModelCandidates();
  const attempts = [];

  for (const model of models) {
    for (const useJsonMime of [true, false]) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await geminiGenerateOnce(model, prompt, useJsonMime);
        const text = extractGeminiText(data);
        let schedule;
        try {
          schedule = parseScheduleJson(text);
        } catch (parseErr) {
          throw new Error(
            `Invalid JSON from model ${model}: ${parseErr.message}. First 200 chars: ${text.slice(
              0,
              200
            )}`
          );
        }
        return { schedule, modelUsed: model };
      } catch (err) {
        attempts.push(`${model} json=${useJsonMime}: ${err.message}`);
      }
    }
  }

  const err = new Error(
    `All Gemini attempts failed. ${attempts.join(
      ' | '
    )} Set GEMINI_MODEL in .env and ensure GEMINI_API_KEY has no extra spaces.`
  );
  err.attempts = attempts;
  throw err;
}

function toObjectId(id) {
  if (!id) return null;
  const value = String(id);
  if (!mongoose.isValidObjectId(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

function normalizeSubjects(body) {
  const raw = body.subjects;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const subjects = [];
  for (const item of raw) {
    const label = typeof item?.label === 'string' ? item.label.trim() : '';
    if (!label) continue;
    const courseId = toObjectId(item?.courseId);
    subjects.push({ courseId: courseId || undefined, label });
  }

  return subjects.length > 0 ? subjects : null;
}

function normalizePreferredTimes(body) {
  const raw = body.preferredStudyTimes;
  if (!Array.isArray(raw)) return [];
  return raw.filter((time) => typeof time === 'string' && time.trim()).map((time) => time.trim());
}

function normalizeDeadlines(body) {
  const raw = body.deadlines;
  if (!Array.isArray(raw)) return [];

  const deadlines = [];
  for (const item of raw) {
    const subject = typeof item?.subject === 'string' ? item.subject.trim() : '';
    const description = typeof item?.description === 'string' ? item.description.trim() : '';
    if (!subject || !description) continue;
    const courseId = toObjectId(item?.courseId);
    deadlines.push({
      courseId: courseId || undefined,
      subject,
      description,
    });
  }

  return deadlines;
}

const generateSchedule = async (req, res) => {
  try {
    const { goals, hoursPerWeek, durationWeeks } = req.body;

    const subjects = normalizeSubjects(req.body);
    if (!subjects) {
      return res.status(400).json({
        message: 'Select at least one course with a valid name.',
      });
    }

    const hours = Number(hoursPerWeek);
    const weeks = Number(durationWeeks);

    if (!Number.isFinite(hours) || hours < 1 || hours > 80) {
      return res.status(400).json({ message: 'hoursPerWeek must be a number between 1 and 80.' });
    }

    if (!Number.isFinite(weeks) || weeks < 1 || weeks > 52) {
      return res.status(400).json({ message: 'durationWeeks must be a number between 1 and 52.' });
    }

    const preferredStudyTimes = normalizePreferredTimes(req.body);
    const deadlines = normalizeDeadlines(req.body);
    const subjectSummary = subjects.map((subject, index) => `${index + 1}. ${subject.label}`).join('\n');

    const inputs = {
      subjects,
      subjectSummary,
      goals: typeof goals === 'string' ? goals.trim() : '',
      hoursPerWeek: hours,
      durationWeeks: weeks,
      preferredStudyTimes,
      deadlines,
    };

    const prompt = buildPrompt({
      ...inputs,
      subjectCount: subjects.length,
    });

    let schedule;
    let modelUsed = geminiModelCandidates()[0] || 'gemini-2.5-flash';

    try {
      const output = await callGeminiJsonRobust(prompt);
      schedule = output.schedule;
      modelUsed = output.modelUsed;
    } catch (err) {
      if (err.code === 'GEMINI_API_KEY_MISSING') {
        return res.status(503).json({
          message: 'AI schedule generation is not configured. Set GEMINI_API_KEY on the server.',
        });
      }

      console.error('Gemini error:', err.message);
      return res.status(502).json({
        message: 'Could not generate a schedule from the AI service. Try again shortly.',
        detail: err.message,
      });
    }

    const doc = await AiStudySchedule.create({
      userId: req.user._id,
      owner: {
        name: req.user.name,
        email: req.user.email,
      },
      inputs,
      schedule,
      model: modelUsed,
    });

    return res.status(201).json({
      _id: doc._id,
      inputs: doc.inputs,
      schedule: doc.schedule,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error('generateSchedule error:', err.message);
    return res.status(500).json({ message: 'Could not save AI study schedule.' });
  }
};

const listSchedules = async (req, res) => {
  try {
    const items = await AiStudySchedule.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('inputs schedule createdAt')
      .lean();

    return res.json(items);
  } catch (err) {
    console.error('listSchedules error:', err.message);
    return res.status(500).json({ message: 'Could not load saved schedules.' });
  }
};

module.exports = {
  generateSchedule,
  listSchedules,
  __test: {
    buildPrompt,
    extractGeminiText,
    geminiModelCandidates,
    normalizeDeadlines,
    normalizePreferredTimes,
    normalizeSubjects,
    parseScheduleJson,
  },
};
