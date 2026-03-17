const express = require('express');
const router = express.Router();
const { getCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');

// GET /api/courses
router.get('/', getCourses);

// POST /api/courses
router.post('/', createCourse);

// PUT /api/courses/:id
router.put('/:id', updateCourse);

// DELETE /api/courses/:id
router.delete('/:id', deleteCourse);

module.exports = router;

