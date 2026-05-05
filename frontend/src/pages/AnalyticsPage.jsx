import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import jsPDF   from 'jspdf';
import html2canvas from 'html2canvas';

const API = 'http://localhost:5000/api/analytics';

// Colors used for the pie chart subject segments
const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#0891b2','#d97706','#8b5cf6'];

export default function AnalyticsPage() {
  const [data, setData]         = useState(null);    // All summary metrics from backend
  const [period, setPeriod]     = useState('week');  // Selected time period filter
  const [loading, setLoading]   = useState(true);    // Loading state for spinner
  const [showForm, setShowForm] = useState(false);   // Controls log session form visibility
  const [exporting, setExporting] = useState(false); // PDF export loading state
  const dashboardRef = useRef(null); // Ref to the dashboard DOM for PDF capture

  // Form state for logging a new study session manually
  const [formSubject,  setFormSubject]  = useState('');
  const [formMinutes,  setFormMinutes]  = useState('');
  const [formType,     setFormType]     = useState('manual');
  const [formGoal,     setFormGoal]     = useState(false);
  const [formPomodoro, setFormPomodoro] = useState('0');
  const [formFcTotal,  setFormFcTotal]  = useState('0');
  const [formFcCorrect,setFormFcCorrect]= useState('0');
  const [formQzTotal,  setFormQzTotal]  = useState('0');
  const [formQzCorrect,setFormQzCorrect]= useState('0');

  // Fetches analytics summary whenever the period filter changes
  useEffect(() => { fetchSummary(); }, [period]);

  // Calls the backend summary endpoint with the selected period
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/summary?period=${period}`);
      setData(res.data);
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
    setLoading(false);
  };

  // Submits a new study session log to the backend
  // Resets the form and refreshes the dashboard after saving
  const handleLogSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API, {
        subject:        formSubject,
        minutesStudied: parseInt(formMinutes),
        sessionType:    formType,
        goalCompleted:  formGoal,
        pomodoroCount:  parseInt(formPomodoro),
        flashcardStats: { total: parseInt(formFcTotal),  correct: parseInt(formFcCorrect)  },
        quizStats:      { total: parseInt(formQzTotal),  correct: parseInt(formQzCorrect)  },
      });
      // Resets all form fields
      setFormSubject(''); setFormMinutes(''); setFormType('manual');
      setFormGoal(false); setFormPomodoro('0');
      setFormFcTotal('0'); setFormFcCorrect('0');
      setFormQzTotal('0'); setFormQzCorrect('0');
      setShowForm(false);
      fetchSummary(); // Refreshes all charts with new data
    } catch (err) {
      alert('Failed to log session: ' + err.message);
    }
  };

  // Exports the dashboard as a PDF report
  // Uses html2canvas to screenshot the dashboard, then jsPDF to create the PDF
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = dashboardRef.current;
      const canvas  = await html2canvas(element, {
        scale: 2,           // Higher scale = sharper PDF
        useCORS: true,
        backgroundColor: '#f8fafc'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF('p', 'mm', 'a4'); // Portrait A4 PDF

      const pdfWidth  = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Adds title and timestamp to the PDF
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Study Analytics Report', 14, 15);

      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Generated: ${new Date().toLocaleDateString()} — Period: ${period}`, 14, 22);
      pdf.text(`Total Hours: ${data?.totalHours}h  |  Streak: ${data?.streak} days  |  Goal Rate: ${data?.goalRate}%`, 14, 28);

      // Adds the dashboard screenshot below the header
      pdf.addImage(imgData, 'PNG', 0, 35, pdfWidth, pdfHeight);

      pdf.save(`study-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    }
    setExporting(false);
  };

  // Formats minutes into "Xh Ym" display string e.g. 145 → "2h 25m"
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Formats a date string to short display e.g. "2026-04-15" → "Apr 15"
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Builds heatmap intensity color based on pomodoro session count
  // More sessions = darker color
  const getHeatColor = (count) => {
    if (count === 0) return '#f1f5f9';
    if (count <= 1)  return '#c7d2fe';
    if (count <= 2)  return '#818cf8';
    if (count <= 4)  return '#6366f1';
    return '#4338ca';
  };

  return (
    <div className="page analytics-page">

      {/* ── Header ── */}
      <div className="page-header">
        <h2>📊 Study Analytics</h2>
        <div className="analytics-header-actions">
          <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Close' : '+ Log Session'}
          </button>
          <button className="btn-primary" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? '⏳ Exporting...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {/* ── Period Filter ── */}
      <div className="period-tabs">
        {['week', 'month', 'year', 'all'].map(p => (
          <button
            key={p}
            className={period === p ? 'period-tab active' : 'period-tab'}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Log Session Form ── */}
      {showForm && (
        <form className="log-session-form" onSubmit={handleLogSession}>
          <h4>📝 Log a Study Session</h4>
          <div className="log-grid">
            <div className="log-field">
              <label>Subject</label>
              <input
                placeholder="e.g. React"
                value={formSubject}
                onChange={e => setFormSubject(e.target.value)}
                required
              />
            </div>
            <div className="log-field">
              <label>Minutes Studied</label>
              <input
                type="number" min="1" placeholder="e.g. 60"
                value={formMinutes}
                onChange={e => setFormMinutes(e.target.value)}
                required
              />
            </div>
            <div className="log-field">
              <label>Session Type</label>
              <select value={formType} onChange={e => setFormType(e.target.value)}>
                <option value="manual">Manual</option>
                <option value="pomodoro">Pomodoro</option>
                <option value="flashcard">Flashcard</option>
              </select>
            </div>
            <div className="log-field">
              <label>Pomodoro Sessions</label>
              <input type="number" min="0" value={formPomodoro} onChange={e => setFormPomodoro(e.target.value)} />
            </div>
            <div className="log-field">
              <label>Flashcards Total / Correct</label>
              <div className="split-input">
                <input type="number" min="0" placeholder="Total"   value={formFcTotal}   onChange={e => setFormFcTotal(e.target.value)}   />
                <input type="number" min="0" placeholder="Correct" value={formFcCorrect} onChange={e => setFormFcCorrect(e.target.value)} />
              </div>
            </div>
            <div className="log-field">
              <label>Quiz Total / Correct</label>
              <div className="split-input">
                <input type="number" min="0" placeholder="Total"   value={formQzTotal}   onChange={e => setFormQzTotal(e.target.value)}   />
                <input type="number" min="0" placeholder="Correct" value={formQzCorrect} onChange={e => setFormQzCorrect(e.target.value)} />
              </div>
            </div>
            <div className="log-field checkbox-field">
              <label>
                <input type="checkbox" checked={formGoal} onChange={e => setFormGoal(e.target.checked)} />
                Goal completed today?
              </label>
            </div>
          </div>
          <div className="log-actions">
            <button type="submit" className="btn-primary">💾 Save Session</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rec-loading">
          <div className="rec-spinner" />
          <p>Loading analytics...</p>
        </div>
      ) : !data || data.totalSessions === 0 ? (
        <div className="rec-empty">
          <span>📊</span>
          <p>No study data yet. Log a session or seed sample data.</p>
          <button className="btn-primary" onClick={async () => {
            await axios.post(`${API}/seed`);
            fetchSummary();
          }}>Load Sample Data</button>
        </div>
      ) : (

        // ── Dashboard (captured for PDF) ──
        <div ref={dashboardRef} className="dashboard">

          {/* ── Stat Cards Row ── */}
          <div className="stat-cards">
            <div className="stat-card blue">
              <span className="stat-icon">⏱️</span>
              <div>
                <p className="stat-value">{data.totalHours}h</p>
                <p className="stat-label">Total Studied</p>
              </div>
            </div>
            <div className="stat-card green">
              <span className="stat-icon">🔥</span>
              <div>
                <p className="stat-value">{data.streak}</p>
                <p className="stat-label">Day Streak</p>
              </div>
            </div>
            <div className="stat-card purple">
              <span className="stat-icon">🎯</span>
              <div>
                <p className="stat-value">{data.goalRate}%</p>
                <p className="stat-label">Goal Rate</p>
              </div>
            </div>
            <div className="stat-card orange">
              <span className="stat-icon">🃏</span>
              <div>
                <p className="stat-value">{data.flashcardRetention}%</p>
                <p className="stat-label">Card Retention</p>
              </div>
            </div>
            <div className="stat-card teal">
              <span className="stat-icon">📝</span>
              <div>
                <p className="stat-value">{data.totalSessions}</p>
                <p className="stat-label">Sessions</p>
              </div>
            </div>
          </div>

          {/* ── Charts Row 1 — Bar + Pie ── */}
          <div className="charts-row">

            {/* Daily hours bar chart */}
            <div className="chart-card wide">
              <h4>📅 Hours Studied per Day</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailyHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [`${v}h`, 'Hours']}
                    labelFormatter={formatDate}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subject breakdown pie chart */}
            <div className="chart-card">
              <h4>📚 Subject Breakdown</h4>
              {data.subjectBreakdown.length === 0 ? (
                <p className="no-data">No subject data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.subjectBreakdown}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                      labelLine={false}
                    >
                      {data.subjectBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}h`, 'Hours']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Charts Row 2 — Quiz Line + Flashcard Bar ── */}
          <div className="charts-row">

            {/* Quiz performance line chart */}
            <div className="chart-card">
              <h4>📝 Quiz Performance Trend</h4>
              {data.quizTrend.length === 0 ? (
                <p className="no-data">No quiz data logged yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.quizTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(v) => [`${v}%`, 'Score']}
                      labelFormatter={formatDate}
                    />
                    <Line
                      type="monotone" dataKey="score"
                      stroke="#22c55e" strokeWidth={2}
                      dot={{ fill: '#22c55e', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Flashcard retention card */}
            <div className="chart-card">
              <h4>🃏 Flashcard Retention</h4>
              <div className="retention-display">
                {/* Large circular retention percentage */}
                <div className="retention-circle" style={{
                  background: `conic-gradient(
                    #6366f1 ${data.flashcardRetention * 3.6}deg,
                    #e2e8f0 0deg
                  )`
                }}>
                  <div className="retention-inner">
                    <span className="retention-pct">{data.flashcardRetention}%</span>
                    <span className="retention-lbl">Retention</span>
                  </div>
                </div>
                {/* Stats below the circle */}
                <div className="retention-stats">
                  <div className="ret-stat">
                    <span className="ret-val green">{data.correctCards}</span>
                    <span className="ret-key">Correct</span>
                  </div>
                  <div className="ret-stat">
                    <span className="ret-val red">{data.totalCards - data.correctCards}</span>
                    <span className="ret-key">Missed</span>
                  </div>
                  <div className="ret-stat">
                    <span className="ret-val">{data.totalCards}</span>
                    <span className="ret-key">Total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Pomodoro Heatmap ── */}
          <div className="chart-card full-width">
            <h4>🍅 Pomodoro Heatmap</h4>
            <div className="heatmap-grid">
              {data.pomodoroHeatmap.length === 0 ? (
                <p className="no-data">No pomodoro data yet</p>
              ) : (
                data.pomodoroHeatmap.map((day, i) => (
                  <div
                    key={i}
                    className="heatmap-cell"
                    style={{ background: getHeatColor(day.count) }}
                    title={`${formatDate(day.date)}: ${day.count} pomodoro${day.count !== 1 ? 's' : ''}`}
                  />
                ))
              )}
            </div>
            {/* Heatmap legend */}
            <div className="heatmap-legend">
              <span>Less</span>
              {[0,1,2,3,5].map(n => (
                <div key={n} className="legend-cell" style={{ background: getHeatColor(n) }} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* ── Goal Completion Summary ── */}
          <div className="chart-card full-width">
            <h4>🎯 Goal Completion</h4>
            <div className="goal-bar-wrap">
              <div className="goal-bar-bg">
                <div
                  className="goal-bar-fill"
                  style={{ width: `${data.goalRate}%` }}
                />
              </div>
              <span className="goal-bar-label">{data.goalRate}% — {data.goalsCompleted} of {data.totalDays} sessions</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}