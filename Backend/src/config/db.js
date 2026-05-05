const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../server/.env') });

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

    if (!mongoUri) {
        console.error("❌ Error: MongoDB URI is missing. Set MONGO_URI or MONGO_URL in Backend/.env");
        process.exit(1);
    }
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB Connection Successful!");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
