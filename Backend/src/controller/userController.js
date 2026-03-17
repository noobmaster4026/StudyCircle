const User = require("../models/user");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password, role } = req.body;

        console.log("Request body:", req.body);        // ✅ debug full body
        console.log("Role received:", role);           // ✅ debug role

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

        console.log("Saved user role:", newUser.role); // ✅ debug saved role

        res.status(201).json({
            message: "User registered successfully!",
            userId: newUser._id,
            role: newUser.role
        });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Server error." });
    }
}

module.exports = { registerUser };