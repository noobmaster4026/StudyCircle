/**
 * AnalyticsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Study analytics dashboard — uses CSS classes from teammate's App.css.
 * Charts are built with inline SVG so no extra packages are needed.
 *
 * API: GET /api/analytics/summary?period=week|month|year|all
 *      POST /api/analytics   (log a session manually)
 *      DELETE /api/analytics/:id
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:3001/api/analytics';

const PERIODS = [
  { value: 'week',  label: 'This Week'  },
  { value: 'month', label: 'This Month' },
  { value: 'year',  label: 'This Year'  },
  { value: 'all',   label: 'All Time'   },
];

const SESSION_TYPES = ['manual', 'pomodoro', 'flashcard'];

// Fixed colour palette for subjects — cycles if more than 8 subjects
const SUBJECT_COLORS = [
  '#6366f1','#22c55e','#f59e0b','#0891b2',
  '#ec4899','#ef4444','#8b5cf6','#14b8a6',
];

// Heatmap colour scale: 0 sessions → 4+ sessions
const HEAT_COLORS = ['#f1f5f9','#c7d2fe','#818cf8','#6366f1','#3730a3'];
function heatColor(count) {
  if (count === 0) return HEAT_COLORS[0];
  if (count === 1) return HEAT_COLORS[1];
  if (count === 2) return HEAT_COLORS[2];
  if (count === 3) return HEAT_COLORS[3];
  return HEAT_COLORS[4];
}

// ── SVG Bar Chart ──────────────────────────────────────────────────
function BarChart({ data, color = '#6366f1', label = 'hours' }) {
  if (!data || data.length === 0) return <p className="no-data">No data for this period.</p>;

  const W = 600, H = 160, PAD = 40, BAR_GAP = 4;
  const max    = Math.max(...data.map(d => d.hours), 0.1);
  const barW   = Math.max(8, Math.floor((W - PAD * 2) / data.length) - BAR_GAP);

  return (
    <div className="bar-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H + 30}`} width="100%" height={H + 30}>
        {/* Y axis line */}
        <line x1={PAD} y1={0} x2={PAD} y2={H} stroke="#e2e8f0" strokeWidth={1} />
        <line x1={PAD} y1={H} x2={W - PAD} y2={H} stroke="#e2e8f0" strokeWidth={1} />

        {data.map((d, i) => {
          const barH = Math.max(2, (d.hours / max) * (H - 20));
          const x    = PAD + i * ((W - PAD * 2) / data.length) + BAR_GAP / 2;
          const y    = H - barH;

          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH}
                fill={color} rx={3} opacity={0.85} />
              {/* Value label on hover via title */}
              <title>{d.date}: {d.hours}h</title>
              {/* X axis label — show every nth */}
              {(i % Math.ceil(data.length / 7) === 0) && (
                <text x={x + barW / 2} y={H + 16}
                  textAnchor="middle" fontSize={9} fill="#94a3b8">
                  {d.date.slice(5)} {/* MM-DD */}
                </text>
              )}
            </g>
          );
        })}

        {/* Max label */}
        <text x={PAD - 4} y={12} textAnchor="end" fontSize={9} fill="#94a3b8">
          {max.toFixed(1)}h
        </text>
      </svg>
    </div>
  );
}

