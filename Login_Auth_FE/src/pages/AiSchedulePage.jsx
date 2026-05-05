import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentFeaturePages.css";
import "./AiSchedulePage.css";

const API_BASE = "http://localhost:3001/api";

const GOAL_OPTIONS = [
  { value: "", label: "Balanced plan" },
  { value: "Catch up on fundamentals with extra review.", label: "Catch up on fundamentals" },
  { value: "Prepare for exams with practice questions and timed revision.", label: "Exam preparation" },
  { value: "Stay on top of weekly readings and assignments.", label: "Weekly coursework" },
  { value: "Deepen understanding with harder problems and mastery work.", label: "Advanced mastery" },
  { value: "Beginner level; scaffold from basics.", label: "Beginner" },
];

const TIME_OPTIONS = [
  { value: "Prefer early mornings before 9:00.", label: "Early morning" },
  { value: "Prefer late morning from 9:00 to 12:00.", label: "Late morning" },
  { value: "Prefer afternoons from 12:00 to 17:00.", label: "Afternoon" },
  { value: "Prefer evenings after 17:00.", label: "Evening" },
  { value: "Weekdays only; minimal weekend study.", label: "Weekdays only" },
  { value: "Weekends are best for longer blocks.", label: "Weekends preferred" },
];

const HOURS_OPTIONS = [5, 8, 10, 12, 15, 20, 25, 30];
const WEEKS_OPTIONS = [2, 3, 4, 6, 8, 12, 16];

function courseLabel(course) {
  if (!course) return "Course";
  const code = (course.code || "").trim();
  const name = (course.name || "").trim();
  return code && name ? `${code} - ${name}` : name || code || "Course";
}

