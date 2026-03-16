const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');

// Get all flashcards
router.get('/', async (req, res) => {
  try {
    const cards = await Flashcard.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get cards by deck
router.get('/deck/:deck', async (req, res) => {
  try {
    const cards = await Flashcard.find({ deck: req.params.deck });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a flashcard
router.post('/', async (req, res) => {
  const card = new Flashcard({
    deck: req.body.deck,
    question: req.body.question,
    answer: req.body.answer
  });
  try {
    const newCard = await card.save();
    res.status(201).json(newCard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a flashcard
router.put('/:id', async (req, res) => {
  try {
    const updated = await Flashcard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a flashcard
router.delete('/:id', async (req, res) => {
  try {
    await Flashcard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;