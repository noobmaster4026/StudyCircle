const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Course name is required'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Course code is required'],
            trim: true,
            uppercase: true,
            unique: true,
        },
        seatCapacity: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);

