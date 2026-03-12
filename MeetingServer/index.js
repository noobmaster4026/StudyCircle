const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const meetingRoutes = require("./routes/meetingRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
  res.send("✅ StudyCircle Meeting Server is running...");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // Join a room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    console.log(`👥 ${socket.id} joined room ${roomId} (${roomSize} total)`);
    socket.to(roomId).emit("user-joined", { socketId: socket.id });
  });

  // Store user info on socket
  socket.on("set-user", (userData) => {
    socket.data.user = userData;
  });

  // Chat message
  socket.on("send-message", ({ roomId, message }) => {
    io.to(roomId).emit("receive-message", {
      user: socket.data.user || { name: "Guest" },
      message,
    });
  });

  // Whiteboard
  socket.on("draw", ({ roomId, data }) => {
    socket.to(roomId).emit("draw", data);
  });

  socket.on("clear-board", (roomId) => {
    socket.to(roomId).emit("clear-board");
  });

  // Media toggles
  socket.on("toggle-mic", ({ roomId, enabled }) => {
    socket.to(roomId).emit("user-toggle-mic", { socketId: socket.id, enabled });
  });

  socket.on("toggle-cam", ({ roomId, enabled }) => {
    socket.to(roomId).emit("user-toggle-cam", { socketId: socket.id, enabled });
  });

  // WebRTC signaling
  socket.on("offer", ({ roomId, offer, to }) => {
    io.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    io.to(to).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Leave room
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { socketId: socket.id });
    console.log(`👋 ${socket.id} left room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Meeting server running on http://localhost:${PORT}`)
); 
