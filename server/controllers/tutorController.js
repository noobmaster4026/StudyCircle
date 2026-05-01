const Tutor = require('../models/Tutor');
const User = require('../models/User');

// Normalize a tutor document for frontend display
const normalizeTutor = (tutorDoc, user = null) => {
  const tutor = { ...tutorDoc };
  if (user) {
    tutor.name = user.name;
    tutor.email = user.email;
  }

  // Ensure consistent output fields
  if (Array.isArray(tutor.courses) && tutor.courses.length > 0) {
    tutor.course = tutor.courses[0].courseName || tutor.courses[0].courseCode || tutor.course;
    tutor.rate = tutor.courses[0].rate ?? tutor.rate;
  }

  tutor.course = tutor.course || tutor.subjects?.[0] || tutor.department || 'General tutoring';
  tutor.rate = tutor.rate ?? tutor.price ?? tutor.hourlyRate ?? 0;

  return tutor;
};

// GET /api/tutors
// Fetch list of tutors from the database, joining tutor profiles with user accounts.
const getTutors = async (req, res) => {
  try {
    const [tutorDocs, teachers] = await Promise.all([
      Tutor.find().lean(),
      User.find({ role: 'teacher' }).select('name email').lean(),
    ]);

    const teachersById = new Map(teachers.map((t) => [String(t._id), t]));
    const teachersByEmail = new Map(teachers.map((t) => [t.email, t]));

    const normalizedTutors = [];

    if (Array.isArray(tutorDocs) && tutorDocs.length > 0) {
      for (const doc of tutorDocs) {
        const user = doc.userId
          ? teachersById.get(String(doc.userId))
          : teachersByEmail.get(doc.email?.toLowerCase());

        normalizedTutors.push(normalizeTutor(doc, user));
      }
    }

    if (normalizedTutors.length === 0) {
      normalizedTutors.push(
        ...teachers.map((t) =>
          normalizeTutor({ course: 'General tutoring', rate: 0 }, t),
        ),
      );
    }

    res.json(normalizedTutors);
  } catch (err) {
    console.error('Get tutors error:', err.message);
    res.status(500).json({ message: 'Could not fetch tutors.' });
  }
};

// GET /api/tutors/me
// Fetch the current logged-in teacher's tutor profile
const getMyTutor = async (req, res) => {
  try {
    const userId = req.user._id;
    const tutorDoc = await Tutor.findOne({ userId }).lean();

    if (!tutorDoc) {
      return res.json({ courses: [] });
    }

    const normalized = normalizeTutor(tutorDoc, req.user);
    return res.json(normalized);
  } catch (err) {
    console.error('Get my tutor error:', err.message);
    res.status(500).json({ message: 'Could not fetch your tutor profile.' });
  }
};

// PUT /api/tutors/me
// Create or update the current teacher's tutor profile (courses + pricing)
const updateMyTutor = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courses } = req.body;

    if (!Array.isArray(courses)) {
      return res.status(400).json({ message: 'Courses must be an array.' });
    }

    const sanitizedCourses = courses.map((course) => ({
      courseId: course.courseId || null,
      courseCode: course.courseCode || course.code || '',
      courseName: course.courseName || course.name || '',
      rate: Number(course.rate) || 0,
    }));

    const update = {
      userId,
      email: req.user.email,
      courses: sanitizedCourses,
      updatedAt: new Date(),
    };

    const tutor = await Tutor.findOneAndUpdate({ userId }, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();

    res.json(normalizeTutor(tutor, req.user));
  } catch (err) {
    console.error('Update my tutor error:', err.message);
    res.status(500).json({ message: 'Could not update your tutor profile.' });
  }
};

module.exports = { getTutors, getMyTutor, updateMyTutor };
