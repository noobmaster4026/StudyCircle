const Course = require('../models/Course');

// @route  GET /api/courses
// @desc   Get all courses
const getCourses = async (_req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        const normalized = courses.map((c) => ({
            ...c.toObject(),
            seatCapacity: typeof c.seatCapacity === 'number' ? c.seatCapacity : 0,
        }));
        res.status(200).json(normalized);
    } catch (err) {
        console.error('Get courses error:', err.message);
        res.status(500).json({ message: 'Failed to load courses.' });
    }
};

// @route  POST /api/courses
// @desc   Create a new course
const createCourse = async (req, res) => {
    try {
        const { name, code, seatCapacity } = req.body;

        if (!name || !code) {
            return res.status(400).json({ message: 'Course name and code are required.' });
        }

        const capacityNumber = Number(seatCapacity) || 0;

        const existing = await Course.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(409).json({ message: 'A course with this code already exists.' });
        }

        const course = await Course.create({ name, code, seatCapacity: capacityNumber });
        res.status(201).json(course);
    } catch (err) {
        console.error('Create course error:', err.message);
        res.status(500).json({ message: 'Failed to create course.' });
    }
};

// PUT /api/courses/:id
// @desc   Update a course (name/code/capacity)
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, seatCapacity } = req.body;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        if (name) course.name = name;
        if (code) course.code = code;
        if (seatCapacity != null) course.seatCapacity = Number(seatCapacity) || 0;

        await course.save();
        res.status(200).json(course);
    } catch (err) {
        console.error('Update course error:', err.message);
        res.status(500).json({ message: 'Failed to update course.' });
    }
};

// DELETE /api/courses/:id
// @desc   Delete a course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        await course.deleteOne();
        res.status(200).json({ message: 'Course deleted.' });
    } catch (err) {
        console.error('Delete course error:', err.message);
        res.status(500).json({ message: 'Failed to delete course.' });
    }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse };

