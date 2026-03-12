const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const socketAuth = require("./middlewares/socketAuth");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*", // restrict in production
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// Default route for development
app.get("/", (req, res) => {
  res.send("✅ MeetHub API is running...");
});

// Serve React frontend in production
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "../client/dist"); // Vite build folder
  app.use(express.static(clientDistPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Apply socket auth middleware
io.use(socketAuth);

// Socket events
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.user?.name || socket.id}`);

  // Join meeting room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", { user: socket.user });
  });

  // Chat messages
  socket.on("send-message", ({ roomId, message }) => {
    io.to(roomId).emit("receive-message", {
      user: socket.user,
      message,
    });
  });

  // Whiteboard drawing
  socket.on("draw", ({ roomId, data }) => {
    socket.to(roomId).emit("draw", data);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.user?.name || socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`
  )
);
