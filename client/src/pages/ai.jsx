import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import StudentLayout from './student_layout'
import '../styles/ai.css'

const API_BASE = 'http://localhost:5000/api/ai-schedules'
const COURSES_API = 'http://localhost:5000/api/courses'
const IND_INFO_API = 'http://localhost:5000/api/ind-infos'

/** Value strings are sent to the AI as-is. */
const GOAL_OPTIONS = [
  { value: '', label: 'Balanced plan (no specific focus)' },
  {
    value:
      'Student is catching up on fundamentals and needs a confidence-building pace with extra review.',
    label: 'Catch up on fundamentals',
  },
  {
    value:
      'Primary goal is exam preparation: review, practice questions, and timed revision.',
    label: 'Exam preparation',
  },
  {
    value:
      'Stay on top of weekly coursework, readings, and assignments without falling behind.',
    label: 'Weekly coursework & assignments',
  },
  {
    value:
      'Deepen understanding: harder problems, connections between topics, and mastery.',
    label: 'Advanced / deeper understanding',
  },
  {
    value:
      'First exposure to this subject; assume beginner level and scaffold from basics.',
    label: 'Beginner — new to the topic',
  },
]

/** Multi-select only (no “no preference” entry — empty selection means flexible). */
const PREFERRED_TIME_OPTIONS = [
  { value: 'Prefer early mornings (before 9:00).', label: 'Early morning' },
  { value: 'Prefer late morning (9:00–12:00).', label: 'Late morning' },
  { value: 'Prefer afternoons (12:00–17:00).', label: 'Afternoon' },
  { value: 'Prefer evenings after 17:00.', label: 'Evening' },
  { value: 'Weekdays only; minimal weekend study.', label: 'Weekdays only' },
  { value: 'Weekends are best for longer blocks.', label: 'Weekends preferred' },
  {
    value: 'Mix of weekday evenings and weekend mornings.',
    label: 'Mixed (evenings + weekend)',
  },
]

const HOURS_OPTIONS = [5, 8, 10, 12, 15, 20, 25, 30]
const WEEKS_OPTIONS = [2, 3, 4, 6, 8, 12, 16]

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

function courseLabel(c) {
  if (!c) return ''
  const code = (c.code || '').trim()
  const name = (c.name || '').trim()
  if (code && name) return `${code} — ${name}`
  return name || code || 'Course'
}

