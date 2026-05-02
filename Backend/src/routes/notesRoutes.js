const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Note = require('../models/Note');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const normalizeUploader = (uploadedBy) => {
    if (!uploadedBy || uploadedBy === 'Anonymous') return undefined;
    return mongoose.Types.ObjectId.isValid(uploadedBy) ? uploadedBy : undefined;
};

router.post('/', upload.single('file'), async (req, res) => {
    const uploadedFile = req.file;

    try {
        const { title, description, uploadedBy, course } = req.body;

        if (!title) return res.status(400).json({ message: 'Title is required' });
        if (!uploadedFile) return res.status(400).json({ message: 'No file uploaded' });

        const newNote = new Note({
            title,
            description,
            uploadedBy: normalizeUploader(uploadedBy),
            course: course || 'General',
            fileUrl: `/uploads/${uploadedFile.filename}`,
            fileName: uploadedFile.originalname,
            fileType: uploadedFile.mimetype,
            size: uploadedFile.size
        });

        await newNote.save();
        await newNote.populate('uploadedBy', 'name');

        res.status(201).json(newNote);
    } catch (err) {
        if (uploadedFile?.path && fs.existsSync(uploadedFile.path)) {
            fs.unlinkSync(uploadedFile.path);
        }
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.course) query.course = req.query.course;

        const notes = await Note.find(query).sort({ createdAt: -1 }).populate('uploadedBy', 'name');
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });

        const filePath = path.join(uploadDir, path.basename(note.fileUrl));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
