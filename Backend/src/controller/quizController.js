const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL     = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

// In-memory quiz store (replace with a Mongoose model if you want persistence)
// Shape: { id, userId, topic, difficulty, questions, createdAt }
const quizStore = [];

/* ── helpers ────────────────────────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function buildPrompt(topic, difficulty, count, questionType) {
  const diffMap = {
    easy:   'straightforward, suitable for beginners',
    medium: 'moderately challenging, suitable for intermediate learners',
    hard:   'challenging and conceptually deep, suitable for advanced students',
  };

  const typeInstructions = {
    mcq: `Each question must have exactly 4 answer options labeled A, B, C, D.
Exactly one option must be correct.
"correct" field must be "A", "B", "C", or "D".`,
    truefalse: `Each question must have exactly 2 options: "True" and "False".
"correct" field must be "True" or "False".`,
    mixed: `Mix of multiple-choice (4 options A/B/C/D) and true/false questions.
For MCQ, "correct" is "A"/"B"/"C"/"D". For true/false, "correct" is "True"/"False".`,
  };

  return `You are an expert academic quiz generator. Generate exactly ${count} quiz questions about "${topic}".

Difficulty: ${diffMap[difficulty] || diffMap.medium}
Question type: ${typeInstructions[questionType] || typeInstructions.mcq}

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no code blocks, no explanation before or after.

JSON format:
{
  "title": "Quiz title (concise, relevant to topic)",
  "description": "One sentence describing what this quiz tests",
  "questions": [
    {
      "id": 1,
      "question": "The full question text",
      "options": ["Option text", "Option text", "Option text", "Option text"],
      "correct": "A",
      "explanation": "Clear, educational explanation of why the correct answer is right (2-3 sentences)"
    }
  ]
}

Rules:
- Questions must be factually accurate and educationally valuable
- Distractors (wrong answers) must be plausible, not obviously wrong
- Explanations must be clear and teach the concept, not just state the answer
- Do NOT number the options in the option text itself (no "A. ", "B. " prefixes)
- Vary question styles: definitions, applications, comparisons, examples
- Generate EXACTLY ${count} questions, no more, no less`;
}

/* ── controllers ────────────────────────────────────────────────────────── */

/**
 * POST /api/quiz/generate
 * Body: { topic, difficulty, count, questionType, userId }
 */
const generateQuiz = async (req, res) => {
  const {
    topic        = '',
    difficulty   = 'medium',
    count        = 5,
    questionType = 'mcq',
    userId,
  } = req.body;

  if (!topic.trim()) {
    return res.status(400).json({ success: false, message: 'Topic is required.' });
  }
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ success: false, message: 'OpenRouter API key not configured.' });
  }

  const clampedCount = Math.min(Math.max(Number(count) || 5, 3), 15);

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model:    MODEL,
        messages: [{ role: 'user', content: buildPrompt(topic, difficulty, clampedCount, questionType) }],
        max_tokens: 4000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization:  `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://studycircle.app',
          'X-Title':      'StudyCircle AI Quiz Generator',
        },
        timeout: 60000,
      }
    );

    const raw = response.data?.choices?.[0]?.message?.content || '';

    // Strip markdown fences if the model wrapped JSON anyway
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract the first JSON object from the response
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Model did not return valid JSON.');
      parsed = JSON.parse(match[0]);
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid quiz structure from model.');
    }

    // Normalise question IDs and option labels
    const questions = parsed.questions.slice(0, clampedCount).map((q, i) => {
      const labels = ['A', 'B', 'C', 'D'];
      const opts   = (q.options || []).slice(0, 4);
      return {
        id:          i + 1,
        question:    q.question || `Question ${i + 1}`,
        options:     opts.map((o, idx) => ({ label: labels[idx] || String(idx + 1), text: String(o) })),
        correct:     String(q.correct || 'A').toUpperCase(),
        explanation: q.explanation || 'No explanation provided.',
      };
    });

    const quiz = {
      id:           uid(),
      userId:       userId || null,
      topic,
      difficulty,
      questionType,
      title:        parsed.title        || `${topic} Quiz`,
      description:  parsed.description || `Test your knowledge of ${topic}`,
      questions,
      createdAt:    new Date().toISOString(),
    };

    // Persist to in-memory store (last 50 per user max)
    quizStore.push(quiz);
    if (quizStore.length > 500) quizStore.shift();

    res.json({ success: true, quiz });

  } catch (err) {
    console.error('[QuizController] generateQuiz error:', err.message);

    if (err.response?.status === 429) {
      return res.status(429).json({ success: false, message: 'AI rate limit reached. Please wait a moment and try again.' });
    }
    if (err.response?.status === 401) {
      return res.status(500).json({ success: false, message: 'Invalid API key. Contact your administrator.' });
    }

    res.status(500).json({ success: false, message: err.message || 'Failed to generate quiz.' });
  }
};

/**
 * POST /api/quiz/save-result
 * Body: { quizId, userId, score, total, timeTaken, answers }
 */
const saveResult = async (req, res) => {
  const { quizId, userId, score, total, timeTaken, answers } = req.body;

  const quiz = quizStore.find(q => q.id === quizId);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

  // Attach result to the quiz record
  if (!quiz.results) quiz.results = [];
  quiz.results.push({
    userId,
    score,
    total,
    percentage:  Math.round((score / total) * 100),
    timeTaken,
    answers,
    submittedAt: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Result saved.' });
};

/**
 * GET /api/quiz/history?userId=xxx
 */
const getHistory = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ success: true, quizzes: [] });

  const userQuizzes = quizStore
    .filter(q => q.userId === userId)
    .slice(-20)
    .reverse()
    .map(q => ({
      id:          q.id,
      title:       q.title,
      topic:       q.topic,
      difficulty:  q.difficulty,
      totalQ:      q.questions.length,
      createdAt:   q.createdAt,
      lastScore:   q.results?.[q.results.length - 1]?.percentage ?? null,
    }));

  res.json({ success: true, quizzes: userQuizzes });
};

/**
 * GET /api/quiz/:id
 */
const getQuizById = async (req, res) => {
  const quiz = quizStore.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
  res.json({ success: true, quiz });
};

module.exports = { generateQuiz, saveResult, getHistory, getQuizById };
