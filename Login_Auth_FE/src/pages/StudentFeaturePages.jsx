import React, { useMemo, useState } from "react";
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

function PageShell({ title, desc, pill, children }) {
  const navigate = useNavigate();

  return (
    <div className="feature-shell">
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
