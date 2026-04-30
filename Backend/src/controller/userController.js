const User = require("../models/user");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password, role } = req.body;
        console.log("Request body:", req.body);
        console.log("Role received:", role);
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
            role: role || "student"
        });
        await newUser.save();
        console.log("Saved user role:", newUser.role);
        res.status(201).json({
            message: "User registered successfully!",
            userId: newUser._id,
            role: newUser.role
        });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/users/:id/courses
const getUserCourses = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("courses");
        if (!user) return res.status(404).json({ message: "User not found." });
        res.status(200).json({ courses: user.courses });
    } catch (error) {
        console.error("getUserCourses error:", error.message);
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/users/:id/courses
const addUserCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        if (!courseId) return res.status(400).json({ message: "courseId is required." });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (user.courses.map(String).includes(String(courseId))) {
            return res.status(409).json({ message: "Course already added." });
        }

        user.courses.push(courseId);
        await user.save();

        await user.populate("courses");
        res.status(200).json({ courses: user.courses });
    } catch (error) {
        console.error("addUserCourse error:", error.message);
        res.status(500).json({ message: "Server error." });
    }
};

// DELETE /api/users/:id/courses/:courseId
const removeUserCourse = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        user.courses = user.courses.filter(
            (c) => String(c) !== String(req.params.courseId)
        );
        await user.save();

        await user.populate("courses");
        res.status(200).json({ courses: user.courses });
    } catch (error) {
        console.error("removeUserCourse error:", error.message);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { registerUser, getUserCourses, addUserCourse, removeUserCourse };