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
import JoinRoomPage from "./pages/JoinRoomPage";
import VideoRoomPage from "./pages/VideoRoomPage";
import NotesPage from "./pages/NotesPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import ScannerPage from "./pages/ScannerPage";
import SharedDocPage from "./pages/SharedDocPage";
import QuizzesPage from "./pages/QuizzesPage";
import StudyGroups from "./pages/StudyGroupsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import SharedWhiteboard from "./components/whiteboard/SharedWhiteboard";
import ParticleBackground from "./components/ParticleBackground";
import AnalyticsPage from './pages/AnalyticsPage';
import {
  PeerRatingsPage,
  StudyRemindersPage,
  StudySchedulePage,
  StudySessionsPage,
  TutorMarketplacePage,
} from "./pages/StudentFeaturePages";
import "./App.css";

const meetSocket = io("http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
});

function App() {
  return (
    <BrowserRouter>
      {/*
        ParticleBackground sits outside <Routes> so it renders on every page.
        It uses position:fixed + zIndex:0 + pointerEvents:none so it never
        blocks clicks or scrolling on any page content.
      */}
      <ParticleBackground />

      <Routes>
        <Route path="/"        element={<Register />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/admin"   element={<AdminDashboard />} />

        <Route path="/flashcards"       element={<FlashcardsPage />} />
        <Route path="/pomodoro"         element={<PomodoroPage />} />
        <Route path="/notes"            element={<NotesPage />} />
        <Route path="/my-courses"       element={<MyCoursesPage />} />
        <Route path="/scanner"          element={<ScannerPage />} />
        <Route path="/quizzes"          element={<QuizzesPage />} />
        <Route path="/recommendations"  element={<RecommendationsPage />} />

        <Route path="/join-room"    element={<JoinRoomPage />} />
        <Route path="/video-rooms"  element={<JoinRoomPage />} />
        <Route path="/study-rooms"  element={<JoinRoomPage />} />
        <Route path="/room/:id"     element={<VideoRoomPage socket={meetSocket} />} />

        <Route path="/share/:token"  element={<SharedDocPage />} />
        <Route path="/study-groups"  element={<StudyGroups />} />

        {/*
          /whiteboard            → redirects to the class-wide shared board
          /whiteboard/:roomId    → specific room (class board or study group board)
          Any student can open any room — no group membership required.
        */}
        <Route path="/whiteboard"         element={<Navigate to="/whiteboard/shared-board" replace />} />
        <Route path="/whiteboard/:roomId" element={<SharedWhiteboard />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/study-session" element={<StudySessionsPage />} />
        <Route path="/study-schedule" element={<StudySchedulePage />} />
        <Route path="/tutor-marketplace" element={<TutorMarketplacePage />} />
        <Route path="/peer-ratings" element={<PeerRatingsPage />} />
        <Route path="/reminders" element={<StudyRemindersPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