function formatWhen(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function nextDeadlineId() {
  return `deadline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AiSchedulePage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Student";

  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseIdsSelected, setCourseIdsSelected] = useState([]);
  const [preferredTimes, setPreferredTimes] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [goals, setGoals] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const coursesById = useMemo(() => {
    const map = new Map();
    selectedCourses.forEach((course) => map.set(String(course._id), course));
    return map;
  }, [selectedCourses]);

  const sortedSelectedCourses = useMemo(() => {
    const selected = new Set(courseIdsSelected.map(String));
    return selectedCourses.filter((course) => selected.has(String(course._id)));
  }, [courseIdsSelected, selectedCourses]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/ai-schedules?userId=${encodeURIComponent(userId)}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || "Could not load saved schedules.");
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setError("Please log in before opening the AI scheduler.");
      return;
    }

    let cancelled = false;

    async function loadCourses() {
      setLoadingCourses(true);
      setError("");
      try {
        const [coursesRes, infoRes] = await Promise.all([
          fetch(`${API_BASE}/courses`),
          fetch(`${API_BASE}/ind-infos/${userId}`),
        ]);
        const allCourses = await coursesRes.json().catch(() => []);
        const info = await infoRes.json().catch(() => ({}));
        if (!coursesRes.ok) throw new Error("Could not load courses.");
        if (!infoRes.ok) throw new Error("Could not load your selected courses.");

        const rawIds = Array.isArray(info.courses)
          ? info.courses.map((course) => (typeof course === "string" ? course : course?._id)).filter(Boolean)
          : [];
        const selectedIds = new Set(rawIds.map(String));
        const mine = allCourses
          .filter((course) => selectedIds.has(String(course._id)))
          .sort((a, b) => courseLabel(a).localeCompare(courseLabel(b)));

        if (cancelled) return;
        setSelectedCourses(mine);
        setCourseIdsSelected(mine.map((course) => String(course._id)));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    }

    loadCourses();
    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [loadHistory, userId]);

  const toggleCourse = (id) => {
    const value = String(id);
    setCourseIdsSelected((previous) => {
      if (previous.includes(value)) {
        if (previous.length <= 1) {
          setError("Select at least one course.");
          return previous;
        }
        return previous.filter((item) => item !== value);
      }
      return [...previous, value];
    });
  };

  const toggleTime = (value) => {
    setPreferredTimes((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]
    );
  };

  const addDeadline = () => {
    if (!courseIdsSelected.length) {
      setError("Select at least one course before adding deadlines.");
      return;
    }
    setDeadlines((items) => [...items, { id: nextDeadlineId(), courseId: courseIdsSelected[0], description: "" }]);
  };

  const updateDeadline = (id, patch) => {
    setDeadlines((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeDeadline = (id) => {
    setDeadlines((items) => items.filter((item) => item.id !== id));
  };

  const generateSchedule = async () => {
    if (!userId) {
      setError("Please log in before generating a schedule.");
      return;
    }
    if (!courseIdsSelected.length) {
      setError("Select at least one course.");
      return;
    }

    setGenerating(true);
    setError("");
    setMessage("");

    const subjects = courseIdsSelected.map((id) => ({
      courseId: id,
      label: courseLabel(coursesById.get(String(id))),
    }));
    const deadlinePayload = deadlines
      .filter((row) => row.description.trim())
      .map((row) => ({
        courseId: row.courseId,
        subject: courseLabel(coursesById.get(String(row.courseId))),
        description: row.description.trim(),
      }));

    try {
      const res = await fetch(`${API_BASE}/ai-schedules/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subjects,
          goals,
          hoursPerWeek: Number(hoursPerWeek),
          durationWeeks: Number(durationWeeks),
          preferredStudyTimes: preferredTimes,
          deadlines: deadlinePayload,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail ? `${data.message} ${data.detail}` : data.message || "Generation failed.");

      setActiveSchedule(data.schedule);
      setActiveId(data._id);
      setMessage("Schedule created and saved.");
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="feature-shell ai-schedule-shell">
      <nav className="feature-topbar">
        <span className="feature-brand">StudyCircle</span>
        <button type="button" className="feature-back" onClick={() => navigate("/student")}>
          Back to Dashboard
        </button>
      </nav>

      <main className="feature-page ai-schedule-page">
        <header className="feature-hero">
          <div>
            <h1>AI Study Scheduler</h1>
            <p>Hi {userName}. Build a weekly study plan from your selected courses, available hours, preferred times, and deadlines.</p>
          </div>
          <span className="feature-pill">Gemini Planner</span>
        </header>

        {error && <p className="feature-error">{error}</p>}
        {message && <p className="feature-success">{message}</p>}

        <div className="feature-grid ai-schedule-grid">
          <section className="feature-card">
            <h2>Your inputs</h2>
            {loadingCourses ? (
              <p className="feature-muted">Loading your courses...</p>
            ) : selectedCourses.length === 0 ? (
              <p className="feature-muted">No selected courses found. Add courses from My Courses first.</p>
            ) : (
              <div className="ai-check-list">
                {selectedCourses.map((course) => {
                  const id = String(course._id);
                  return (
                    <label key={id} className="ai-check-row">
                      <input type="checkbox" checked={courseIdsSelected.includes(id)} onChange={() => toggleCourse(id)} />
                      <span>{courseLabel(course)}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <label className="feature-field">
              Goals
              <select value={goals} onChange={(event) => setGoals(event.target.value)}>
                {GOAL_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="ai-two-col">
              <label className="feature-field">
                Hours per week
                <select value={hoursPerWeek} onChange={(event) => setHoursPerWeek(Number(event.target.value))}>
                  {HOURS_OPTIONS.map((hours) => <option key={hours} value={hours}>{hours} hours</option>)}
                </select>
              </label>
              <label className="feature-field">
                Plan length
                <select value={durationWeeks} onChange={(event) => setDurationWeeks(Number(event.target.value))}>
                  {WEEKS_OPTIONS.map((weeks) => <option key={weeks} value={weeks}>{weeks} weeks</option>)}
                </select>
              </label>
            </div>

            <h3>Preferred times</h3>
            <div className="ai-check-grid">
              {TIME_OPTIONS.map((option) => (
                <label key={option.value} className="ai-check-row">
                  <input type="checkbox" checked={preferredTimes.includes(option.value)} onChange={() => toggleTime(option.value)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <div className="ai-section-heading">
              <h3>Deadlines</h3>
              <button type="button" className="feature-btn secondary" onClick={addDeadline}>Add deadline</button>
            </div>
            <div className="ai-deadlines">
              {deadlines.map((row) => (
                <div key={row.id} className="ai-deadline">
                  <select value={row.courseId} onChange={(event) => updateDeadline(row.id, { courseId: event.target.value })}>
                    {sortedSelectedCourses.map((course) => (
                      <option key={course._id} value={String(course._id)}>{courseLabel(course)}</option>
                    ))}
                  </select>
                  <input value={row.description} onChange={(event) => updateDeadline(row.id, { description: event.target.value })} placeholder="May 20 - midterm, chapters 1-5" />
                  <button type="button" className="feature-btn danger" onClick={() => removeDeadline(row.id)}>Remove</button>
                </div>
              ))}
            </div>

            <button type="button" className="feature-btn ai-generate-btn" onClick={generateSchedule} disabled={generating || !selectedCourses.length}>
              {generating ? "Generating..." : "Generate schedule"}
            </button>
          </section>

          <section className="feature-card">
            <h2>{activeSchedule?.title || "Generated plan"}</h2>
            {!activeSchedule ? (
              <p className="feature-muted">Your AI-generated schedule will appear here.</p>
            ) : (
              <>
                {activeSchedule.summary && <p className="ai-summary">{activeSchedule.summary}</p>}
                {Array.isArray(activeSchedule.weeklyPlan) && activeSchedule.weeklyPlan.map((week, index) => (
                  <article key={week.week || index} className="ai-week-card">
                    <h3>Week {week.week || index + 1}</h3>
                    {week.focus && <p>{week.focus}</p>}
                    {Array.isArray(week.days) && week.days.map((day) => (
                      <div key={`${week.week}-${day.name}`} className="ai-day-card">
                        <strong>{day.name}</strong>
                        {Array.isArray(day.sessions) && day.sessions.map((session, sessionIndex) => (
                          <p key={sessionIndex}><span>{session.durationMinutes || ""} min</span>{session.task}</p>
                        ))}
                      </div>
                    ))}
                  </article>
                ))}
                {Array.isArray(activeSchedule.tips) && activeSchedule.tips.length > 0 && (
                  <div className="ai-tips">
                    <strong>Tips</strong>
                    <ul>{activeSchedule.tips.map((tip, index) => <li key={index}>{tip}</li>)}</ul>
                  </div>
                )}
              </>
            )}

            <div className="ai-history">
              <h3>Saved schedules</h3>
              {history.length === 0 ? (
                <p className="feature-muted">No saved schedules yet.</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className={`ai-history-item ${activeId === item._id ? "active" : ""}`}
                    onClick={() => {
                      setActiveId(item._id);
                      setActiveSchedule(item.schedule);
                    }}
                  >
                    <span>{item.schedule?.title || item.inputs?.subjectSummary?.split("\n")[0] || "Saved schedule"}</span>
                    <small>{formatWhen(item.createdAt)}</small>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
