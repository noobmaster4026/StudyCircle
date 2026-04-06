import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FlashcardsPage from './pages/FlashcardsPage';
import PomodoroPage from './pages/PomodoroPage';
import './App.css';
import ScannerPage   from './pages/ScannerPage';
import SharedDocPage from './pages/SharedDocPage';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <h1>📚 StudyApp</h1>
        <div className="nav-links">
          <Link to="/">Flashcards</Link>
          <Link to="/pomodoro">Pomodoro</Link>
          <Link to="/scanner">Scanner</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<FlashcardsPage />} />
        <Route path="/pomodoro" element={<PomodoroPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/share/:token" element={<SharedDocPage />} />
      </Routes>
    </Router>
  );
}

export default App;