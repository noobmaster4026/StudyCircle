const mongoose = require('mongoose');
const AiStudySchedule = require('../models/AiStudySchedule');
const User = require('../models/user');

function geminiModelCandidates() {
  const fromEnv = (process.env.GEMINI_MODEL || '').trim();
  const models = [fromEnv, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'].filter(Boolean);
  return [...new Set(models)];
}

function openRouterModel() {
  return (process.env.OPENROUTER_SCHEDULER_MODEL || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free').trim();
}

function getOpenRouterApiKey() {
  return typeof process.env.OPENROUTER_API_KEY === 'string' ? process.env.OPENROUTER_API_KEY.trim() : '';
}

function getGeminiApiKey() {
  return typeof process.env.GEMINI_API_KEY === 'string' ? process.env.GEMINI_API_KEY.trim() : '';
}

function toObjectId(id) {
  if (!id || !mongoose.isValidObjectId(String(id))) return null;
  return new mongoose.Types.ObjectId(String(id));
}

function normalizeSubjects(body) {
  if (!Array.isArray(body.subjects)) return null;
  const subjects = body.subjects
    .map((item) => ({
      courseId: toObjectId(item?.courseId) || undefined,
      label: typeof item?.label === 'string' ? item.label.trim() : '',
    }))
    .filter((item) => item.label);
  return subjects.length ? subjects : null;
}

function normalizePreferredTimes(body) {
  return Array.isArray(body.preferredStudyTimes)
    ? body.preferredStudyTimes.filter((time) => typeof time === 'string' && time.trim()).map((time) => time.trim())
    : [];
}

function normalizeDeadlines(body) {
  return Array.isArray(body.deadlines)
    ? body.deadlines
        .map((item) => ({
          courseId: toObjectId(item?.courseId) || undefined,
          subject: typeof item?.subject === 'string' ? item.subject.trim() : '',
          description: typeof item?.description === 'string' ? item.description.trim() : '',
        }))
        .filter((item) => item.subject && item.description)
    : [];
}

function buildPrompt(inputs) {
  const timesBlock = inputs.preferredStudyTimes.length
    ? inputs.preferredStudyTimes.map((time, index) => `${index + 1}. ${time}`).join('\n')
    : 'Not specified';
  const deadlinesBlock = inputs.deadlines.length
    ? inputs.deadlines
        .map((deadline, index) => `${index + 1}. Course: ${deadline.subject}. Deadline / note: ${deadline.description}`)
        .join('\n')
    : 'None listed';

  return `You are an expert academic coach for students using StudyCircle.

Create a realistic multi-course study schedule based only on these inputs.

Courses:
${inputs.subjectSummary}

Goals:
${inputs.goals || 'Not specified'}

Total weekly hours: ${inputs.hoursPerWeek}
Planning horizon: ${inputs.durationWeeks} weeks

Preferred study times:
${timesBlock}

Deadlines:
${deadlinesBlock}

Return valid JSON only with this shape:
{
  "title": "short title",
  "summary": "2-4 sentences",
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "main focus",
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
  "tips": ["tip 1", "tip 2"]
}`;
}

function parseScheduleJson(text) {
  let raw = text.trim();
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  }
  return JSON.parse(raw);
}

function extractGeminiText(data) {
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) throw new Error(`Prompt blocked (${blockReason}).`);
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
    : '';
  if (!text.trim()) throw new Error('Empty response from Gemini.');
  return text;
}

function extractOpenRouterText(data) {
  const text = data?.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (!cleaned) throw new Error('Empty response from OpenRouter.');
  return cleaned;
}

