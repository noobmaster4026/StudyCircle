const express = require('express');
const axios = require('axios');

const router = express.Router();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

function getOpenRouterApiKey() {
  return typeof process.env.OPENROUTER_API_KEY === 'string' ? process.env.OPENROUTER_API_KEY.trim() : '';
}

function buildPrompt(question, subject, context) {
  return `You are StudyCircle's AI doubt solver for students.

Subject: ${subject || 'General study question'}
Student question: ${question}
Extra context: ${context || 'No extra context provided'}

Answer clearly and patiently. Include:
1. A direct answer.
2. A short step-by-step explanation.
3. One quick practice prompt or check-for-understanding question.

Keep the response concise and student friendly.`;
}

router.post('/ask', async (req, res) => {
  const { question = '', subject = '', context = '' } = req.body;

  if (!question.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required.' });
  }

  const openRouterApiKey = getOpenRouterApiKey();

  if (!openRouterApiKey) {
    return res.status(500).json({
      success: false,
      message: 'OpenRouter API key is not configured. Add OPENROUTER_API_KEY to Backend/.env to enable the AI doubt solver.',
    });
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [{ role: 'user', content: buildPrompt(question, subject, context) }],
        max_tokens: 1200,
        temperature: 0.35,
      },
      {
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://studycircle.app',
          'X-Title': 'StudyCircle AI Doubt Solver',
        },
        timeout: 60000,
      }
    );

    const answer = (response.data?.choices?.[0]?.message?.content || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim();

    if (!answer) {
      return res.status(502).json({
        success: false,
        message: 'The AI service returned an empty answer. Please try asking again.',
      });
    }

    res.json({ success: true, answer });
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message || 'Failed to solve doubt.';
    res.status(err.response?.status || 500).json({ success: false, message });
  }
});

module.exports = router;
