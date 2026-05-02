import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api/recommendations';

// Icon and color mapping for each recommendation type
const TYPE_CONFIG = {
  topic:    { icon: '📘', color: '#6366f1', bg: '#eef2ff', label: 'Topic'    },
  resource: { icon: '🔗', color: '#0891b2', bg: '#ecfeff', label: 'Resource' },
  session:  { icon: '⏱️', color: '#059669', bg: '#ecfdf5', label: 'Session'  },
  tutor:    { icon: '👨‍🏫', color: '#d97706', bg: '#fffbeb', label: 'Tutor'    },
};

const DIFFICULTY_CONFIG = {
  beginner:     { color: '#16a34a', bg: '#dcfce7' },
  intermediate: { color: '#ca8a04', bg: '#fef9c3' },
  advanced:     { color: '#dc2626', bg: '#fee2e2' },
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);  // All recommendation cards
  const [profile, setProfile]                 = useState(null); // User's study profile
  const [activeFilter, setActiveFilter]       = useState('all'); // Type filter tab
  const [showProfileForm, setShowProfileForm] = useState(false); // Profile editor visibility
  const [feedbackGiven, setFeedbackGiven]     = useState({});   // Tracks which cards got feedback
  const [loading, setLoading]                 = useState(true);  // Loading state
  const [error, setError]                     = useState('');

  // Form state for editing the user profile
  const [formSubjects,  setFormSubjects]  = useState('');
  const [formGoals,     setFormGoals]     = useState('');
  const [formDeadlines, setFormDeadlines] = useState([{ subject: '', topic: '', date: '' }]);

  // Fetches recommendations and profile when component mounts
  useEffect(() => {
    fetchAll();
  }, []);

  // Fetches both recommendations and user profile in parallel
  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [recRes, profileRes] = await Promise.all([
        axios.get(API),
        axios.get(`${API}/profile`)
      ]);
      const nextRecommendations = Array.isArray(recRes.data?.recommendations)
        ? recRes.data.recommendations
        : [];
      const nextProfile = profileRes.data || {};

      setRecommendations(nextRecommendations);
      setProfile(nextProfile);

      // Pre-fills the profile form with existing data
      setFormSubjects(nextProfile.subjects?.join(', ') || '');
      setFormGoals(nextProfile.goals?.join(', ')       || '');
      if (nextProfile.deadlines?.length > 0) {
        setFormDeadlines(nextProfile.deadlines.map(d => ({
          subject: d.subject,
          topic:   d.topic,
          date:    d.date ? d.date.split('T')[0] : ''
        })));
      } else {
        setFormDeadlines([{ subject: '', topic: '', date: '' }]);
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      const message = err.response?.data?.message || err.message || 'Unable to load recommendations.';
      setError(`Could not load recommendations: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Saves updated profile to backend and refreshes recommendations
  // Parses comma-separated subjects and goals into arrays
  const handleSaveProfile = async () => {
    try {
      const subjects  = formSubjects.split(',').map(s => s.trim()).filter(Boolean);
      const goals     = formGoals.split(',').map(g => g.trim()).filter(Boolean);
      const deadlines = formDeadlines.filter(d => d.subject && d.date);

      await axios.put(`${API}/profile`, { subjects, goals, deadlines });
      setShowProfileForm(false);
      fetchAll(); // Re-fetches so recommendations re-score with new profile
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      alert('Failed to save profile: ' + message);
    }
  };

  // Sends thumbs up or down feedback for a recommendation
  // Prevents submitting feedback twice for the same card
  const handleFeedback = async (id, type) => {
    if (feedbackGiven[id]) return; // Already gave feedback for this card

    try {
      await axios.post(`${API}/feedback/${id}`, { feedback: type });
      setFeedbackGiven(prev => ({ ...prev, [id]: type })); // Marks card as voted

      // Updates the local count immediately without refetching
      setRecommendations(prev => prev.map(r => {
        if (r._id !== id) return r;
        return {
          ...r,
          thumbsUp:   type === 'up'   ? (r.thumbsUp || 0)   + 1 : (r.thumbsUp || 0),
          thumbsDown: type === 'down' ? (r.thumbsDown || 0) + 1 : (r.thumbsDown || 0),
        };
      }));
    } catch (err) {
      console.error('Feedback error:', err.message);
    }
  };

  // Adds a new empty deadline row to the deadline form
  const addDeadline = () => {
    setFormDeadlines(prev => [...prev, { subject: '', topic: '', date: '' }]);
  };

  // Updates a specific field in a specific deadline row
  const updateDeadline = (index, field, value) => {
    setFormDeadlines(prev => prev.map((d, i) =>
      i === index ? { ...d, [field]: value } : d
    ));
  };

  // Removes a deadline row by index
  const removeDeadline = (index) => {
    setFormDeadlines(prev => prev.filter((_, i) => i !== index));
  };

  // Filters recommendations based on the active type tab
  const filtered = activeFilter === 'all'
    ? recommendations
    : recommendations.filter(r => r.type === activeFilter);

  // Counts how many recommendations exist per type for badge display
  const counts = recommendations.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  // Gets days until a deadline for urgency display
  const getDaysUntil = (dateStr) => {
    const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="page rec-page">
      <nav className="rec-top-nav" aria-label="Study tools">
        <div className="rec-brand">📚 StudyApp</div>
        <div className="rec-nav-links">
          <a href="/flashcards">Flashcards</a>
          <a href="/pomodoro">Pomodoro</a>
          <a href="/scanner">Scanner</a>
          <a href="/recommendations">Recommendations</a>
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="page-header">
        <h2>🎯 Study Recommendations</h2>
        <button className="btn-primary" onClick={() => setShowProfileForm(!showProfileForm)}>
          {showProfileForm ? '✕ Close Profile' : '⚙️ My Study Profile'}
        </button>
      </div>

      {/* ── Profile Editor Panel ── */}
      {showProfileForm && (
        <div className="profile-panel">
          <h3>⚙️ Your Study Profile</h3>
          <p className="profile-hint">
            Fill in your subjects, goals, and deadlines to get personalized recommendations.
          </p>

          <div className="profile-form">
            {/* Subjects input */}
            <div className="profile-field">
              <label>📚 Subjects (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. React, Algorithms, Database"
                value={formSubjects}
                onChange={e => setFormSubjects(e.target.value)}
              />
            </div>

            {/* Goals input */}
            <div className="profile-field">
              <label>🎯 Study Goals (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. improve problem solving, learn hooks"
                value={formGoals}
                onChange={e => setFormGoals(e.target.value)}
              />
            </div>

            {/* Deadlines section */}
            <div className="profile-field">
              <label>⏰ Upcoming Deadlines</label>
              {formDeadlines.map((d, i) => (
                <div key={i} className="deadline-row">
                  <input
                    placeholder="Subject"
                    value={d.subject}
                    onChange={e => updateDeadline(i, 'subject', e.target.value)}
                  />
                  <input
                    placeholder="Topic / Exam name"
                    value={d.topic}
                    onChange={e => updateDeadline(i, 'topic', e.target.value)}
                  />
                  <input
                    type="date"
                    value={d.date}
                    onChange={e => updateDeadline(i, 'date', e.target.value)}
                  />
                  <button className="btn-icon danger" onClick={() => removeDeadline(i)}>🗑️</button>
                </div>
              ))}
              <button className="btn-secondary" style={{ marginTop: '0.5rem' }} onClick={addDeadline}>
                + Add Deadline
              </button>
            </div>

            <div className="profile-actions">
              <button className="btn-primary" onClick={handleSaveProfile}>
                💾 Save Profile & Refresh
              </button>
              <button className="btn-secondary" onClick={() => setShowProfileForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rec-error" role="alert">
          <strong>Recommendations are not available.</strong>
          <span>{error}</span>
          <button className="btn-secondary" onClick={fetchAll}>Try Again</button>
        </div>
      )}

      {/* ── Active Profile Summary ── */}
      {profile && (profile.subjects?.length > 0 || profile.deadlines?.length > 0) && (
        <div className="profile-summary">
          {profile.subjects?.length > 0 && (
            <div className="summary-row">
              <span className="summary-label">📚 Studying:</span>
              <div className="tag-list">
                {profile.subjects.map(s => (
                  <span key={s} className="subject-tag">{s}</span>
                ))}
              </div>
            </div>
          )}
          {profile.deadlines?.length > 0 && (
            <div className="summary-row">
              <span className="summary-label">⏰ Deadlines:</span>
              <div className="tag-list">
                {profile.deadlines.map((d, i) => {
                  const days = getDaysUntil(d.date);
                  return (
                    <span key={i} className={`deadline-tag ${days <= 3 ? 'urgent' : days <= 7 ? 'soon' : ''}`}>
                      {d.subject}: {d.topic} ({days <= 0 ? 'Today!' : `${days}d`})
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="rec-filter-tabs">
        {['all', 'topic', 'resource', 'session', 'tutor'].map(f => (
          <button
            key={f}
            className={activeFilter === f ? 'rec-tab active' : 'rec-tab'}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'all' ? '✨ All' : `${TYPE_CONFIG[f].icon} ${TYPE_CONFIG[f].label}s`}
            <span className="rec-tab-count">
              {f === 'all' ? recommendations.length : (counts[f] || 0)}
            </span>
          </button>
        ))}
      </div>

      {/* ── Recommendations Grid ── */}
      {loading ? (
        <div className="rec-loading">
          <div className="rec-spinner" />
          <p>Loading personalized recommendations...</p>
        </div>
      ) : error ? null : filtered.length === 0 ? (
        <div className="rec-empty">
          <span>🔍</span>
          <p>No recommendations yet. Set up your study profile to get started!</p>
          <button className="btn-primary" onClick={() => setShowProfileForm(true)}>
            Set Up Profile
          </button>
        </div>
      ) : (
        <div className="rec-grid">
          {filtered.map(rec => {
            const typeConf = TYPE_CONFIG[rec.type]       || TYPE_CONFIG.topic;
            const diffConf = DIFFICULTY_CONFIG[rec.difficulty] || DIFFICULTY_CONFIG.intermediate;
            const voted    = feedbackGiven[rec._id];
            const thumbsUp = rec.thumbsUp || 0;
            const thumbsDown = rec.thumbsDown || 0;
            const total    = thumbsUp + thumbsDown;
            const likeRatio = total > 0 ? Math.round((thumbsUp / total) * 100) : null;

            return (
              <div key={rec._id} className="rec-card">

                {/* Card header with type badge and difficulty */}
                <div className="rec-card-header">
                  <span className="rec-type-badge" style={{ background: typeConf.bg, color: typeConf.color }}>
                    {typeConf.icon} {typeConf.label}
                  </span>
                  <span className="rec-difficulty" style={{ background: diffConf.bg, color: diffConf.color }}>
                    {rec.difficulty}
                  </span>
                </div>

                {/* Title */}
                <h4 className="rec-title">{rec.title}</h4>

                {/* Subject */}
                {rec.subject && (
                  <span className="rec-subject">📚 {rec.subject}</span>
                )}

                {/* Description */}
                <p className="rec-description">{rec.description}</p>

                {/* Tags */}
                {rec.tags?.length > 0 && (
                  <div className="rec-tags">
                    {rec.tags.map(tag => (
                      <span key={tag} className="rec-tag">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* External link for resources */}
                {rec.url && (
                  <a href={rec.url} target="_blank" rel="noreferrer" className="rec-link">
                    🔗 Open Resource →
                  </a>
                )}

                {/* Footer with feedback buttons and like ratio */}
                <div className="rec-card-footer">
                  <div className="rec-feedback">
                    <span className="feedback-label">Helpful?</span>
                    {/* Thumbs up button — disabled after voting */}
                    <button
                      className={`feedback-btn up ${voted === 'up' ? 'voted' : ''}`}
                      onClick={() => handleFeedback(rec._id, 'up')}
                      disabled={!!voted}
                      title="This was helpful"
                    >
                      👍 {thumbsUp}
                    </button>
                    {/* Thumbs down button — disabled after voting */}
                    <button
                      className={`feedback-btn down ${voted === 'down' ? 'voted' : ''}`}
                      onClick={() => handleFeedback(rec._id, 'down')}
                      disabled={!!voted}
                      title="Not helpful"
                    >
                      👎 {thumbsDown}
                    </button>
                  </div>

                  {/* Like ratio shown if there are any votes */}
                  {likeRatio !== null && (
                    <span className="like-ratio" style={{ color: likeRatio >= 50 ? '#16a34a' : '#dc2626' }}>
                      {likeRatio}% helpful
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