function nextDeadlineId() {
  return `dl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function historyPreview(inputs) {
  const raw = inputs?.subjectSummary || inputs?.subject || 'Schedule'
  const line = raw.split('\n')[0].trim()
  return line.length > 72 ? `${line.slice(0, 72)}…` : line
}

export default function AiStudySchedule() {
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const userName = user?.name || user?.email || 'Student'

  const getAuthToken = () => localStorage.getItem('token')

  const [courseIdsSelected, setCourseIdsSelected] = useState([])
  const [preferredTimeKeys, setPreferredTimeKeys] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [goals, setGoals] = useState(GOAL_OPTIONS[0].value)
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [durationWeeks, setDurationWeeks] = useState(4)

  const [selectedCourses, setSelectedCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeSchedule, setActiveSchedule] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const coursesById = useMemo(() => {
    const m = new Map()
    selectedCourses.forEach((c) => m.set(String(c._id), c))
    return m
  }, [selectedCourses])

  const courseSelectionKey = useMemo(
    () => [...courseIdsSelected].sort().join(','),
    [courseIdsSelected],
  )

  useEffect(() => {
    if (!user?.id) {
      setSelectedCourses([])
      return
    }

    let cancelled = false

    const run = async () => {
      setLoadingCourses(true)
      try {
        const [cRes, iRes] = await Promise.all([
          fetch(COURSES_API),
          fetch(`${IND_INFO_API}/${user.id}`),
        ])
        const allCourses = await cRes.json().catch(() => [])
        const info = await iRes.json().catch(() => ({}))

        if (!cRes.ok || !Array.isArray(allCourses)) {
          if (!cancelled) toast.error('Could not load courses.')
          return
        }

        const rawIds = Array.isArray(info.courses)
          ? info.courses.map((c) => (typeof c === 'string' ? c : c?._id)).filter(Boolean)
          : []
        const idSet = new Set(rawIds.map((id) => String(id)))

        const mine = allCourses
          .filter((c) => idSet.has(String(c._id)))
          .sort((a, b) => courseLabel(a).localeCompare(courseLabel(b)))

        if (cancelled) return
        setSelectedCourses(mine)

        setCourseIdsSelected((prev) => {
          const ids = mine.map((c) => String(c._id))
          const kept = prev.filter((id) => ids.includes(id))
          if (kept.length > 0) return kept
          return ids
        })
      } catch {
        if (!cancelled) toast.error('Could not load your selected courses.')
      } finally {
        if (!cancelled) setLoadingCourses(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (courseIdsSelected.length === 0) return
    setDeadlines((rows) =>
      rows.map((r) =>
        courseIdsSelected.includes(String(r.courseId))
          ? r
          : { ...r, courseId: courseIdsSelected[0] },
      ),
    )
  }, [courseIdsSelected, courseSelectionKey])

  const toggleCourse = (id) => {
    const sid = String(id)
    setCourseIdsSelected((prev) => {
      if (prev.includes(sid)) {
        if (prev.length <= 1) {
          toast.error('Select at least one course.')
          return prev
        }
        return prev.filter((x) => x !== sid)
      }
      return [...prev, sid]
    })
  }

  const togglePreferredTime = (value) => {
    setPreferredTimeKeys((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  const addDeadlineRow = () => {
    const first = courseIdsSelected[0] || ''
    if (!first) {
      toast.error('Select at least one course first.')
      return
    }
    setDeadlines((d) => [
      ...d,
      { id: nextDeadlineId(), courseId: first, description: '' },
    ])
  }

  const removeDeadlineRow = (rowId) => {
    setDeadlines((d) => d.filter((r) => r.id !== rowId))
  }

  const updateDeadlineRow = (rowId, patch) => {
    setDeadlines((d) => d.map((r) => (r.id === rowId ? { ...r, ...patch } : r)))
  }

  const loadHistory = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return

    setLoadingHistory(true)
    try {
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Could not load saved schedules.')
        return
      }
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleGenerate = async () => {
    const token = getAuthToken()
    if (!token) {
      toast.error('Please log in to generate a schedule.')
      return
    }
    if (courseIdsSelected.length === 0) {
      toast.error('Select at least one course.')
      return
    }

    const subjects = courseIdsSelected.map((id) => {
      const c = coursesById.get(String(id))
      return { courseId: id, label: courseLabel(c) }
    })

    const preferredStudyTimes = [...preferredTimeKeys]

    const deadlinePayload = []
    for (const row of deadlines) {
      const desc = (row.description || '').trim()
      if (!desc) continue
      if (!courseIdsSelected.includes(String(row.courseId))) {
        toast.error('Each deadline must use one of your selected courses.')
        return
      }
      const c = coursesById.get(String(row.courseId))
      deadlinePayload.push({
        courseId: row.courseId,
        subject: courseLabel(c),
        description: desc,
      })
    }

    setGenerating(true)
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjects,
          goals: goals.trim(),
          hoursPerWeek: Number(hoursPerWeek),
          durationWeeks: Number(durationWeeks),
          preferredStudyTimes,
          deadlines: deadlinePayload,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = data.detail ? ` ${data.detail}` : ''
        toast.error((data.message || 'Generation failed.') + detail)
        return
      }
      setActiveSchedule(data.schedule)
      setActiveId(data._id)
      toast.success('Schedule created and saved.')
      await loadHistory()
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setGenerating(false)
    }
  }

  const openFromHistory = (item) => {
    setActiveId(item._id)
    setActiveSchedule(item.schedule)
  }

  const schedule = activeSchedule
  const canGenerate =
    courseIdsSelected.length > 0 && selectedCourses.length > 0 && !loadingCourses

  const sortedSelectedCourses = useMemo(() => {
    const set = new Set(courseIdsSelected.map(String))
    return selectedCourses.filter((c) => set.has(String(c._id)))
  }, [selectedCourses, courseIdsSelected])

  return (
    <StudentLayout>
      <div className="ai-root">
        <header className="ai-header">
          <div>
            <div className="ai-title-row">
              <span className="ai-badge">Gemini</span>
              <h1 className="ai-title">AI study schedule</h1>
            </div>
            <p className="ai-subtitle">
              Hi {userName}. Choose <strong>one or more</strong> of your courses, pick every time
              window that works for you, and add deadlines with the matching subject plus your own
              description (date, assessment type, etc.).
            </p>
          </div>
        </header>

        <div className="ai-layout">
          <div className="ai-panel">
            <h2 className="ai-panel-title">Your inputs</h2>
            <p className="ai-panel-hint">
              Weekly hours are shared across all selected courses. The model balances time and
              prioritizes subjects that have upcoming deadlines you list below.
            </p>

            {loadingCourses ? (
              <p className="ai-muted">Loading your courses…</p>
            ) : selectedCourses.length === 0 ? (
              <p className="ai-callout">
                You have no courses selected yet. Add courses under{' '}
                <Link to="/student">Select course</Link> to unlock the schedule generator.
              </p>
            ) : null}

            <div className="ai-field">
              <span className="ai-label">Courses to include</span>
              <p className="ai-multi-hint">Check every course this plan should cover.</p>
              <div className="ai-check-grid">
                {selectedCourses.map((c) => {
                  const id = String(c._id)
                  return (
                    <label key={id} className="ai-check">
                      <input
                        type="checkbox"
                        checked={courseIdsSelected.includes(id)}
                        onChange={() => toggleCourse(id)}
                        disabled={loadingCourses || selectedCourses.length === 0}
                      />
                      <span>{courseLabel(c)}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="ai-field">
              <label className="ai-label" htmlFor="ai-goals">
                Goals and context
              </label>
              <select
                id="ai-goals"
                className="ai-select"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                disabled={selectedCourses.length === 0}
              >
                {GOAL_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ai-row">
              <div className="ai-field">
                <label className="ai-label" htmlFor="ai-hours">
                  Hours per week (total)
                </label>
                <select
                  id="ai-hours"
                  className="ai-select"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  disabled={selectedCourses.length === 0}
                >
                  {HOURS_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h} hours
                    </option>
                  ))}
                </select>
              </div>
              <div className="ai-field">
                <label className="ai-label" htmlFor="ai-weeks">
                  Plan length (weeks)
                </label>
                <select
                  id="ai-weeks"
                  className="ai-select"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  disabled={selectedCourses.length === 0}
                >
                  {WEEKS_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w} weeks
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ai-field">
              <span className="ai-label">Preferred study times</span>
              <p className="ai-multi-hint">
                Select all that apply. Leave none checked if you are fully flexible.
              </p>
              <div className="ai-check-grid-wrap">
                {PREFERRED_TIME_OPTIONS.map((opt) => (
                  <label key={opt.value} className="ai-check">
                    <input
                      type="checkbox"
                      checked={preferredTimeKeys.includes(opt.value)}
                      onChange={() => togglePreferredTime(opt.value)}
                      disabled={selectedCourses.length === 0}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="ai-field">
              <span className="ai-label">Deadlines and milestones</span>
              <p className="ai-multi-hint">
                Add a row per exam or due date: pick the <strong>subject</strong> (course) and write
                a short <strong>description</strong> (e.g. &quot;Nov 14 — midterm, chapters 1–5&quot;).
                Rows with an empty description are ignored.
              </p>
              <div className="ai-deadline-list">
                {deadlines.map((row) => (
                  <div key={row.id} className="ai-deadline-row">
                    <select
                      className="ai-select"
                      value={row.courseId}
                      onChange={(e) =>
                        updateDeadlineRow(row.id, { courseId: e.target.value })
                      }
                      disabled={selectedCourses.length === 0}
                    >
                      {sortedSelectedCourses.map((c) => (
                        <option key={c._id} value={String(c._id)}>
                          {courseLabel(c)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="ai-input"
                      placeholder="Description (date, type of assessment, notes…)"
                      value={row.description}
                      onChange={(e) =>
                        updateDeadlineRow(row.id, { description: e.target.value })
                      }
                      disabled={selectedCourses.length === 0}
                    />
                    <button
                      type="button"
                      className="ai-btn-danger"
                      onClick={() => removeDeadlineRow(row.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="ai-btn-ghost"
                style={{ marginTop: '0.65rem' }}
                onClick={addDeadlineRow}
                disabled={selectedCourses.length === 0 || courseIdsSelected.length === 0}
              >
                + Add deadline
              </button>
            </div>

            <button
              type="button"
              className="ai-generate"
              disabled={generating || !canGenerate}
              onClick={handleGenerate}
            >
              {generating ? 'Generating…' : 'Generate schedule'}
            </button>

            <p className="ai-muted">
              Add <code>GEMINI_API_KEY</code> to your server <code>.env</code> (Google AI
              Studio). The server tries <code>gemini-2.5-flash</code> first, then other models;
              set <code>GEMINI_MODEL</code> to force one. No spaces around the key value.
            </p>

            <div className="ai-history">
              <h3 className="ai-history-title">Saved in MongoDB</h3>
              {loadingHistory ? (
                <p className="ai-muted">Loading history…</p>
              ) : history.length === 0 ? (
                <p className="ai-muted">
                  No saved plans yet. Generate one to create a document in{' '}
                  <strong>ai_study_schedules</strong>.
                </p>
              ) : (
                <div className="ai-history-list">
                  {history.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className={`ai-history-item ${
                        activeId === item._id ? 'ai-history-item-active' : ''
                      }`}
                      onClick={() => openFromHistory(item)}
                    >
                      {historyPreview(item.inputs)}
                      <span className="ai-history-meta">
                        {item.inputs?.hoursPerWeek} h/wk · {item.inputs?.durationWeeks} wk ·{' '}
                        {formatWhen(item.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ai-panel">
            {!schedule ? (
              <div className="ai-placeholder">
                Your AI plan will appear here with a <strong>summary</strong>,{' '}
                <strong>weekly breakdown</strong>, and <strong>tips</strong>.
              </div>
            ) : (
              <>
                <div className="ai-result-header">
                  <h2 className="ai-result-title">
                    {schedule.title || 'Your study plan'}
                  </h2>
                </div>
                {schedule.summary && (
                  <p className="ai-summary">{schedule.summary}</p>
                )}

                {Array.isArray(schedule.weeklyPlan) &&
                  schedule.weeklyPlan.map((week, wi) => (
                    <section key={week.week ?? `w-${wi}`} className="ai-week">
                      <h3 className="ai-week-head">Week {week.week}</h3>
                      {week.focus && (
                        <p className="ai-week-focus">{week.focus}</p>
                      )}
                      {Array.isArray(week.days) &&
                        week.days.map((day) => (
                          <div key={`${week.week}-${day.name}`} className="ai-day">
                            <h4 className="ai-day-name">{day.name}</h4>
                            {Array.isArray(day.sessions) &&
                              day.sessions.map((s, idx) => (
                                <div
                                  key={`${day.name}-${idx}`}
                                  className="ai-session"
                                >
                                  <span className="ai-duration">
                                    {s.durationMinutes != null
                                      ? `${s.durationMinutes} min`
                                      : ''}
                                  </span>
                                  <span>{s.task}</span>
                                </div>
                              ))}
                          </div>
                        ))}
                    </section>
                  ))}

                {Array.isArray(schedule.tips) && schedule.tips.length > 0 && (
                  <div className="ai-tips">
                    <div className="ai-tips-title">Tips</div>
                    <ul>
                      {schedule.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
