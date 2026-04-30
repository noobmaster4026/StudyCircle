const { randomUUID } = require('crypto'); // ✅ FIX: built-in Node.js, no ESM issue
const StudyGroup = require('../models/StudyGroup');
const StudyPreference = require('../models/StudyPreference');

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

// Generate a short random ID (replaces nanoid)
function shortId(length = 8) {
  return randomUUID().replace(/-/g, '').slice(0, length);
}

function getCourseTitle(courseCode) {
  const titles = {
    CSE440: 'Natural Language Processing',
    CSE446: 'Machine Learning',
    CSE310: 'Algorithm Design',
    CSE421: 'Computer Networks',
    CSE331: 'Software Engineering',
    CSE360: 'Operating Systems',
    CSE401: 'Compiler Construction',
    CSE450: 'Database Systems',
  };
  return titles[courseCode] || courseCode;
}

function generateGroupName(course) {
  const adjectives = ['Focused', 'Brilliant', 'Dynamic', 'Synced', 'Sharp', 'Curious', 'Elite'];
  const nouns = ['Squad', 'Crew', 'Circle', 'Collective', 'Team', 'Pod'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${course} ${adj} ${noun}`;
}

// ✅ FIX: get userId from request — this project has no JWT middleware,
//         userId is stored in localStorage and sent as a query param or in body
function getUserId(req) {
  return req.query.userId || req.body.userId || null;
}

/* ══════════════════════════════════════════════════════════════
   MATCHING ALGORITHM
   Scores two students 0–100 for compatibility
══════════════════════════════════════════════════════════════ */
function computeMatchScore(prefA, prefB) {
  let score = 0;

  // 1. Shared courses — 40 pts max (10 per shared course, up to 4)
  const sharedCourses = (prefA.enrolledCourses || []).filter((c) =>
    (prefB.enrolledCourses || []).includes(c)
  );
  score += Math.min(sharedCourses.length, 4) * 10;

  // 2. Time overlap — 30 pts max (5 per matching slot)
  let timeOverlap = 0;
  for (const dayA of (prefA.availableTimes || [])) {
    const dayB = (prefB.availableTimes || []).find((d) => d.day === dayA.day);
    if (dayB) {
      const slotOverlap = (dayA.slots || []).filter((s) => (dayB.slots || []).includes(s)).length;
      timeOverlap += slotOverlap;
    }
  }
  score += Math.min(timeOverlap * 5, 30);

  // 3. Study style — 15 pts exact match, 7 partial
  if (prefA.studyStyle === prefB.studyStyle) {
    score += 15;
  } else if (prefA.studyStyle === 'collaborative' || prefB.studyStyle === 'collaborative') {
    score += 7;
  }

  // 4. Shared goals — 10 pts max
  const sharedGoals = (prefA.goals || []).filter((g) => (prefB.goals || []).includes(g));
  score += Math.min(sharedGoals.length * 5, 10);

  // 5. Shared language — 5 pts
  const langA = prefA.languages?.length ? prefA.languages : ['English'];
  const langB = prefB.languages?.length ? prefB.languages : ['English'];
  if (langA.some((l) => langB.includes(l))) score += 5;

  return { score: Math.min(score, 100), sharedCourses, sharedGoals };
}

/* ══════════════════════════════════════════════════════════════
   GROUP FORMATION ENGINE
══════════════════════════════════════════════════════════════ */
const TARGET_GROUP_SIZE = 4;
const MIN_GROUP_SIZE = 2;

async function runAutomaticGroupFormation() {
  const prefs = await StudyPreference.find({ optIn: true });
  if (prefs.length < MIN_GROUP_SIZE) {
    return { formed: 0, message: 'Not enough opted-in students.' };
  }

  // Find students already in active/forming groups
  const existingGroups = await StudyGroup.find({ status: { $in: ['forming', 'active'] } });
  const alreadyGrouped = new Set(
    existingGroups.flatMap((g) => g.members.map((m) => m.userId.toString()))
  );

  const unmatched = prefs.filter((p) => !alreadyGrouped.has(p.userId.toString()));
  if (unmatched.length < MIN_GROUP_SIZE) {
    return { formed: 0, message: 'All opted-in students are already in groups.' };
  }

  // Build score matrix
  const n = unmatched.length;
  const scores = {};
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      scores[`${i}-${j}`] = computeMatchScore(unmatched[i], unmatched[j]);
    }
  }

  // Cluster by course
  const courseMap = new Map();
  for (let i = 0; i < unmatched.length; i++) {
    for (const course of (unmatched[i].enrolledCourses || [])) {
      if (!courseMap.has(course)) courseMap.set(course, []);
      courseMap.get(course).push(i);
    }
  }

  const grouped = new Set();
  const formedGroups = [];

  for (const [course, indices] of courseMap) {
    if (indices.length < MIN_GROUP_SIZE) continue;

    // Sort pairs by score descending
    const pairs = [];
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a], j = indices[b];
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (scores[key]) pairs.push({ i, j, ...scores[key] });
      }
    }
    pairs.sort((a, b) => b.score - a.score);

    let currentGroup = [];
    const used = new Set();

    for (const pair of pairs) {
      if (currentGroup.length >= TARGET_GROUP_SIZE) {
        if (currentGroup.length >= MIN_GROUP_SIZE) {
          formedGroups.push({ course, members: [...currentGroup] });
          currentGroup.forEach((idx) => grouped.add(idx));
        }
        currentGroup = [];
        used.clear();
      }
      if (!grouped.has(pair.i) && !used.has(pair.i)) { currentGroup.push(pair.i); used.add(pair.i); }
      if (!grouped.has(pair.j) && !used.has(pair.j) && currentGroup.length < TARGET_GROUP_SIZE) {
        currentGroup.push(pair.j); used.add(pair.j);
      }
    }

    if (currentGroup.length >= MIN_GROUP_SIZE) {
      formedGroups.push({ course, members: [...currentGroup] });
      currentGroup.forEach((idx) => grouped.add(idx));
    }
  }

  // Persist to DB
  const created = [];
  for (const g of formedGroups) {
    const memberPrefs = g.members.map((idx) => unmatched[idx]);
    const leaderPref = memberPrefs.find((p) => p.willingToLead) || memberPrefs[0];

    // ✅ FIX: shortId() replaces nanoid()
    const wbRoomId     = `wb-${g.course.toLowerCase()}-${shortId(8)}`;
    const meetingRoomId = `meet-${shortId(10)}`;

    const group = new StudyGroup({
      name:        generateGroupName(g.course),
      course:      g.course,
      courseTitle: getCourseTitle(g.course),
      members: memberPrefs.map((p) => ({
        userId: p.userId,
        name:   p.name,
        email:  p.email,
        role:   p.userId.toString() === leaderPref.userId.toString() ? 'leader' : 'member',
      })),
      maxSize:      TARGET_GROUP_SIZE + 1,
      status:       'forming',
      whiteboardRoomId: wbRoomId,
      meetingRoomId,
      autoCreated: true,
      matchFactors: {
        sharedCourses: [g.course],
        sharedGoals:   memberPrefs[0].goals || [],
        preferredTimes: (memberPrefs[0].availableTimes || []).map(
          (t) => `${t.day}: ${(t.slots || []).join(', ')}`
        ),
        studyStyle: memberPrefs[0].studyStyle,
      },
    });

    await group.save();
    created.push(group);
  }

  return { formed: created.length, groups: created };
}

/* ══════════════════════════════════════════════════════════════
   ROUTE CONTROLLERS
   ✅ FIX: all use getUserId(req) instead of req.user._id
══════════════════════════════════════════════════════════════ */

// GET /api/study-groups?userId=xxx — my groups
const getStudyGroups = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const groups = await StudyGroup.find({
      'members.userId': userId,
      status: { $in: ['forming', 'active'] },
    }).sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/study-groups/available?userId=xxx — groups I can join
const getAvailableGroups = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const userPref = await StudyPreference.findOne({ userId });
    if (!userPref) return res.json({ success: true, groups: [] });

    const groups = await StudyGroup.find({
      'members.userId': { $ne: userId },
      course: { $in: userPref.enrolledCourses },
      status: 'forming',
      $expr: { $lt: [{ $size: '$members' }, '$maxSize'] },
    }).limit(20);

    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/study-groups/:id
const getStudyGroupById = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/study-groups/run-matching
const runMatching = async (req, res) => {
  try {
    const result = await runAutomaticGroupFormation();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/study-groups/join/:id   body: { userId, name, email }
const joinGroup = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (group.isFull) return res.status(400).json({ success: false, message: 'Group is full' });

    const already = group.members.find((m) => m.userId.toString() === userId);
    if (already) return res.status(400).json({ success: false, message: 'Already a member' });

    group.members.push({
      userId,
      name:  req.body.name  || 'Student',
      email: req.body.email || '',
    });

    if (group.members.length >= MIN_GROUP_SIZE + 1) group.status = 'active';
    await group.save();

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/study-groups/leave/:id   body: { userId }
const leaveGroup = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    group.members = group.members.filter((m) => m.userId.toString() !== userId);
    if (group.members.length < MIN_GROUP_SIZE) group.status = 'forming';
    if (group.members.length === 0) group.status = 'dissolved';
    await group.save();

    res.json({ success: true, message: 'Left the group' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/study-groups/my-preferences?userId=xxx
const getMyPreferences = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const pref = await StudyPreference.findOne({ userId });
    res.json({ success: true, preferences: pref });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/study-groups/my-preferences   body: { userId, name, email, ...prefFields }
const updateMyPreferences = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { name, email, ...prefData } = req.body;

    const pref = await StudyPreference.findOneAndUpdate(
      { userId },
      { ...prefData, userId, name: name || 'Student', email: email || '', lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, preferences: pref });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudyGroups,
  getAvailableGroups,
  getStudyGroupById,
  runMatching,
  joinGroup,
  leaveGroup,
  getMyPreferences,
  updateMyPreferences,
};