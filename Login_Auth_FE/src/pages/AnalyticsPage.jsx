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
import axios from 'axios';

const API = 'http://localhost:3001/api/analytics';

const PERIODS = [
  { value: 'week',  label: 'Week'  },
  { value: 'month', label: 'Month' },
  { value: 'year',  label: 'Year'  },
  { value: 'all',   label: 'All'   },
];

const SESSION_TYPES = ['manual', 'pomodoro', 'flashcard'];

// Fixed colour palette for subjects — cycles if more than 8 subjects
const SUBJECT_COLORS = {
  React: '#6366f1',
  ML: '#0891b2',
  react: '#ef4444',
  Database: '#f59e0b',
  thms: '#22c55e',
};
const SUBJECT_FALLBACK_COLORS = ['#8b5cf6', '#14b8a6', '#ec4899', '#84cc16'];

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
function formatShortDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatHours(hours) {
  return Number(hours || 0).toFixed(2).replace(/\.?0+$/, '');
}

// ── SVG Bar Chart ──────────────────────────────────────────────────
function BarChart({ data, color = '#6366f1' }) {
  if (!data || data.length === 0) return <p className="no-data">No data for this period.</p>;

  const W = 620, H = 190, PAD_L = 54, PAD_R = 20, PAD_T = 12, PAD_B = 30;
  const chartH = H - PAD_T - PAD_B;
  const max = Math.max(3, Math.ceil(Math.max(...data.map(d => d.hours)) * 4) / 4);
  const step = max / 4;
  const slot = (W - PAD_L - PAD_R) / data.length;
  const barW = Math.min(92, slot * 0.8);
  const ticks = [0, step, step * 2, step * 3, max];

  return (
    <div className="bar-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {ticks.map(t => {
          const y = PAD_T + chartH - (t / max) * chartH;
          return (
            <g key={t}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#edf2f7" strokeDasharray="3,4" />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#555">
                {formatHours(t)}
              </text>
            </g>
          );
        })}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="#9ca3af" strokeWidth={1.3} />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="#9ca3af" strokeWidth={1.3} />

        {data.map((d, i) => {
          const barH = Math.max(3, (d.hours / max) * chartH);
          const x = PAD_L + i * slot + (slot - barW) / 2;
          const y = PAD_T + chartH - barH;

          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH}
                fill={color} rx={6} />
              <title>{d.date}: {d.hours}h</title>
              <text x={x + barW / 2} y={H - 10}
                textAnchor="middle" fontSize={11} fill="#555">
                {formatShortDate(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── SVG Pie Chart ──────────────────────────────────────────
function PieChart({ data }) {
  if (!data || data.length === 0) return <p className="no-data">No subjects logged yet.</p>;

  const total = data.reduce((s, d) => s + d.minutes, 0);
  const R = 66, CX = 150, CY = 98;
  let angle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const pct   = d.minutes / total;
    const start = angle;
    angle      += pct * 2 * Math.PI;
    const end   = angle;
    const large = pct > 0.5 ? 1 : 0;
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end),   y2 = CY + R * Math.sin(end);
    const mid = (start + end) / 2;
    const labelX = CX + (R + 48) * Math.cos(mid);
    const labelY = CY + (R + 26) * Math.sin(mid);
    return {
      path: `M${CX},${CY} L${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} Z`,
      color: SUBJECT_COLORS[d.name] || SUBJECT_FALLBACK_COLORS[i % SUBJECT_FALLBACK_COLORS.length],
      name:  d.name,
      hours: d.hours,
      pct:   Math.round(pct * 100),
      labelX,
      labelY,
      anchor: labelX < CX ? 'end' : 'start',
    };
  });

  return (
    <div className="pie-chart-wrap">
      <svg viewBox="0 0 300 210" width="100%" height="210" role="img" aria-label="Subject breakdown pie chart">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#ffffff" strokeWidth="1.5">
            <title>{s.name}: {s.hours}h ({s.pct}%)</title>
          </path>
        ))}
        {slices.map((s, i) => (
          <text key={`${s.name}-${i}`} x={s.labelX} y={s.labelY}
            textAnchor={s.anchor} fontSize="14" fill={s.color}>
            {s.name} {s.pct}%
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── SVG Line Chart (quiz trend) ────────────────────────────────────
function LineChart({ data }) {
  if (!data || data.length === 0) return <p className="no-data">No quiz data yet.</p>;

  const W = 620, H = 190, PAD_L = 54, PAD_R = 20, PAD_T = 12, PAD_B = 30;
  const chartH = H - PAD_T - PAD_B;
  const max = 100; // percentage axis
  const pts = data.map((d, i) => ({
    x: PAD_L + (i / Math.max(data.length - 1, 1)) * (W - PAD_L - PAD_R),
    y: PAD_T + chartH - (d.score / max) * chartH,
    ...d,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const ticks = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {ticks.map(t => {
        const y = PAD_T + chartH - (t / max) * chartH;
        return (
          <g key={t}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#edf2f7" strokeDasharray="3,4" />
            <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#555">{t}%</text>
          </g>
        );
      })}
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="#9ca3af" strokeWidth={1.3} />
      <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="#9ca3af" strokeWidth={1.3} />

      {pts.length > 1 && (
        <polyline points={polyline} fill="none"
          stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" />
      )}

      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill="#22c55e" />
          <title>{p.date}: {p.score}%</title>
          <text x={p.x} y={H - 10} textAnchor="middle" fontSize={11} fill="#555">
            {formatShortDate(p.date)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  // Dashboard data
  const [summary, setSummary]       = useState(null);
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
      const sumRes = await axios.get(`${API}/summary?period=${period}`);
      setSummary(sumRes.data);
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

  const handleSeed = async () => {
    await axios.post(`${API}/seed`);
    fetchData();
  };

  return (
    <div className="page analytics-page">

      {/* ── Header ── */}
      <div className="page-header">
        <h2>📊 Study Analytics</h2>
        <div className="analytics-header-actions">
          <button className="btn-secondary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancel' : '➕ Log Session'}
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            📄 Export PDF
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
          <p>No data yet. Log a session or seed sample analytics data.</p>
          <button className="btn-primary" onClick={handleSeed}>Seed Data</button>
        </div>
      ) : (
        <div className="dashboard">

          {/* ── Stat Cards ── */}
          <div className="stat-cards">
            <div className="stat-card blue">
              <span className="stat-icon">⏱</span>
              <div>
                <div className="stat-value">{formatHours(summary.totalHours)}h</div>
                <div className="stat-label">Total Studied</div>
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
                <div className="stat-label">Card Retention</div>
              </div>
            </div>
            <div className="stat-card teal">
              <span className="stat-icon">📝</span>
              <div>
                <div className="stat-value">{summary.totalSessions}</div>
                <div className="stat-label">Sessions</div>
              </div>
            </div>
          </div>

          {/* ── Daily Hours Bar + Subject Pie ── */}
          <div className="charts-row">
            <div className="chart-card">
              <h4>🗓️ Hours Studied per Day</h4>
              <BarChart data={summary.dailyHours} />
            </div>
            <div className="chart-card">
              <h4>📚 Subject Breakdown</h4>
              <PieChart data={summary.subjectBreakdown} />
            </div>
          </div>

          {/* ── Quiz Trend + Flashcard Retention ── */}
          <div className="charts-row">
            <div className="chart-card">
              <h4>📝 Quiz Performance Trend</h4>
              <LineChart data={summary.quizTrend} />
            </div>
            <div className="chart-card">
              <h4>🃏 Flashcard Retention</h4>
              <div className="retention-display">
                <div className="retention-circle"
                  style={{ background: `conic-gradient(#6366f1 ${summary.flashcardRetention * 3.6}deg, #e2e8f0 0deg)` }}>
                  <div className="retention-inner">
                    <span className="retention-pct">{summary.flashcardRetention}%</span>
                    <span className="retention-lbl">Retention</span>
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

          {/* ── Goal Rate Bar ── */}
          <div className="chart-card">
            <h4>🎯 Goal Completion</h4>
            <div className="goal-bar-wrap">
              <div className="goal-bar-bg">
                <div className="goal-bar-fill" style={{ width: `${summary.goalRate}%` }} />
              </div>
              <span className="goal-bar-label">{summary.goalRate}% — {summary.goalsCompleted} of {summary.totalDays} sessions</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
