const express = require('express');
const router = express.Router();
const {
    getStudentInfo,
    addCourseForStudent,
    removeCourseForStudent,
} = require('../controller/indInfoController');

// GET /api/ind-infos/:userId
router.get('/:userId', getStudentInfo);

// POST /api/ind-infos/:userId/courses
router.post('/:userId/courses', addCourseForStudent);

// DELETE /api/ind-infos/:userId/courses/:courseId
router.delete('/:userId/courses/:courseId', removeCourseForStudent);

module.exports = router;

