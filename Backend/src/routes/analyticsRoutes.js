const express   = require('express');
const router    = express.Router();
const Analytics = require('../models/Analytics');

// ── Helper: Get start of a date period ─────────────────────────────────────
// Returns a Date object set to the beginning of the requested period
const getPeriodStart = (period) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (period === 'week') {
    // Gets the most recent Monday as start of week
    const day  = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === 'year') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return new Date(0); // 'all' — returns everything
};

// ── GET /api/analytics/summary ──────────────────────────────────────────────
// Returns all metrics needed for the dashboard in one request:
// total hours, subject breakdown, goal rate, quiz trends, flashcard stats,
// pomodoro heatmap, and streak count
router.get('/summary', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const startDate = getPeriodStart(period);

    // Fetches all sessions within the selected time period
    const sessions = await Analytics.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // ── Total minutes studied ───────────────────────────────────────────────
    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutesStudied, 0);

    // ── Subject breakdown — minutes per subject ─────────────────────────────
    // Used to render the pie chart
    const subjectMap = {};
    sessions.forEach(s => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.minutesStudied;
    });
    const subjectBreakdown = Object.entries(subjectMap).map(([name, minutes]) => ({
      name,
      minutes,
      hours: parseFloat((minutes / 60).toFixed(2))
    }));

    // ── Goal completion rate ────────────────────────────────────────────────
    const totalDays     = sessions.length;
    const goalsCompleted = sessions.filter(s => s.goalCompleted).length;
    const goalRate       = totalDays > 0 ? Math.round((goalsCompleted / totalDays) * 100) : 0;

    // ── Quiz performance — daily correct percentage trend ───────────────────
    // Groups quiz results by date for the line chart
    const quizByDate = {};
    sessions.forEach(s => {
      const dateKey = s.date.toISOString().split('T')[0];
      if (!quizByDate[dateKey]) quizByDate[dateKey] = { total: 0, correct: 0 };
      const quizTotal = Math.max(0, Number(s.quizStats?.total || 0));
      const quizCorrect = Math.min(quizTotal, Math.max(0, Number(s.quizStats?.correct || 0)));
      quizByDate[dateKey].total   += quizTotal;
      quizByDate[dateKey].correct += quizCorrect;
    });
    const quizTrend = Object.entries(quizByDate).map(([date, stats]) => ({
      date,
      score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    }));

    // ── Flashcard retention rate ────────────────────────────────────────────
    const totalCards = sessions.reduce((sum, s) => (
      sum + Math.max(0, Number(s.flashcardStats?.total || 0))
    ), 0);
    const correctCards = sessions.reduce((sum, s) => {
      const total = Math.max(0, Number(s.flashcardStats?.total || 0));
      const correct = Math.min(total, Math.max(0, Number(s.flashcardStats?.correct || 0)));
      return sum + correct;
    }, 0);
    const flashcardRetention = totalCards > 0
      ? Math.round((correctCards / totalCards) * 100)
      : 0;

    // ── Pomodoro heatmap — sessions per day ─────────────────────────────────
    // Used to render the calendar-style heatmap
    const pomodoroMap = {};
    sessions.forEach(s => {
      const dateKey = s.date.toISOString().split('T')[0];
      pomodoroMap[dateKey] = (pomodoroMap[dateKey] || 0) + s.pomodoroCount;
    });
    const pomodoroHeatmap = Object.entries(pomodoroMap).map(([date, count]) => ({
      date, count
    }));

    // ── Study streak — consecutive days with at least 1 session ────────────
    const studyDates = [...new Set(
      sessions.map(s => s.date.toISOString().split('T')[0])
    )].sort();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    // Counts backwards from today while there are consecutive study days
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (studyDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // ── Hours per day — for the bar chart ──────────────────────────────────
    const dailyMap = {};
    sessions.forEach(s => {
      const dateKey = s.date.toISOString().split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + s.minutesStudied;
    });
    const dailyHours = Object.entries(dailyMap).map(([date, minutes]) => ({
      date,
      hours: parseFloat((minutes / 60).toFixed(2))
    }));

    res.json({
      totalMinutes,
      totalHours:      parseFloat((totalMinutes / 60).toFixed(2)),
      subjectBreakdown,
      goalRate,
      goalsCompleted,
      totalDays,
      quizTrend,
      flashcardRetention,
      totalCards,
      correctCards,
      pomodoroHeatmap,
      streak,
      dailyHours,
      totalSessions: sessions.length
    });

  } catch (err) {
    console.error('Summary error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/analytics ──────────────────────────────────────────────────────
// Returns all raw session logs sorted by newest first
router.get('/', async (req, res) => {
  try {
    const sessions = await Analytics.find().sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/analytics ─────────────────────────────────────────────────────
// Logs a new study session — called manually or by the Pomodoro timer
router.post('/', async (req, res) => {
  try {
    const {
      date, subject, minutesStudied, sessionType,
      flashcardStats, quizStats, goalCompleted, pomodoroCount
    } = req.body;

    // Validates required fields before saving
    if (!subject || !minutesStudied) {
      return res.status(400).json({ message: 'Subject and minutesStudied are required' });
    }

    const session = new Analytics({
      date:           date ? new Date(date) : new Date(),
      subject,
      minutesStudied,
      sessionType:    sessionType    || 'manual',
      flashcardStats: {
        total: Math.max(0, Number(flashcardStats?.total || 0)),
        correct: Math.min(
          Math.max(0, Number(flashcardStats?.total || 0)),
          Math.max(0, Number(flashcardStats?.correct || 0))
        )
      },
      quizStats: {
        total: Math.max(0, Number(quizStats?.total || 0)),
        correct: Math.min(
          Math.max(0, Number(quizStats?.total || 0)),
          Math.max(0, Number(quizStats?.correct || 0))
        )
      },
      goalCompleted:  goalCompleted  || false,
      pomodoroCount:  pomodoroCount  || 0
    });

    await session.save();
    res.status(201).json(session);
  } catch (err) {
    console.error('POST analytics error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /api/analytics/:id ───────────────────────────────────────────────
// Deletes a specific session log by ID
router.delete('/:id', async (req, res) => {
  try {
    await Analytics.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/analytics/seed ────────────────────────────────────────────────
// Seeds the database with deterministic sample study data for testing
router.post('/seed', async (req, res) => {
  try {
    const shouldReset = req.query.reset === 'true' || req.body?.reset === true;
    const existing = await Analytics.countDocuments();
    if (existing > 0) {
      if (!shouldReset) {
        return res.json({
          message: `Already has ${existing} sessions. Add ?reset=true to replace them with sample data.`
        });
      }
      await Analytics.deleteMany({});
    }

    const makeDate = (daysAgo) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(12, 0, 0, 0);
      return date;
    };

    const sessions = [
      {
        date: makeDate(4),
        subject: 'React',
        minutesStudied: 75,
        sessionType: 'pomodoro',
        flashcardStats: { total: 10, correct: 5 },
        quizStats: { total: 10, correct: 5 },
        goalCompleted: true,
        pomodoroCount: 3
      },
      {
        date: makeDate(3),
        subject: 'React',
        minutesStudied: 95,
        sessionType: 'pomodoro',
        flashcardStats: { total: 15, correct: 6 },
        quizStats: { total: 12, correct: 5 },
        goalCompleted: true,
        pomodoroCount: 4
      },
      {
        date: makeDate(2),
        subject: 'thms',
        minutesStudied: 58,
        sessionType: 'manual',
        flashcardStats: { total: 18, correct: 8 },
        quizStats: { total: 12, correct: 8 },
        goalCompleted: true,
        pomodoroCount: 2
      },
      {
        date: makeDate(1),
        subject: 'Database',
        minutesStudied: 53,
        sessionType: 'flashcard',
        flashcardStats: { total: 14, correct: 6 },
        quizStats: { total: 10, correct: 8 },
        goalCompleted: true,
        pomodoroCount: 2
      },
      {
        date: makeDate(0),
        subject: 'React',
        minutesStudied: 69,
        sessionType: 'pomodoro',
        flashcardStats: { total: 20, correct: 10 },
        quizStats: { total: 5, correct: 1 },
        goalCompleted: true,
        pomodoroCount: 3
      },
      {
        date: makeDate(0),
        subject: 'react',
        minutesStudied: 80,
        sessionType: 'manual',
        flashcardStats: { total: 16, correct: 8 },
        quizStats: { total: 4, correct: 1 },
        goalCompleted: true,
        pomodoroCount: 1
      },
      {
        date: makeDate(0),
        subject: 'ML',
        minutesStudied: 18,
        sessionType: 'manual',
        flashcardStats: { total: 8, correct: 4 },
        quizStats: { total: 4, correct: 1 },
        goalCompleted: false,
        pomodoroCount: 1
      }
    ];

    await Analytics.insertMany(sessions);
    res.json({ message: `Seeded ${sessions.length} study sessions successfully` });
  } catch (err) {
    console.error('Seed error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
