const express = require('express');
const StudyStreak = require('../models/StudyStreak');

const router = express.Router();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function calculateCurrentStreak(studyDates) {
  const set = new Set(studyDates);
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateLongestStreak(studyDates) {
  const sorted = [...new Set(studyDates)].sort();
  let longest = 0;
  let current = 0;
  let previous = null;

  sorted.forEach(dateKey => {
    if (!previous) {
      current = 1;
    } else {
      const prevDate = new Date(previous);
      prevDate.setDate(prevDate.getDate() + 1);
      current = prevDate.toISOString().slice(0, 10) === dateKey ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
    previous = dateKey;
  });

  return longest;
}

function getBadges(currentStreak, longestStreak, totalDays) {
  const badges = [
    { id: 'first-check-in', name: 'First Check-In', description: 'Logged your first study day.', earned: totalDays >= 1 },
    { id: 'three-day-focus', name: '3 Day Focus', description: 'Studied three days in a row.', earned: longestStreak >= 3 },
    { id: 'week-warrior', name: 'Week Warrior', description: 'Built a seven day study streak.', earned: longestStreak >= 7 },
    { id: 'monthly-momentum', name: 'Monthly Momentum', description: 'Recorded 20 total study days.', earned: totalDays >= 20 },
    { id: 'active-today', name: 'Active Today', description: 'Checked in today.', earned: currentStreak > 0 },
  ];

  return badges;
}

function buildPayload(record) {
  const studyDates = record?.studyDates || [];
  const currentStreak = calculateCurrentStreak(studyDates);
  const longestStreak = Math.max(record?.longestStreak || 0, calculateLongestStreak(studyDates));

  return {
    userId: record?.userId,
    studyDates,
    totalDays: studyDates.length,
    currentStreak,
    longestStreak,
    lastCheckIn: record?.lastCheckIn || '',
    badges: getBadges(currentStreak, longestStreak, studyDates.length),
  };
}

router.get('/:userId', async (req, res) => {
  try {
    const record = await StudyStreak.findOne({ userId: req.params.userId });
    if (!record) {
      return res.json({
        userId: req.params.userId,
        studyDates: [],
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCheckIn: '',
        badges: getBadges(0, 0, 0),
      });
    }
    res.json(buildPayload(record));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:userId/check-in', async (req, res) => {
  try {
    const dateKey = req.body.date || todayKey();
    const record = await StudyStreak.findOneAndUpdate(
      { userId: req.params.userId },
      { $addToSet: { studyDates: dateKey }, $set: { lastCheckIn: dateKey } },
      { new: true, upsert: true }
    );

    const longestStreak = calculateLongestStreak(record.studyDates);
    record.longestStreak = Math.max(record.longestStreak || 0, longestStreak);
    await record.save();

    res.status(201).json(buildPayload(record));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
