const express = require('express');
const {
    getUserCourses,
    addUserCourse,
    removeUserCourse
} = require('../controller/userController');

const router = express.Router();

router.get('/:id/courses', getUserCourses);
router.post('/:id/courses', addUserCourse);
router.delete('/:id/courses/:courseId', removeUserCourse);

module.exports = router;
