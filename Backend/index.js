const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');
const routes = require('./src/routes/routes');
const User = require('./src/models/user');
const bcrypt = require('bcryptjs');
const Goal = require('./src/models/goal');
const Flashcard = require('./src/models/Flashcard');
const courseRoutes = require("./src/routes/courseRoutes");
const indInfoRoutes = require("./src/routes/indInfoRoutes");
const quizRoutes = require("./src/routes/quizRoutes");
const studyGroupRoutes = require("./src/routes/studyGroupRoutes");
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api", routes);
app.use("/api/courses", courseRoutes);
app.use("/api/ind-infos", indInfoRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/study-groups", studyGroupRoutes);

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
app.get("/api/flashcards",async(req,res)=>{
    try{
        const cards= await Flashcard.find().sort({createdAt: -1});
        res.json(cards);
    }catch(err){
        res.status(500).json({message: err.message});
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