async function openRouterGenerate(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://studycircle.app',
      'X-Title': 'StudyCircle AI Scheduler',
    },
    body: JSON.stringify({
      model: openRouterModel(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.65,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || response.statusText || 'OpenRouter request failed');
  return data;
}

async function callOpenRouter(prompt) {
  if (!getOpenRouterApiKey()) {
    const err = new Error('OPENROUTER_API_KEY_MISSING');
    err.code = 'OPENROUTER_API_KEY_MISSING';
    throw err;
  }

  const data = await openRouterGenerate(prompt);
  return { schedule: parseScheduleJson(extractOpenRouterText(data)), modelUsed: openRouterModel() };
}

async function geminiGenerate(model, prompt, useJsonMime) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(getGeminiApiKey())}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        ...(useJsonMime ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || response.statusText || 'Gemini request failed');
  return data;
}

async function callGemini(prompt) {
  if (!getGeminiApiKey()) {
    const err = new Error('GEMINI_API_KEY_MISSING');
    err.code = 'GEMINI_API_KEY_MISSING';
    throw err;
  }

  const attempts = [];
  for (const model of geminiModelCandidates()) {
    for (const useJsonMime of [true, false]) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await geminiGenerate(model, prompt, useJsonMime);
        return { schedule: parseScheduleJson(extractGeminiText(data)), modelUsed: model };
      } catch (err) {
        attempts.push(`${model} json=${useJsonMime}: ${err.message}`);
      }
    }
  }

  throw new Error(`All Gemini attempts failed. ${attempts.join(' | ')}`);
}

async function callSchedulerAi(prompt) {
  if (getOpenRouterApiKey()) return callOpenRouter(prompt);
  return callGemini(prompt);
}

async function generateSchedule(req, res) {
  try {
    const userId = req.body.userId;
    if (!mongoose.isValidObjectId(String(userId))) {
      return res.status(400).json({ message: 'Valid userId is required.' });
    }

    const subjects = normalizeSubjects(req.body);
    if (!subjects) {
      return res.status(400).json({ message: 'Select at least one course with a valid name.' });
    }

    const hoursPerWeek = Number(req.body.hoursPerWeek);
    const durationWeeks = Number(req.body.durationWeeks);
    if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80) {
      return res.status(400).json({ message: 'hoursPerWeek must be between 1 and 80.' });
    }
    if (!Number.isFinite(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
      return res.status(400).json({ message: 'durationWeeks must be between 1 and 52.' });
    }

    const user = await User.findById(userId).select('name email');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const inputs = {
      subjects,
      subjectSummary: subjects.map((subject, index) => `${index + 1}. ${subject.label}`).join('\n'),
      goals: typeof req.body.goals === 'string' ? req.body.goals.trim() : '',
      hoursPerWeek,
      durationWeeks,
      preferredStudyTimes: normalizePreferredTimes(req.body),
      deadlines: normalizeDeadlines(req.body),
    };

    let output;
    try {
      output = await callSchedulerAi(buildPrompt(inputs));
    } catch (err) {
      if (err.code === 'OPENROUTER_API_KEY_MISSING' || err.code === 'GEMINI_API_KEY_MISSING') {
        return res.status(503).json({ message: 'AI schedule generation is not configured. Set OPENROUTER_API_KEY on the Backend server.' });
      }
      console.error('AI scheduler error:', err.message);
      return res.status(502).json({ message: 'Could not generate a schedule from the AI service.', detail: err.message });
    }

    const doc = await AiStudySchedule.create({
      userId,
      owner: { name: user.name, email: user.email },
      inputs,
      schedule: output.schedule,
      model: output.modelUsed,
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
}

async function listSchedules(req, res) {
  try {
    const userId = req.query.userId;
    if (!mongoose.isValidObjectId(String(userId))) {
      return res.status(400).json({ message: 'Valid userId is required.' });
    }

    const schedules = await AiStudySchedule.find({ userId })
      .sort({ createdAt: -1 })
      .select('inputs schedule createdAt')
      .lean();
    return res.json(schedules);
  } catch (err) {
    console.error('listSchedules error:', err.message);
    return res.status(500).json({ message: 'Could not load saved schedules.' });
  }
}

module.exports = { generateSchedule, listSchedules };
