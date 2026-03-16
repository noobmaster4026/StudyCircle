import React, { useState, useEffect, useRef } from 'react';
import ParticleBackground from '../components/ParticleBackground';
import '../App.css';

const MODES = {
  work: { label: '🍅 Focus', duration: 25 * 60 },
  short: { label: '☕ Short Break', duration: 5 * 60 },
  long: { label: '🌿 Long Break', duration: 15 * 60 },
};

export default function PomodoroPage() {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [customLong, setCustomLong] = useState(15);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleComplete = () => {
    new Audio('https://www.soundjay.com/buttons/sounds/button-09a.mp3').play().catch(() => {});
    if (mode === 'work') {
      setSessions(s => {
        const newS = s + 1;
        if (newS % 4 === 0) switchMode('long');
        else switchMode('short');
        return newS;
      });
    } else {
      switchMode('work');
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    const dur = newMode === 'work'
      ? customWork * 60
      : newMode === 'short' ? customBreak * 60 : customLong * 60;
    setTimeLeft(dur);
  };

  const handleModeSwitch = (m) => {
    setRunning(false);
    switchMode(m);
  };

  const reset = () => {
    setRunning(false);
    switchMode(mode);
  };

  const handleShortBreakChange = (val) => {
    setCustomBreak(Math.min(10, Math.max(1, val)));
  };

  const handleLongBreakChange = (val) => {
    setCustomLong(Math.max(15, Math.min(60, val)));
  };

  const applyCustom = () => {
    setRunning(false);
    switchMode(mode);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const total = mode === 'work'
    ? customWork * 60
    : mode === 'short' ? customBreak * 60 : customLong * 60;
  const progress = ((total - timeLeft) / total) * 100;

  return (
    <div style={wrapperStyle}>
      {/* ✅ Particle Background */}
      <ParticleBackground />

      {/* ✅ Content on top */}
      <div style={contentStyle}>
        <div className="page pomodoro-page">
          <h2>⏱️ Pomodoro Timer</h2>
          <p className="sessions-count">Sessions completed: <strong>{sessions}</strong></p>

          <div className="mode-tabs">
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                className={mode === key ? 'mode-btn active' : 'mode-btn'}
                onClick={() => handleModeSwitch(key)}
              >
                {val.label}
              </button>
            ))}
          </div>

          <div className={`timer-circle ${mode}`}>
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="100" cy="100" r="90"
                fill="none"
                stroke={mode === 'work' ? '#ef4444' : '#22c55e'}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="timer-display">
              <span className="time-text">{mm}:{ss}</span>
              <span className="mode-label">{MODES[mode].label}</span>
            </div>
          </div>

          <div className="timer-controls">
            <button className="btn-secondary" onClick={reset}>↺ Reset</button>
            <button
              className={running ? 'btn-pause' : 'btn-start'}
              onClick={() => setRunning(!running)}
            >
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>

          <div className="custom-settings">
            <h4>Custom Intervals (minutes)</h4>
            <div className="settings-row">
              <label>
                Focus (1–60):
                <input
                  type="number" min="1" max="60"
                  value={customWork}
                  onChange={e => setCustomWork(Math.min(60, Math.max(1, +e.target.value)))}
                />
              </label>
              <label>
                Short Break (1–10):
                <input
                  type="number" min="1" max="10"
                  value={customBreak}
                  onChange={e => handleShortBreakChange(+e.target.value)}
                />
                {customBreak >= 10 && <span className="limit-warning">⚠️ Max 10 min</span>}
              </label>
              <label>
                Long Break (15–60):
                <input
                  type="number" min="15" max="60"
                  value={customLong}
                  onChange={e => handleLongBreakChange(+e.target.value)}
                />
                {customLong <= 15 && <span className="limit-warning">⚠️ Min 15 min</span>}
              </label>
              <button className="btn-primary" onClick={applyCustom}>Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const wrapperStyle = {
  position: "relative",
  minHeight: "100vh",
  background: "#0a0a1a",
  overflow: "hidden",
};

const contentStyle = {
  position: "relative",
  zIndex: 1,
  paddingTop: "2rem",
};