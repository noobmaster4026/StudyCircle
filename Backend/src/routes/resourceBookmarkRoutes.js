const express = require('express');
const ResourceBookmark = require('../models/ResourceBookmark');

const router = express.Router();

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(tag => String(tag).trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  return [];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res) => {
  try {
    const { userId, category, q } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const filter = { userId };
    if (category && category !== 'all') filter.category = category;
    if (q) {
      const search = new RegExp(escapeRegExp(q), 'i');
      filter.$or = [
        { title: search },
        { subject: search },
        { notes: search },
        { tags: search },
      ];
    }

    const bookmarks = await ResourceBookmark.find(filter).sort({ isFavorite: -1, updatedAt: -1 });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, title, url, category, subject, notes, isFavorite } = req.body;
    if (!userId || !title || !url) {
      return res.status(400).json({ message: 'userId, title, and url are required' });
    }

    const bookmark = await ResourceBookmark.create({
      userId,
      title,
      url,
      category: category || 'General',
      subject: subject || '',
      notes: notes || '',
      tags: normalizeTags(req.body.tags),
      isFavorite: Boolean(isFavorite),
    });

    res.status(201).json(bookmark);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if ('tags' in updates) updates.tags = normalizeTags(updates.tags);

    const bookmark = await ResourceBookmark.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });

    res.json(bookmark);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const bookmark = await ResourceBookmark.findByIdAndDelete(req.params.id);
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
    res.json({ message: 'Bookmark deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
