const mongoose = require('mongoose');

// This schema is intentionally flexible since the collection may contain a variety of tutor fields.
// The model uses strict: false so it can adapt to any existing document shape.
const tutorSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('Tutor', tutorSchema, 'tutors');
