const IndInfo = require('../models/IndInfo');
const Course = require('../models/Course');

// @route  GET /api/ind-infos/:userId
// @desc   Get a student's course selections
const getStudentInfo = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User id is required.' });
        }

        const info = await IndInfo.findOne({ user: userId }).populate('courses');

        if (!info) {
            return res.status(200).json({ user: userId, courses: [] });
        }

        res.status(200).json(info);
    } catch (err) {
        console.error('Get student info error:', err.message);
        res.status(500).json({ message: 'Failed to load student courses.' });
    }
};

// @route  POST /api/ind-infos/:userId/courses
// @desc   Add a course to a student's selections
const addCourseForStudent = async (req, res) => {
    try {
        const { userId } = req.params;
        const { courseId } = req.body;

        if (!userId || !courseId) {
            return res.status(400).json({ message: 'User id and course id are required.' });
        }

        // Ensure course exists and has available seats
        const course = await Course.findOneAndUpdate(
            { _id: courseId, seatCapacity: { $gt: 0 } },
            { $inc: { seatCapacity: -1 } },
            { new: true }
        );

        if (!course) {
            const exists = await Course.exists({ _id: courseId });
            return res.status(404).json({
                message: exists
                    ? 'No available seats for this course.'
                    : 'Course not found.',
            });
        }

        // Enforce 4-course limit
        const existing = await IndInfo.findOne({ user: userId });
        if (existing && existing.courses.length >= 4) {
            return res.status(400).json({ message: "You can only select up to 4 courses." });
        }

        let info = existing;
        if (!info) {
            info = await IndInfo.create({ user: userId, courses: [courseId] });
        } else if (!info.courses.some((c) => c.toString() === courseId)) {
            info.courses.push(courseId);
            await info.save();
        }

        const populated = await info.populate('courses');
        res.status(200).json(populated);
    } catch (err) {
        console.error('Add course for student error:', err.message);
        res.status(500).json({ message: 'Failed to add course for student.' });
    }
};

// @route  DELETE /api/ind-infos/:userId/courses/:courseId
// @desc   Remove a course from a student's selections
const removeCourseForStudent = async (req, res) => {
    try {
        const { userId, courseId } = req.params;

        if (!userId || !courseId) {
            return res.status(400).json({ message: 'User id and course id are required.' });
        }

        const info = await IndInfo.findOne({ user: userId });
        if (!info) {
            return res.status(404).json({ message: 'Student info not found.' });
        }

        const beforeCount = info.courses.length;
        info.courses = info.courses.filter((c) => c.toString() !== courseId);

        if (info.courses.length === beforeCount) {
            return res.status(404).json({ message: 'Course not found for this student.' });
        }

        await info.save();

        // Return updated selection after incrementing capacity
        const course = await Course.findByIdAndUpdate(
            courseId,
            { $inc: { seatCapacity: 1 } },
            { new: true },
        );

        const populated = await info.populate('courses');
        res.status(200).json(populated);
    } catch (err) {
        console.error('Remove course for student error:', err.message);
        res.status(500).json({ message: 'Failed to remove course for student.' });
    }
};

module.exports = {
    getStudentInfo,
    addCourseForStudent,
    removeCourseForStudent,
};

