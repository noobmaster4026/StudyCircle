require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const indInfoRoutes = require('./routes/indInfoRoutes');
const studySessionRoutes = require('./routes/studySessionRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiScheduleRoutes = require('./routes/aiScheduleRoutes');

const app = express();

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
}));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ind-infos', indInfoRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai-schedules', aiScheduleRoutes);

// Health check
app.get('/', (req, res) => res.json({ status: 'StudyCircle API running' }));

// ─── MongoDB Connection ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log('✅ MongoDB connected — studycircle');
        app.listen(PORT, () =>
            console.log(`🚀 Server running at http://localhost:${PORT}`)
        );
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
