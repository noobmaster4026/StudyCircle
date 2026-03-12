import React, { useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import FlashcardsPage from "./pages/FlashcardsPage";
import PomodoroPage from "./pages/PomodoroPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import VideoRoomPage from "./pages/VideoRoomPage";
import "./App.css";

// ✅ MeetHub server socket (runs on port 5000)
const meetSocket = io("http://localhost:5000", { autoConnect: false });

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/pomodoro" element={<PomodoroPage />} />

        {/* ✅ Video Room routes — all paths lead to JoinRoomPage */}
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/video-rooms" element={<JoinRoomPage />} />
        <Route path="/study-rooms" element={<JoinRoomPage />} />
        <Route path="/room/:id" element={<VideoRoomPage socket={meetSocket} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
