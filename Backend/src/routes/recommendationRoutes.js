const express        = require('express');
const router         = express.Router();
const Recommendation = require('../models/Recommendation');
const UserProfile    = require('../models/UserProfile');

const SAMPLE_RECOMMENDATIONS = [
  { type: 'topic', title: 'Introduction to React Hooks', subject: 'React', tags: ['hooks', 'useState', 'useEffect'], difficulty: 'intermediate', description: 'Master the fundamentals of React Hooks to write cleaner functional components.', score: 8 },
  { type: 'topic', title: 'Binary Search Trees', subject: 'Data Structures', tags: ['trees', 'algorithms', 'search'], difficulty: 'intermediate', description: 'Understand BST insertion, deletion, and traversal algorithms with visual examples.', score: 7 },
  { type: 'topic', title: 'SQL Joins Explained', subject: 'Database', tags: ['sql', 'joins', 'queries'], difficulty: 'beginner', description: 'A beginner-friendly guide to INNER, LEFT, RIGHT, and FULL joins in SQL.', score: 6 },
  { type: 'topic', title: 'CSS Flexbox & Grid Layout', subject: 'Web Design', tags: ['css', 'flexbox', 'grid', 'layout'], difficulty: 'beginner', description: 'Build responsive layouts confidently using modern CSS Flexbox and Grid techniques.', score: 5 },
  { type: 'topic', title: 'Dynamic Programming Basics', subject: 'Algorithms', tags: ['dp', 'memoization', 'recursion'], difficulty: 'advanced', description: 'Learn to solve complex problems by breaking them into overlapping subproblems.', score: 9 },
  { type: 'topic', title: 'REST API Design Principles', subject: 'Backend', tags: ['api', 'rest', 'http', 'express'], difficulty: 'intermediate', description: 'Design clean, consistent REST APIs using best practices for routes and responses.', score: 7 },

  { type: 'resource', title: 'MDN Web Docs - JavaScript Guide', subject: 'JavaScript', tags: ['javascript', 'reference', 'docs'], difficulty: 'beginner', description: 'The most comprehensive JavaScript reference and learning guide on the web.', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', score: 9 },
  { type: 'resource', title: 'React Official Documentation', subject: 'React', tags: ['react', 'docs', 'components'], difficulty: 'intermediate', description: 'Official React docs with examples for hooks, context, and performance optimization.', url: 'https://react.dev', score: 9 },
  { type: 'resource', title: 'freeCodeCamp - Data Structures', subject: 'Data Structures', tags: ['algorithms', 'practice', 'free'], difficulty: 'beginner', description: 'Free interactive course covering arrays, stacks, queues, trees, and graphs.', url: 'https://www.freecodecamp.org', score: 8 },
  { type: 'resource', title: 'MongoDB University Free Courses', subject: 'Database', tags: ['mongodb', 'nosql', 'aggregation'], difficulty: 'intermediate', description: 'Official MongoDB learning platform with free hands-on courses and certifications.', url: 'https://learn.mongodb.com', score: 7 },

  { type: 'session', title: '2-Hour Deep Work: Algorithms', subject: 'Algorithms', tags: ['focus', 'practice', 'problem-solving'], difficulty: 'advanced', description: 'Dedicated 2-hour session solving 3 algorithm problems on LeetCode without interruption.', score: 8 },
  { type: 'session', title: 'Quick Review: React Concepts', subject: 'React', tags: ['review', 'flashcards', 'quick'], difficulty: 'beginner', description: '30-minute flashcard review session covering React lifecycle and hooks concepts.', score: 6 },
  { type: 'session', title: 'Database Schema Design Sprint', subject: 'Database', tags: ['design', 'planning', 'schema'], difficulty: 'intermediate', description: 'Plan and draw out the schema for your next project in a focused 45-minute session.', score: 7 },

  { type: 'tutor', title: 'Ahmed R. - Algorithms Specialist', subject: 'Algorithms', tags: ['algorithms', 'competitive', 'expert'], difficulty: 'advanced', description: 'PhD student specializing in competitive programming. 4.9 star rating from 120 sessions.', score: 9 },
  { type: 'tutor', title: 'Sara M. - Full Stack Developer', subject: 'React', tags: ['react', 'node', 'fullstack'], difficulty: 'intermediate', description: 'Senior dev with 5 years experience. Covers React, Node.js, and system design.', score: 8 },
  { type: 'tutor', title: 'Karim T. - Database Expert', subject: 'Database', tags: ['sql', 'mongodb', 'optimization'], difficulty: 'intermediate', description: 'Database architect with expertise in both SQL and NoSQL performance tuning.', score: 7 },
];

const ensureSeedRecommendations = async () => {
  const existing = await Recommendation.countDocuments();
  if (existing > 0) return existing;

  await Recommendation.insertMany(SAMPLE_RECOMMENDATIONS);
  return SAMPLE_RECOMMENDATIONS.length;
};

// ── Helper: Calculate relevance score for a recommendation ──────────────────
// Scores each recommendation based on user profile match, feedback history,
// subject overlap, and deadline urgency — higher score = shown first
const calculateScore = (rec, profile) => {
  let score = rec.score || 0;

  if (!profile) return score;

  // +10 points if recommendation subject matches one of user's subjects
  if (profile.subjects?.includes(rec.subject)) score += 10;

  // +5 points for each tag that matches any of the user's subjects or goals
  rec.tags?.forEach(tag => {
    if (profile.subjects?.some(s => s.toLowerCase() === tag.toLowerCase())) score += 5;
    if (profile.goals?.some(g    => g.toLowerCase().includes(tag.toLowerCase()))) score += 3;
  });

  // +20 urgency points if there's a deadline for this subject within 7 days
  const now = new Date();
  profile.deadlines?.forEach(deadline => {
    const daysLeft = (new Date(deadline.date) - now) / (1000 * 60 * 60 * 24);
    if (deadline.subject === rec.subject && daysLeft <= 7 && daysLeft >= 0) {
      score += 20; // Urgent — deadline coming up soon
    }
  });

  // +5 points based on how much the user has studied this subject before
  const historyCount = profile.studyHistory?.get?.(rec.subject) || 0;
  score += Math.min(historyCount * 2, 10); // Max +10 from study history

  // Reduce score based on negative feedback ratio
  const totalFeedback = rec.thumbsUp + rec.thumbsDown;
  if (totalFeedback > 0) {
    const ratio = rec.thumbsUp / totalFeedback;
    score += (ratio - 0.5) * 10; // Ranges from -5 to +5
  }

  return score;
};

// ── GET /api/recommendations ────────────────────────────────────────────────
// Fetches all recommendations, scores them based on user profile,
// sorts by score descending so most relevant items appear first
router.get('/', async (req, res) => {
  try {
    await ensureSeedRecommendations();

    const [recs, profile] = await Promise.all([
      Recommendation.find(),
      UserProfile.findOne()
    ]);

    // Score and sort recommendations by relevance
    const scored = recs
      .map(rec => ({
        ...rec.toObject(),
        computedScore: calculateScore(rec, profile)
      }))
      .sort((a, b) => b.computedScore - a.computedScore);

    res.json({ recommendations: scored, profile });
  } catch (err) {
    console.error('GET recommendations error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/recommendations/profile ───────────────────────────────────────
// Returns the current user profile (subjects, goals, deadlines)
router.get('/profile', async (req, res) => {
  try {
    let profile = await UserProfile.findOne();

    // Creates a default empty profile if none exists yet
    if (!profile) {
      profile = await new UserProfile({
        subjects: [],
        goals: [],
        deadlines: [],
        feedbackHistory: [],
        studyHistory: {}
      }).save();
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/recommendations/profile ───────────────────────────────────────
// Updates the user's study profile with new subjects, goals, and deadlines
// Also updates studyHistory count for each listed subject
router.put('/profile', async (req, res) => {
  try {
    const { subjects, goals, deadlines } = req.body;

    let profile = await UserProfile.findOne();

    if (!profile) {
      // Creates a new profile if none exists
      profile = new UserProfile({ subjects, goals, deadlines });
    } else {
      // Updates existing profile fields
      profile.subjects  = subjects  || profile.subjects;
      profile.goals     = goals     || profile.goals;
      profile.deadlines = deadlines || profile.deadlines;

      // Increments study history count for each subject in the profile
      subjects?.forEach(subject => {
        const current = profile.studyHistory.get(subject) || 0;
        profile.studyHistory.set(subject, current + 1);
      });
    }

    profile.updatedAt = new Date();
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error('PUT profile error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/recommendations/feedback/:id ─────────────────────────────────
// Records thumbs-up or thumbs-down feedback for a recommendation
// Updates the thumbsUp/thumbsDown counters and logs in user's feedback history
router.post('/feedback/:id', async (req, res) => {
  try {
    const { feedback } = req.body; // 'up' or 'down'

    if (!['up', 'down'].includes(feedback)) {
      return res.status(400).json({ message: 'Feedback must be up or down' });
    }

    // Increments the appropriate counter on the recommendation
    const rec = await Recommendation.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Recommendation not found' });

    if (feedback === 'up')   rec.thumbsUp   += 1;
    if (feedback === 'down') rec.thumbsDown += 1;
    await rec.save();

    // Saves feedback to user's history so it can influence future scoring
    let profile = await UserProfile.findOne();
    if (profile) {
      profile.feedbackHistory.push({
        recommendationId: rec._id,
        feedback,
        givenAt: new Date()
      });
      await profile.save();
    }

    res.json(rec);
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/recommendations/seed ─────────────────────────────────────────
// Seeds the database with sample recommendations for testing
// Only adds data if the collection is empty to avoid duplicates
router.post('/seed', async (req, res) => {
  try {
    const count = await ensureSeedRecommendations();
    res.json({ message: `Recommendation collection has ${count} items` });
  } catch (err) {
    console.error('Seed error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
