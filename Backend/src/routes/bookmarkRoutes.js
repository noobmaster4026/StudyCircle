const express = require('express');
const router = express.Router();
const {
    createBookmark,
    getBookmarks,
    deleteBookmark,
    updateBookmark
} = require('../controllers/bookmarkController');

// Routes for bookmarks
router.post('/create', createBookmark);
router.get('/', getBookmarks);
router.put('/:id', updateBookmark);
router.delete('/:id', deleteBookmark);

module.exports = router;
