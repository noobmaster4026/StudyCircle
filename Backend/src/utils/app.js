const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('../config/db');
const userRoutes = require('../routes/routes');
const courseRoutes = require('../routes/courseRoutes'); // teammate's routes
const notesRoutes = require('../routes/notesRoutes');
const userCourseRoutes = require('../routes/userCourseRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Your existing routes
app.use('/api/auth', userRoutes);

// Teammate's course routes
app.use('/api/courses', courseRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/users', userCourseRoutes);

app.listen(3001, () => {
  console.log(`Server is running on http://localhost:3001`);
});
