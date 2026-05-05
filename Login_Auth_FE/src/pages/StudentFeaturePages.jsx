import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentFeaturePages.css";

function useStoredList(key, initialValue) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || initialValue;
    } catch {
      return initialValue;
    }
  });

  const saveItems = (next) => {
    setItems(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return [items, saveItems];
}

function PageShell({ title, desc, pill, children, className = "" }) {
  const navigate = useNavigate();

  return (
    <div className={`feature-shell ${className}`.trim()}>
      <nav className="feature-topbar">
        <span className="feature-brand">StudyCircle</span>
        <button type="button" className="feature-back" onClick={() => navigate("/student")}>
          Back to Dashboard
        </button>
      </nav>

      <main className="feature-page">
        <header className="feature-hero">
          <div>
            <h1>{title}</h1>
            <p>{desc}</p>
          </div>
          {pill && <span className="feature-pill">{pill}</span>}
        </header>
        {children}
      </main>
    </div>
  );
}

const API_BASE = "http://localhost:3001/api";

function getUserId() {
  return localStorage.getItem("userId") || "guest";
}

export function DoubtSolverPage() {
  const [messages, setMessages] = useStoredList(`doubtSolverMessages:${getUserId()}`, []);
  const [form, setForm] = useState({ subject: "", question: "", context: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askQuestion = async () => {
    if (!form.question.trim()) return;

    const userMessage = {
      id: `q-${Date.now()}`,
      role: "student",
      text: form.question.trim(),
      subject: form.subject.trim() || "General",
    };

    setMessages([userMessage, ...messages]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/doubt-solver/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to solve this doubt.");

      const answerMessage = {
        id: `a-${Date.now()}`,
        role: "ai",
        text: data.answer,
        subject: userMessage.subject,
      };
      setMessages([answerMessage, userMessage, ...messages]);
      setForm({ subject: form.subject, question: "", context: "" });
    } catch (err) {
      setError(err.message);
      setMessages([userMessage, ...messages]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="AI Doubt Solver Chatbot" desc="Ask study questions and get step-by-step explanations with a quick practice prompt." pill={loading ? "Thinking" : `${messages.length} messages`}>
      <div className="feature-grid">
        <section className="feature-card">
          <h2>Ask a doubt</h2>
          <label className="feature-field">Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Algorithms, calculus, biology..." /></label>
          <label className="feature-field">Question<textarea rows="5" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="What are you stuck on?" /></label>
          <label className="feature-field">Context<textarea rows="3" value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="Optional notes, attempted solution, or class topic" /></label>
          <button type="button" className="feature-btn" onClick={askQuestion} disabled={loading}>{loading ? "Solving..." : "Ask AI"}</button>
          {error && <p className="feature-error">{error}</p>}
        </section>
        <section className="feature-card">
          <h2>Chat history</h2>
          <div className="feature-list">
            {messages.length === 0 ? <p className="feature-muted">No doubts asked yet.</p> : messages.map((message) => (
              <div key={message.id} className={`feature-item ${message.role === "ai" ? "feature-answer" : ""}`}>
                <strong>{message.role === "ai" ? "AI Tutor" : `You - ${message.subject}`}</strong>
                <p className="feature-preline">{message.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export function StudyStreakPage() {
  const userId = getUserId();
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStreak = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/study-streaks/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load streak.");
      setStreak(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  const checkIn = async () => {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/study-streaks/${userId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to check in.");
      setStreak(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = streak?.studyDates?.includes(today);
  const earnedBadges = (streak?.badges || []).filter((badge) => badge.earned);

  return (
    <PageShell className="study-journey-shell">
      {error && <p className="feature-error">{error}</p>}
      <section className="study-journey">
        <header className="study-journey-header">
          <h1>Your Study Journey</h1>
          <p>Consistency is key! Log your sessions daily to keep your flame burning and unlock badges.</p>
        </header>

        <div className="journey-stat-row">
          <article className="journey-stat-card current">
            <span className="journey-stat-icon" aria-hidden="true">🔥</span>
            <strong>{streak?.currentStreak || 0}</strong>
            <p>Day Streak</p>
          </article>
          <article className="journey-stat-card longest">
            <span className="journey-stat-icon" aria-hidden="true">⚡</span>
            <strong>{streak?.longestStreak || 0}</strong>
            <p>Longest Streak</p>
          </article>
        </div>

        <section className="journey-badges-panel">
          <h2>Achievement Badges</h2>
          {earnedBadges.length === 0 ? (
            <p className="journey-empty">You haven't earned any badges yet. Start studying to unlock them!</p>
          ) : (
            <div className="journey-earned-grid">
              {earnedBadges.map((badge) => (
                <div key={badge.id} className="journey-earned-badge">
                  <strong>{badge.name}</strong>
                  <p>{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <button type="button" className="journey-session-btn" onClick={checkIn} disabled={checkedInToday || loading}>
          <span aria-hidden="true">🎓</span>
          {checkedInToday ? "Study Session Finished Today" : "Simulate Finishing a Study Session"}
        </button>
        <p className="journey-note">(In the real app, this happens automatically when you finish a pomodoro or class!)</p>
      </section>
    </PageShell>
  );
}

export function ResourceBookmarksPage() {
  const userId = getUserId();
  const [bookmarks, setBookmarks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", url: "", category: "Article", subject: "", tags: "", notes: "" });

  const fetchBookmarks = async () => {
    setError("");
    try {
      const params = new URLSearchParams({ userId, category: filter, q: query });
      const res = await fetch(`${API_BASE}/resource-bookmarks?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load bookmarks.");
      setBookmarks(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [filter]);

  const addBookmark = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/resource-bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to save bookmark.");
      setBookmarks([data, ...bookmarks]);
      setForm({ title: "", url: "", category: "Article", subject: "", tags: "", notes: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  const updateBookmark = async (id, updates) => {
    const res = await fetch(`${API_BASE}/resource-bookmarks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok) setBookmarks(bookmarks.map((bookmark) => bookmark._id === id ? data : bookmark));
  };

  const deleteBookmark = async (id) => {
    const res = await fetch(`${API_BASE}/resource-bookmarks/${id}`, { method: "DELETE" });
    if (res.ok) setBookmarks(bookmarks.filter((bookmark) => bookmark._id !== id));
  };

  const categories = ["all", "Article", "Video", "Documentation", "Course", "Tool", "General"];

  return (
    <PageShell title="Categorized Resource Bookmarks" desc="Save useful resources with categories, subjects, tags, favorites, and notes." pill={`${bookmarks.length} saved`}>
      {error && <p className="feature-error">{error}</p>}
      <div className="feature-grid">
        <section className="feature-card">
          <h2>Add resource</h2>
          <label className="feature-field">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="feature-field">URL<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></label>
          <label className="feature-field">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.filter(c => c !== "all").map(c => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="feature-field">Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
          <label className="feature-field">Tags<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, hooks, exam" /></label>
          <label className="feature-field">Notes<textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <button type="button" className="feature-btn" onClick={addBookmark}>Save Bookmark</button>
        </section>
        <section className="feature-card">
          <h2>Saved resources</h2>
          <div className="feature-actions bookmark-toolbar">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>{categories.map(c => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}</select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bookmarks" />
            <button type="button" className="feature-btn secondary" onClick={fetchBookmarks}>Search</button>
          </div>
          <div className="feature-list">
            {bookmarks.length === 0 ? <p className="feature-muted">No bookmarks saved yet.</p> : bookmarks.map((bookmark) => (
              <div key={bookmark._id} className="feature-item">
                <div className="bookmark-heading">
                  <strong>{bookmark.title}</strong>
                  <button type="button" className="feature-btn secondary" onClick={() => updateBookmark(bookmark._id, { isFavorite: !bookmark.isFavorite })}>{bookmark.isFavorite ? "Favorite" : "Mark Favorite"}</button>
                </div>
                <p>{bookmark.category} {bookmark.subject ? `- ${bookmark.subject}` : ""}</p>
                {bookmark.notes && <p>{bookmark.notes}</p>}
                {bookmark.tags?.length > 0 && <p>{bookmark.tags.map(tag => `#${tag}`).join(" ")}</p>}
                <div className="feature-actions">
                  <a className="feature-link" href={bookmark.url} target="_blank" rel="noreferrer">Open Resource</a>
                  <button type="button" className="feature-btn danger" onClick={() => deleteBookmark(bookmark._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export function StudySessionsPage() {
  const userName = localStorage.getItem("userName") || "Student";
  const [sessions, setSessions] = useStoredList("studySessions", [
    { id: "math-revision", name: "Math Revision Circle", topic: "Calculus practice", seats: 6, members: ["Nadia", "Rafi"] },
  ]);
  const [form, setForm] = useState({ name: "", topic: "", seats: 5 });

  const createSession = () => {
    if (!form.name.trim()) return;
    setSessions([{ id: Date.now().toString(), ...form, members: [userName] }, ...sessions]);
    setForm({ name: "", topic: "", seats: 5 });
  };

  const joinSession = (id) => {
    setSessions(sessions.map((s) =>
      s.id === id && !s.members.includes(userName)
        ? { ...s, members: [...s.members, userName] }
        : s
    ));
  };

  return (
    <PageShell title="Create / Join Study Sessions" desc="Open focused study groups, share a topic, and let classmates join." pill={`${sessions.length} active`}>
      <div className="feature-grid">
        <section className="feature-card">
          <h2>Create session</h2>
          <label className="feature-field">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="feature-field">Topic<textarea rows="3" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></label>
          <label className="feature-field">Seats<input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></label>
          <button type="button" className="feature-btn" onClick={createSession}>Create Session</button>
        </section>
        <section className="feature-card">
          <h2>Available sessions</h2>
          <div className="feature-list">
            {sessions.map((session) => (
              <div key={session.id} className="feature-item">
                <strong>{session.name}</strong>
                <p>{session.topic || "No topic added yet."}</p>
                <p>{session.members.length} / {session.seats} joined • {session.members.join(", ")}</p>
                <button type="button" className="feature-btn secondary" onClick={() => joinSession(session.id)}>Join</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export function TutorMarketplacePage() {
  const [booked, setBooked] = useStoredList("bookedTutors", []);
  const tutors = [
    { id: "t1", name: "Sara M.", course: "CSE101", rate: "BDT 700", rating: 4.8 },
    { id: "t2", name: "Ahmed R.", course: "Algorithms", rate: "BDT 900", rating: 4.9 },
    { id: "t3", name: "Karim T.", course: "Database", rate: "BDT 650", rating: 4.7 },
  ];

  return (
    <PageShell title="Tutor Marketplace" desc="Browse tutors by course, compare rates, and save booking requests." pill={`${tutors.length} tutors`}>
      <div className="feature-grid">
        <section className="feature-card">
          <h2>Available tutors</h2>
          <div className="feature-list">
            {tutors.map((tutor) => (
              <div key={tutor.id} className="feature-item">
                <strong>{tutor.name}</strong>
                <p>{tutor.course} • {tutor.rate} • {tutor.rating.toFixed(1)} stars</p>
                <button type="button" className="feature-btn" onClick={() => setBooked([tutor, ...booked.filter((b) => b.id !== tutor.id)])}>Book Tutor</button>
              </div>
            ))}
          </div>
        </section>
        <section className="feature-card">
          <h2>Booked tutors</h2>
          {booked.length === 0 ? <p className="feature-muted">No tutors booked yet.</p> : (
            <div className="feature-list">
              {booked.map((tutor) => <div key={tutor.id} className="feature-item"><strong>{tutor.name}</strong><p>{tutor.course} • {tutor.rate}</p></div>)}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

export function PeerRatingsPage() {
  const [ratings, setRatings] = useStoredList("peerRatings", []);
  const [form, setForm] = useState({ name: "", score: 5, comment: "" });
  const average = useMemo(() => ratings.length ? ratings.reduce((sum, r) => sum + Number(r.score), 0) / ratings.length : 0, [ratings]);

  const addRating = () => {
    if (!form.name.trim()) return;
    setRatings([{ id: Date.now(), ...form }, ...ratings]);
    setForm({ name: "", score: 5, comment: "" });
  };

  return (
    <PageShell title="Peer Rating System" desc="Give helpful feedback to study partners after sessions and track collaboration quality." pill={ratings.length ? `${average.toFixed(1)} avg` : "No ratings"}>
      <div className="feature-grid">
        <section className="feature-card">
          <h2>Add rating</h2>
          <label className="feature-field">Peer name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="feature-field">Score<select value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></label>
          <label className="feature-field">Comment<textarea rows="3" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></label>
          <button type="button" className="feature-btn" onClick={addRating}>Save Rating</button>
        </section>
        <section className="feature-card">
          <h2>Recent ratings</h2>
          <div className="feature-list">
            {ratings.length === 0 ? <p className="feature-muted">No peer ratings yet.</p> : ratings.map((rating) => (
              <div key={rating.id} className="feature-item"><strong>{rating.name} • {"★".repeat(Number(rating.score))}</strong><p>{rating.comment || "No comment."}</p></div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export function StudyRemindersPage() {
  const [reminders, setReminders] = useStoredList("studyReminders", []);
  const [form, setForm] = useState({ title: "", time: "" });
  const addReminder = () => {
    if (!form.title.trim() || !form.time) return;
    setReminders([{ id: Date.now(), ...form }, ...reminders]);
    setForm({ title: "", time: "" });
  };

  return (
    <PageShell title="Study Reminders" desc="Create quick reminders for goals, study sessions, exams, and review blocks." pill={`${reminders.length} reminders`}>
      <div className="feature-grid">
        <section className="feature-card">
          <h2>New reminder</h2>
          <label className="feature-field">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="feature-field">Date and time<input type="datetime-local" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></label>
          <button type="button" className="feature-btn" onClick={addReminder}>Add Reminder</button>
        </section>
        <section className="feature-card">
          <h2>Upcoming</h2>
          <div className="feature-list">{reminders.length === 0 ? <p className="feature-muted">No reminders yet.</p> : reminders.map((r) => <div key={r.id} className="feature-item"><strong>{r.title}</strong><p>{new Date(r.time).toLocaleString()}</p></div>)}</div>
        </section>
      </div>
    </PageShell>
  );
}
