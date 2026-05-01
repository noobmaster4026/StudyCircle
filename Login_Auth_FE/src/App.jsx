import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import FlashcardsPage from "./pages/FlashcardsPage";
import PomodoroPage from "./pages/PomodoroPage";
import NotesPage from "./pages/NotesPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import VideoRoomPage from "./pages/VideoRoomPage";
import NotesPage from "./pages/NotesPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import "./App.css";
import ScannerPage from "./pages/ScannerPage";
import SharedDocPage from "./pages/SharedDocPage";
import QuizzesPage from './pages/QuizzesPage';
import StudyGroups from './pages/StudyGroupsPage';
import SharedWhiteboard from './components/whiteboard/SharedWhiteboard';

const meetSocket = io("http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
});

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
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/pomodoro" element={<PomodoroPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/my-courses" element={<MyCoursesPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/video-rooms" element={<JoinRoomPage />} />
        <Route path="/study-rooms" element={<JoinRoomPage />} />
        <Route path="/room/:id" element={<VideoRoomPage socket={meetSocket} />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/share/:token" element={<SharedDocPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/study-groups" element={<StudyGroups />} />
        <Route path="/whiteboard" element={<Navigate to="/whiteboard/shared-board" replace />} />
        <Route path="/whiteboard/:roomId" element={<SharedWhiteboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
