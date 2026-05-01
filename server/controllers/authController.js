const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// @route  POST /api/auth/register
// @desc   Register a student, teacher or admin
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be student, teacher or admin.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        // Check duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // Create user (password is hashed by pre-save hook)
        const user = await User.create({ name, email, password, role });

        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// @route  POST /api/auth/login
// @desc   Login and return token + role
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,  // 'student', 'teacher' or 'admin'
            },
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { register, login };