// ── SVG Pie / Donut Chart ──────────────────────────────────────────
function PieChart({ data }) {
  if (!data || data.length === 0) return <p className="no-data">No subjects logged yet.</p>;

  const total = data.reduce((s, d) => s + d.minutes, 0);
  const R = 60, CX = 80, CY = 80;
  let angle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const pct   = d.minutes / total;
    const start = angle;
    angle      += pct * 2 * Math.PI;
    const end   = angle;
    const large = pct > 0.5 ? 1 : 0;
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end),   y2 = CY + R * Math.sin(end);
    return {
      path: `M${CX},${CY} L${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} Z`,
      color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      name:  d.name,
      hours: d.hours,
      pct:   Math.round(pct * 100),
    };
  });

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 160 160" width={140} height={140} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.9}>
            <title>{s.name}: {s.hours}h ({s.pct}%)</title>
          </path>
        ))}
        {/* Centre hole */}
        <circle cx={CX} cy={CY} r={30} fill="white" />
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize={10} fontWeight="700" fill="#1e293b">
          {(total / 60).toFixed(1)}h
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize={8} fill="#94a3b8">total</text>
      </svg>

      <div className="pie-legend">
        {slices.map((s, i) => (
          <div key={i} className="pie-legend-item">
            <span className="pie-legend-dot" style={{ background: s.color }} />
            <span style={{ color: '#475569', fontWeight: 600 }}>{s.name}</span>
            <span style={{ color: '#94a3b8', marginLeft: 'auto', paddingLeft: 8 }}>
              {s.hours}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SVG Line Chart (quiz trend) ────────────────────────────────────
function LineChart({ data }) {
  if (!data || data.length === 0) return <p className="no-data">No quiz data yet.</p>;

  const W = 600, H = 120, PAD = 40;
  const max = 100; // percentage axis
  const pts = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2),
    y: H - (d.score / max) * (H - 20),
    ...d,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" height={H + 24}>
      <line x1={PAD} y1={H} x2={W - PAD} y2={H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={PAD} y1={0} x2={PAD}     y2={H} stroke="#e2e8f0" strokeWidth={1} />

      {/* 50% reference line */}
      <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2}
        stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4,4" />
      <text x={PAD - 4} y={H / 2 + 4} textAnchor="end" fontSize={9} fill="#94a3b8">50%</text>

      {pts.length > 1 && (
        <polyline points={polyline} fill="none"
          stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" />
      )}

      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#6366f1" />
          <title>{p.date}: {p.score}%</title>
          {(i % Math.ceil(pts.length / 6) === 0) && (
            <text x={p.x} y={H + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {p.date.slice(5)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  const navigate = useNavigate();

  // Dashboard data
  const [summary, setSummary]       = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [period, setPeriod]         = useState('week');
  const [loading, setLoading]       = useState(true);

  // Log session form
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    subject:      '',
    minutesStudied: 30,
    sessionType:  'manual',
    flashTotal:   0,
    flashCorrect: 0,
    quizTotal:    0,
    quizCorrect:  0,
    goalCompleted: false,
    pomodoroCount: 0,
  });

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, sessRes] = await Promise.all([
        axios.get(`${API}/summary?period=${period}`),
        axios.get(API),
      ]);
      setSummary(sumRes.data);
      setSessions(sessRes.data.slice(0, 20)); // show last 20
    } catch (err) {
      console.error('Analytics fetch error:', err.message);
    }
    setLoading(false);
  };

  const handleLog = async () => {
    if (!form.subject.trim() || !form.minutesStudied) {
      alert('Subject and minutes are required.');
      return;
    }
    setSaving(true);
    try {
      await axios.post(API, {
        date:           form.date,
        subject:        form.subject.trim(),
        minutesStudied: Number(form.minutesStudied),
        sessionType:    form.sessionType,
        flashcardStats: { total: Number(form.flashTotal), correct: Number(form.flashCorrect) },
        quizStats:      { total: Number(form.quizTotal),  correct: Number(form.quizCorrect)  },
        goalCompleted:  form.goalCompleted,
        pomodoroCount:  Number(form.pomodoroCount),
      });
      setShowForm(false);
      setForm(f => ({ ...f, subject: '', minutesStudied: 30 }));
      fetchData();
    } catch (err) {
      alert('Failed to log session: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    await axios.delete(`${API}/${id}`);
    fetchData();
  };

  const handleSeed = async () => {
    await axios.post(`${API}/seed`);
    fetchData();
  };

  const f = v => v; // passthrough helper for readability

  return (
    <div className="page analytics-page">

      {/* ── Header ── */}
      <div className="page-header">
        <h2>📊 Study Analytics</h2>
        <div className="analytics-header-actions">
          <button className="btn-secondary" onClick={() => navigate('/student')}>
            ← Dashboard
          </button>
          <button className="btn-secondary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancel' : '➕ Log Session'}
          </button>
          <button className="btn-secondary" onClick={handleSeed} title="Seed 30 days of sample data">
            🌱 Seed Data
          </button>
        </div>
      </div>

      {/* ── Period tabs ── */}
      <div className="period-tabs">
        {PERIODS.map(p => (
          <button key={p.value}
            className={`period-tab ${period === p.value ? 'active' : ''}`}
            onClick={() => setPeriod(p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Log Session Form ── */}
      {showForm && (
        <div className="log-session-form">
          <h4>📝 Log a Study Session</h4>
          <div className="log-grid">
            <div className="log-field">
              <label>Date</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="log-field">
              <label>Subject *</label>
              <input type="text" placeholder="e.g. React, Algorithms"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="log-field">
              <label>Minutes Studied *</label>
              <input type="number" min={1} max={480} value={form.minutesStudied}
                onChange={e => setForm(f => ({ ...f, minutesStudied: e.target.value }))} />
            </div>
            <div className="log-field">
              <label>Session Type</label>
              <select value={form.sessionType}
                onChange={e => setForm(f => ({ ...f, sessionType: e.target.value }))}>
                {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="log-field">
              <label>Flashcards (correct / total)</label>
              <div className="split-input">
                <input type="number" min={0} placeholder="Correct"
                  value={form.flashCorrect}
                  onChange={e => setForm(f => ({ ...f, flashCorrect: e.target.value }))} />
                <input type="number" min={0} placeholder="Total"
                  value={form.flashTotal}
                  onChange={e => setForm(f => ({ ...f, flashTotal: e.target.value }))} />
              </div>
            </div>
            <div className="log-field">
              <label>Quiz (correct / total)</label>
              <div className="split-input">
                <input type="number" min={0} placeholder="Correct"
                  value={form.quizCorrect}
                  onChange={e => setForm(f => ({ ...f, quizCorrect: e.target.value }))} />
                <input type="number" min={0} placeholder="Total"
                  value={form.quizTotal}
                  onChange={e => setForm(f => ({ ...f, quizTotal: e.target.value }))} />
              </div>
            </div>
            <div className="log-field">
              <label>Pomodoro Sessions</label>
              <input type="number" min={0} value={form.pomodoroCount}
                onChange={e => setForm(f => ({ ...f, pomodoroCount: e.target.value }))} />
            </div>
            <div className="log-field checkbox-field">
              <label>
                <input type="checkbox" checked={form.goalCompleted}
                  onChange={e => setForm(f => ({ ...f, goalCompleted: e.target.checked }))} />
                Goal completed today ✅
              </label>
            </div>
          </div>
          <div className="log-actions">
            <button className="btn-primary" onClick={handleLog} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Session'}
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="rec-loading">
          <div className="rec-spinner" />
          <p>Loading your analytics…</p>
        </div>
      ) : !summary ? (
        <div className="rec-empty">
          <span>📊</span>
          <p>No data yet. Log a session or click 🌱 Seed Data to populate sample data.</p>
        </div>
      ) : (
        <div className="dashboard">

          {/* ── Stat Cards ── */}
          <div className="stat-cards">
            <div className="stat-card blue">
              <span className="stat-icon">⏱</span>
              <div>
                <div className="stat-value">{summary.totalHours}h</div>
                <div className="stat-label">Hours Studied</div>
              </div>
            </div>
            <div className="stat-card green">
              <span className="stat-icon">🔥</span>
              <div>
                <div className="stat-value">{summary.streak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>
            <div className="stat-card purple">
              <span className="stat-icon">🎯</span>
              <div>
                <div className="stat-value">{summary.goalRate}%</div>
                <div className="stat-label">Goal Rate</div>
              </div>
            </div>
            <div className="stat-card orange">
              <span className="stat-icon">🃏</span>
              <div>
                <div className="stat-value">{summary.flashcardRetention}%</div>
                <div className="stat-label">Flashcard Retention</div>
              </div>
            </div>
            <div className="stat-card teal">
              <span className="stat-icon">📅</span>
              <div>
                <div className="stat-value">{summary.totalSessions}</div>
                <div className="stat-label">Sessions</div>
              </div>
            </div>
          </div>

          {/* ── Daily Hours Bar + Subject Pie ── */}
          <div className="charts-row">
            <div className="chart-card">
              <h4>📅 Daily Study Hours</h4>
              <BarChart data={summary.dailyHours} />
            </div>
            <div className="chart-card">
              <h4>📚 By Subject</h4>
              <PieChart data={summary.subjectBreakdown} />
            </div>
          </div>

          {/* ── Quiz Trend + Flashcard Retention ── */}
          <div className="charts-row">
            <div className="chart-card">
              <h4>📝 Quiz Score Trend</h4>
              <LineChart data={summary.quizTrend} />
            </div>
            <div className="chart-card">
              <h4>🃏 Flashcard Retention</h4>
              <div className="retention-display">
                <div className="retention-circle"
                  style={{ background: `conic-gradient(#6366f1 ${summary.flashcardRetention * 3.6}deg, #e2e8f0 0deg)` }}>
                  <div className="retention-inner">
                    <span className="retention-pct">{summary.flashcardRetention}%</span>
                    <span className="retention-lbl">RETENTION</span>
                  </div>
                </div>
                <div className="retention-stats">
                  <div className="ret-stat">
                    <span className="ret-val green">{summary.correctCards}</span>
                    <span className="ret-key">Correct</span>
                  </div>
                  <div className="ret-stat">
                    <span className="ret-val red">{summary.totalCards - summary.correctCards}</span>
                    <span className="ret-key">Missed</span>
                  </div>
                  <div className="ret-stat">
                    <span className="ret-val">{summary.totalCards}</span>
                    <span className="ret-key">Total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Goal Rate Bar ── */}
          <div className="chart-card">
            <h4>🎯 Goal Completion — {summary.goalsCompleted} of {summary.totalDays} days</h4>
            <div className="goal-bar-wrap">
              <div className="goal-bar-bg">
                <div className="goal-bar-fill" style={{ width: `${summary.goalRate}%` }} />
              </div>
              <span className="goal-bar-label">{summary.goalRate}% of study days had goals completed</span>
            </div>
          </div>

          {/* ── Pomodoro Heatmap ── */}
          {summary.pomodoroHeatmap.length > 0 && (
            <div className="chart-card">
              <h4>🍅 Pomodoro Heatmap</h4>
              <div className="heatmap-grid">
                {summary.pomodoroHeatmap.map(({ date, count }) => (
                  <div key={date} className="heatmap-cell"
                    style={{ background: heatColor(count) }}
                    title={`${date}: ${count} pomodoro${count !== 1 ? 's' : ''}`} />
                ))}
              </div>
              <div className="heatmap-legend">
                <span>Less</span>
                {HEAT_COLORS.map((c, i) => (
                  <span key={i} className="legend-cell" style={{ background: c }} />
                ))}
                <span>More</span>
              </div>
            </div>
          )}

          {/* ── Recent Sessions Log ── */}
          <div className="chart-card full-width">
            <h4>📋 Recent Sessions</h4>
            {sessions.length === 0 ? (
              <p className="no-data">No sessions logged yet.</p>
            ) : (
              <div className="session-list">
                {sessions.map(s => (
                  <div key={s._id} className="session-row">
                    <span className="session-date">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                    <span className="session-subject">{s.subject}</span>
                    <span className="session-mins">{s.minutesStudied} min</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{s.sessionType}</span>
                    {s.goalCompleted && <span title="Goal completed">✅</span>}
                    <button className="session-delete" onClick={() => handleDelete(s._id)}
                      title="Delete session">🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
