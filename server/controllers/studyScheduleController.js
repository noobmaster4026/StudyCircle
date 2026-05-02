const Course = require('../models/Course');
const IndInfo = require('../models/IndInfo');
const StudySchedule = require('../models/StudySchedule');

const DEFAULT_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const taskSets = {
  balanced: ['Read core notes', 'Practice problems', 'Summarize key ideas', 'Review weak points'],
  exam: ['Solve past questions', 'Timed practice', 'Revise formulas', 'Mock test review'],
  revision: ['Revise notes', 'Active recall', 'Flash review', 'Concept map'],
};

const buildBlocks = ({ subjects, days, availableHours, focusLevel }) => {
  const safeSubjects = subjects.length ? subjects : ['General study'];
  const safeDays = days.length ? days : DEFAULT_DAYS;
  const totalBlocks = Math.max(1, Math.min(28, Math.round(Number(availableHours || 8) * 1.5)));
  const minutesPerBlock = Number(availableHours || 8) >= 10 ? 50 : 45;
  const tasks = taskSets[focusLevel] || taskSets.balanced;

  return Array.from({ length: totalBlocks }, (_, index) => {
    const day = safeDays[index % safeDays.length];
    const subject = safeSubjects[index % safeSubjects.length];
    const hour = 17 + Math.floor((index / safeDays.length) % 4);
    const time = `${String(hour).padStart(2, '0')}:00`;

    return {
      day,
      time,
      subject,
      task: tasks[index % tasks.length],
      durationMinutes: minutesPerBlock,
    };
  });
};

const getMySchedules = async (req, res) => {
  try {
    const schedules = await StudySchedule.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json(schedules);
  } catch (err) {
    console.error('Get schedules error:', err.message);
    res.status(500).json({ message: 'Could not load study schedules.' });
  }
};

const generateSchedule = async (req, res) => {
  try {
    const {
      title,
      goal,
      focusLevel = 'balanced',
      availableHours = 8,
      days = DEFAULT_DAYS,
      subjects = [],
      useSelectedCourses = true,
    } = req.body;

    const hours = Number(availableHours);
    if (Number.isNaN(hours) || hours < 1 || hours > 80) {
      return res.status(400).json({ message: 'Available hours must be between 1 and 80.' });
    }

    let scheduleSubjects = Array.isArray(subjects)
      ? subjects.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (useSelectedCourses) {
      const indInfo = await IndInfo.findOne({ user: req.user._id }).lean();
      const courseIds = Array.isArray(indInfo?.courses) ? indInfo.courses : [];
      if (courseIds.length) {
        const courses = await Course.find({ _id: { $in: courseIds } }).lean();
        scheduleSubjects = courses.map((course) => `${course.code} - ${course.name}`);
      }
    }

    const cleanDays = Array.isArray(days)
      ? days.map((day) => String(day).trim()).filter(Boolean)
      : DEFAULT_DAYS;

    const blocks = buildBlocks({
      subjects: scheduleSubjects,
      days: cleanDays,
      availableHours: hours,
      focusLevel,
    });

    const schedule = await StudySchedule.create({
      userId: req.user._id,
      title: title || 'Weekly study schedule',
      goal: goal || '',
      focusLevel,
      availableHours: hours,
      days: cleanDays,
      subjects: scheduleSubjects.length ? scheduleSubjects : ['General study'],
      blocks,
    });

    res.status(201).json(schedule);
  } catch (err) {
    console.error('Generate schedule error:', err.message);
    res.status(500).json({ message: 'Could not generate study schedule.' });
  }
};

module.exports = { getMySchedules, generateSchedule };
