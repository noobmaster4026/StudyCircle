const StudySession = require('../models/StudySession');
const User = require('../models/User');

// GET /api/study-sessions
// Returns a list of all sessions (latest first)
const getStudySessions = async (req, res) => {
  try {
    const sessions = await StudySession.find()
      .sort({ createdAt: -1 })
      .lean();

    // If a userId is provided, hide invite codes for sessions they did not create.
    const userId = req.query.userId
    if (userId) {
      const safeSessions = sessions.map((session) => {
        if (session.creator?.userId?.toString() !== userId) {
          return { ...session, inviteCode: undefined }
        }
        return session
      })
      return res.json(safeSessions)
    }

    res.json(sessions);
  } catch (err) {
    console.error('Get sessions error:', err.message);
    res.status(500).json({ message: 'Could not fetch study sessions.' });
  }
};

// Utility to create an invite code (9 lowercase letters)
const generateInviteCode = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let code = ''
  for (let i = 0; i < 9; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}

// POST /api/study-sessions
// Creates a new session (creator info should be passed in request body)
const createStudySession = async (req, res) => {
  try {
    const { name, description, seatLimit, creator } = req.body;

    if (!name || !creator?.userId || !creator?.name || !creator?.email) {
      return res.status(400).json({ message: 'Name and creator info are required.' });
    }

    // Generate a unique invite code for the session.
    // If there is a collision (very unlikely), try again a few times.
    let inviteCode
    for (let attempts = 0; attempts < 5; attempts += 1) {
      const candidate = generateInviteCode()
      // Ensure no other session has the same code.
      // If a collision happens, retry.
      // eslint-disable-next-line no-await-in-loop
      const exists = await StudySession.findOne({ inviteCode: candidate })
      if (!exists) {
        inviteCode = candidate
        break
      }
    }

    if (!inviteCode) {
      return res.status(500).json({ message: 'Could not generate a unique invite code. Please try again.' })
    }

    const session = await StudySession.create({
      name,
      description: description || '',
      inviteCode,
      seatLimit: seatLimit || null,
      creator: {
        userId: creator.userId,
        name: creator.name,
        email: creator.email,
      },
      participants: [],
    });

    res.status(201).json(session);
  } catch (err) {
    console.error('Create session error:', err.message);
    res.status(500).json({ message: 'Could not create study session.' });
  }
};

// DELETE /api/study-sessions/:id
// Only the creator can delete their session
const deleteStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const session = await StudySession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.creator.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Only the creator can delete this session.' });
    }

    await session.deleteOne();
    res.json({ message: 'Session deleted successfully.' });
  } catch (err) {
    console.error('Delete session error:', err.message);
    res.status(500).json({ message: 'Could not delete study session.' });
  }
};

// POST /api/study-sessions/:id/join
// Adds a participant if the provided invite code matches.
const joinStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name, email, inviteCode } = req.body;

    if (!userId || !name || !email || !inviteCode) {
      return res.status(400).json({ message: 'User info and invite code are required to join.' });
    }

    const session = await StudySession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.inviteCode !== inviteCode) {
      return res.status(403).json({ message: 'Invalid invite code.' });
    }

    const alreadyJoined = session.participants.some(
      (p) => p.userId.toString() === userId
    );
    if (alreadyJoined) {
      return res.status(200).json({ message: 'Already joined.', session });
    }

    // Enforce seat limit if set
    if (
      session.seatLimit &&
      session.participants.length >= session.seatLimit
    ) {
      return res.status(400).json({ message: 'Session is full.' });
    }

    // Attempt to include an optional rating if it's stored for the user.
    const joiningUser = await User.findById(userId).lean();
    const rating = joiningUser?.rating ?? null;

    session.participants.push({ userId, name, email, rating });
    await session.save();

    res.json(session);
  } catch (err) {
    console.error('Join session error:', err.message);
    res.status(500).json({ message: 'Could not join study session.' });
  }
};

module.exports = {
  getStudySessions,
  createStudySession,
  deleteStudySession,
  joinStudySession,
};
