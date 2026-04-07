const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');
const userRoutes = require('../routes/routes');
const courseRoutes = require('../routes/courseRoutes'); // teammate's routes

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Your existing routes
app.use('/api/auth', userRoutes);

// Teammate's course routes
app.use('/api/courses', courseRoutes);

app.listen(3001, () => {
  console.log(`Server is running on http://localhost:3001`);
});