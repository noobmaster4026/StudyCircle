const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const Tesseract = require('tesseract.js');
const { v4: uuidv4 } = require('uuid');
const Document  = require('../models/Document');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// ── Images ONLY ─────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only image files are allowed (JPG, PNG, WEBP)'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// ── POST /scan ──────────────────────────────────────────
router.post('/scan', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const filePath = req.file.path;

  try {
    console.log('Running OCR on image...');

    const ocrResult = await Tesseract.recognize(filePath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    const extractedText = ocrResult.data.text.trim() ||
      'No text could be extracted. Make sure the image contains clear, readable text.';

    const fileUrl    = `http://localhost:3001/uploads/${req.file.filename}`;
    const shareToken = uuidv4();

    const doc = new Document({
      filename:      req.file.filename,
      originalName:  req.file.originalname,
      extractedText,
      pageCount:     1,
      fileSize:      req.file.size,
      fileType:      'image',
      fileUrl,
      shareToken,
      isShared:      false
    });

    await doc.save();
    res.status(201).json(doc);

  } catch (err) {
    console.error('OCR error:', err.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: 'OCR failed: ' + err.message });
  }
});

// ── GET all documents ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET single document ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET shared document by token ────────────────────────
router.get('/share/:token', async (req, res) => {
  try {
    const doc = await Document.findOne({
      shareToken: req.params.token,
      isShared:   true
    });
    if (!doc) return res.status(404).json({ message: 'Shared document not found or sharing disabled.' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH toggle sharing ────────────────────────────────
router.patch('/:id/share', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.isShared = !doc.isShared;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE document ─────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const filePath = path.join(__dirname, '../uploads', doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;