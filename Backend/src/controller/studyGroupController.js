const { randomUUID } = require('crypto');
const StudyGroup      = require('../models/StudyGroup');
const StudyPreference = require('../models/StudyPreference');

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */

// Change 3: max 10 members per group
const MAX_GROUP_SIZE  = 10;
// Ideal size for newly auto-formed groups (still 4 for quality matching)
const TARGET_GROUP_SIZE = 4;

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

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
  const nouns      = ['Squad', 'Crew', 'Circle', 'Collective', 'Team', 'Pod'];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${course} ${adj} ${noun}`;
}

function getUserId(req) {
  return req.query.userId || req.body.userId || null;
}


async function autoPlaceStudent({ userId, name, email, enrolledCourses }) {
  if (!enrolledCourses || enrolledCourses.length === 0) return null;

  // Check if student is already in any group — don't double-place them
  const existing = await StudyGroup.findOne({
    'members.userId': userId,
    status: { $in: ['forming', 'active'] },
  });
  if (existing) return existing; // already placed, nothing to do

  const memberEntry = { userId, name: name || 'Student', email: email || '' };

  for (const course of enrolledCourses) {
    // Change 4: find groups for this course that still have room
    // sorted by members count descending so we fill existing groups first
    // before spilling into new ones
    const availableGroups = await StudyGroup.find({
      course,
      status:  { $in: ['forming', 'active'] },
      // members array length < MAX_GROUP_SIZE
      $expr: { $lt: [{ $size: '$members' }, MAX_GROUP_SIZE] },
    }).sort({ 'members': -1 }); // most populated first → fills up groups efficiently

    if (availableGroups.length > 0) {
      // Place in the first available group for this course
      const group = availableGroups[0];
      group.members.push(memberEntry);
      if (group.members.length >= 2) group.status = 'active';
      await group.save();
      return group;
    }

    // No available group for this course — create a fresh one
    // (change 4: this is the "different group" when all existing ones are full)
    const wbRoomId      = `wb-${course.toLowerCase()}-${shortId(8)}`;
    const meetingRoomId = `meet-${shortId(10)}`;

    const newGroup = new StudyGroup({
      name:             generateGroupName(course),
      course,
      courseTitle:      getCourseTitle(course),
      members:          [{ ...memberEntry, role: 'leader' }],
      maxSize:          MAX_GROUP_SIZE,
      status:           'forming',
      whiteboardRoomId: wbRoomId,
      meetingRoomId,
      autoCreated:      true,
      matchFactors:     { sharedCourses: [course], sharedGoals: [], preferredTimes: [], studyStyle: '' },
    });

    await newGroup.save();
    return newGroup;
  }

  return null;
}

/* ══════════════════════════════════════════════════════════════
   MATCHING ALGORITHM
   Scores two students 0–100 for compatibility
══════════════════════════════════════════════════════════════ */
function computeMatchScore(prefA, prefB) {
  let score = 0;

  const sharedCourses = (prefA.enrolledCourses || []).filter((c) =>
    (prefB.enrolledCourses || []).includes(c)
  );
  score += Math.min(sharedCourses.length, 4) * 10;

  let timeOverlap = 0;
  for (const dayA of (prefA.availableTimes || [])) {
    const dayB = (prefB.availableTimes || []).find((d) => d.day === dayA.day);
    if (dayB) {
      timeOverlap += (dayA.slots || []).filter((s) => (dayB.slots || []).includes(s)).length;
    }
  }
  score += Math.min(timeOverlap * 5, 30);

  if (prefA.studyStyle === prefB.studyStyle) score += 15;
  else if (prefA.studyStyle === 'collaborative' || prefB.studyStyle === 'collaborative') score += 7;

  const sharedGoals = (prefA.goals || []).filter((g) => (prefB.goals || []).includes(g));
  score += Math.min(sharedGoals.length * 5, 10);

  const langA = prefA.languages?.length ? prefA.languages : ['English'];
  const langB = prefB.languages?.length ? prefB.languages : ['English'];
  if (langA.some((l) => langB.includes(l))) score += 5;

  return { score: Math.min(score, 100), sharedCourses, sharedGoals };
}

/* ══════════════════════════════════════════════════════════════
   GROUP FORMATION ENGINE
   Called by the manual "Run Matching" button / cron job.
   Still useful for bulk re-matching all unplaced students.
══════════════════════════════════════════════════════════════ */
async function runAutomaticGroupFormation() {
  // Change 1: removed the MIN_GROUP_SIZE guard entirely.
  // Even a single opted-in student gets auto-placed via autoPlaceStudent.
  const prefs = await StudyPreference.find({ optIn: true });

  if (prefs.length === 0) {
    return { formed: 0, message: 'No opted-in students found. Save your preferences first.' };
  }

  // Find students not yet in any active/forming group
  const existingGroups = await StudyGroup.find({ status: { $in: ['forming', 'active'] } });
  const alreadyGrouped = new Set(
    existingGroups.flatMap((g) => g.members.map((m) => m.userId.toString()))
  );

  const unmatched = prefs.filter((p) => !alreadyGrouped.has(p.userId.toString()));

  if (unmatched.length === 0) {
    return { formed: 0, message: 'All opted-in students are already in groups.' };
  }

  // Change 1: a single unmatched student still gets placed (no MIN check)
  // For single students, autoPlaceStudent handles it directly
  if (unmatched.length === 1) {
    const p = unmatched[0];
    const placed = await autoPlaceStudent({
      userId: p.userId,
      name:   p.name,
      email:  p.email,
      enrolledCourses: p.enrolledCourses,
    });
    return placed
      ? { formed: 1, message: `${p.name} was placed into a group.` }
      : { formed: 0, message: 'Could not place student — no courses selected.' };
  }

  // Build score matrix for 2+ students
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

  const grouped  = new Set();
  const formedGroups = [];

  for (const [course, indices] of courseMap) {
    // Change 1: no minimum size check — even a cluster of 1 gets placed
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
      // Change 3: cap at MAX_GROUP_SIZE instead of old TARGET_GROUP_SIZE
      if (currentGroup.length >= MAX_GROUP_SIZE) {
        // Flush this group — it's full
        formedGroups.push({ course, members: [...currentGroup] });
        currentGroup.forEach((idx) => grouped.add(idx));
        currentGroup = [];
        used.clear();
      }
      if (!grouped.has(pair.i) && !used.has(pair.i)) {
        currentGroup.push(pair.i); used.add(pair.i);
      }
      if (!grouped.has(pair.j) && !used.has(pair.j) && currentGroup.length < MAX_GROUP_SIZE) {
        currentGroup.push(pair.j); used.add(pair.j);
      }
    }

    // Flush remaining (even a single student — change 1)
    if (currentGroup.length > 0) {
      formedGroups.push({ course, members: [...currentGroup] });
      currentGroup.forEach((idx) => grouped.add(idx));
    }
  }

  // Persist to DB
  const created = [];
  for (const g of formedGroups) {
    const memberPrefs = g.members.map((idx) => unmatched[idx]);
    const leaderPref  = memberPrefs.find((p) => p.willingToLead) || memberPrefs[0];

    const wbRoomId      = `wb-${g.course.toLowerCase()}-${shortId(8)}`;
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
      // Change 3: maxSize is now MAX_GROUP_SIZE (10)
      maxSize:          MAX_GROUP_SIZE,
      status:           memberPrefs.length >= 2 ? 'active' : 'forming',
      whiteboardRoomId: wbRoomId,
      meetingRoomId,
      autoCreated:      true,
      matchFactors: {
        sharedCourses:  [g.course],
        sharedGoals:    memberPrefs[0].goals || [],
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
══════════════════════════════════════════════════════════════ */

// GET /api/study-groups?userId=xxx
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

// GET /api/study-groups/available?userId=xxx
const getAvailableGroups = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const userPref = await StudyPreference.findOne({ userId });
    if (!userPref) return res.json({ success: true, groups: [] });

    const groups = await StudyGroup.find({
      'members.userId': { $ne: userId },
      course:  { $in: userPref.enrolledCourses },
      status:  'forming',
      // Change 3: respect MAX_GROUP_SIZE in available query too
      $expr: { $lt: [{ $size: '$members' }, MAX_GROUP_SIZE] },
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

    // Change 3: check against MAX_GROUP_SIZE
    if (group.members.length >= MAX_GROUP_SIZE) {
      return res.status(400).json({ success: false, message: 'Group is full (max 10 members)' });
    }

    const already = group.members.find((m) => m.userId.toString() === userId);
    if (already) return res.status(400).json({ success: false, message: 'Already a member' });

    group.members.push({ userId, name: req.body.name || 'Student', email: req.body.email || '' });
    if (group.members.length >= 2) group.status = 'active';
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
    if (group.members.length < 2)  group.status = 'forming';
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
// Change 2: after saving preferences, auto-place the student into a group
const updateMyPreferences = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { name, email, ...prefData } = req.body;

    // Save / upsert the preferences
    const pref = await StudyPreference.findOneAndUpdate(
      { userId },
      {
        ...prefData,
        userId,
        name:        name  || 'Student',
        email:       email || '',
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    // Change 2: immediately place the student into the best available group
    // for one of their enrolled courses (or create one if none exist).
    // This runs even if only 1 student has signed up — change 1 removes the
    // minimum 2-student requirement.
    let placedGroup = null;
    if (pref.optIn !== false && pref.enrolledCourses?.length > 0) {
      placedGroup = await autoPlaceStudent({
        userId,
        name:            pref.name,
        email:           pref.email,
        enrolledCourses: pref.enrolledCourses,
      });
    }

    res.json({
      success: true,
      preferences: pref,
      // Tell the frontend whether a group placement happened
      placedInGroup: placedGroup
        ? { id: placedGroup._id, name: placedGroup.name, course: placedGroup.course }
        : null,
    });
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