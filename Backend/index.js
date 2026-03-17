const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');
const routes = require('./src/routes/routes');
const User = require('./src/models/user');
const bcrypt = require('bcryptjs');
const Goal = require('./src/models/goal');
const Flashcard = require('./src/models/Flashcard');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const multer = require('multer');
const fs = require('fs');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api", routes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Login
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Email not found" });

        if (user.isBanned) return res.status(403).json({ message: "Your account has been banned" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

        res.status(200).json({
            message: "Login successful!",
            name: user.name,
            userId: user._id,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users (admin only)
app.get("/api/admin/users", async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ban user (admin only)
app.put("/api/admin/ban/:id", async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);

        if (targetUser.role === "admin") {
            return res.status(403).json({ message: "Admins cannot ban other admins" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBanned: req.body.isBanned },
            { new: true }
        );
        res.status(200).json({ message: `User ${req.body.isBanned ? "banned" : "unbanned"}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user (admin only)
app.delete("/api/admin/users/:id", async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);

        if (targetUser.role === "admin") {
            return res.status(403).json({ message: "Admins cannot delete other admins" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all teachers
app.get("/api/teachers", async (req, res) => {
    try {
        const teachers = await User.find({ role: "teacher" }, "-password");
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all students
app.get("/api/students", async (req, res) => {
    try {
        const students = await User.find({ role: "student" }, "-password");
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all goals for a user
app.get("/api/goals/:userId", async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.params.userId });
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a goal
app.post("/api/goals", async (req, res) => {
    try {
        const goal = new Goal(req.body);
        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a goal
app.put("/api/goals/:id", async (req, res) => {
    try {
        const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a goal
app.delete("/api/goals/:id", async (req, res) => {
    try {
        await Goal.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Goal deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Get the Flashcards
app.get("/api/flashcards", async (req, res) => {
    try {
        const cards = await Flashcard.find().sort({ createdAt: -1 });
        res.json(cards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

// Get cards by deck
app.get("/api/flashcards/deck/:deck", async (req, res) => {
    try {
        const cards = await Flashcard.find({ deck: req.params.deck });
        res.json(cards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create flashcard
app.post("/api/flashcards", async (req, res) => {
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

// Update flashcard
app.put("/api/flashcards/:id", async (req, res) => {
    try {
        const updated = await Flashcard.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete flashcard
app.delete("/api/flashcards/:id", async (req, res) => {
    try {
        await Flashcard.findByIdAndDelete(req.params.id);
        res.json({ message: "Card deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Notes Upload & Sharing Routes ---
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
const Note = require('./src/models/Note');

// Upload a note
app.post('/api/notes', upload.single('file'), async (req, res) => {
    try {
        const { title, description, uploadedBy, course } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const newNote = new Note({
            title,
            description,
            fileUrl,
            uploadedBy,
            course,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            size: req.file.size
        });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all notes (optionally filter by course)
app.get('/api/notes', async (req, res) => {
    try {
        const query = {};
        if (req.query.course) {
            query.course = req.query.course;
        }
        const notes = await Note.find(query).sort({ createdAt: -1 }).populate('uploadedBy', 'name');
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: "Note not found" });

        const filePath = path.join(__dirname, note.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: "Note deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// -------------------------------------

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});