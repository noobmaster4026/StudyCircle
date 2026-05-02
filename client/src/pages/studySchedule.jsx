import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import StudentLayout from './student_layout'
import '../styles/studySchedule.css'

const API_URL = 'http://localhost:5000/api/study-schedules'
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudySchedule() {
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const [form, setForm] = useState({
    title: 'Weekly study schedule',
    goal: '',
    focusLevel: 'balanced',
    availableHours: 8,
    useSelectedCourses: true,
    subjectsText: '',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  })
  const [schedules, setSchedules] = useState([])
  const [activeSchedule, setActiveSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const getAuthToken = () => localStorage.getItem('token')

  const fetchSchedules = async () => {
    const token = getAuthToken()
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Could not load schedules.')
        return
      }
      setSchedules(Array.isArray(data) ? data : [])
      setActiveSchedule((Array.isArray(data) && data[0]) || null)
    } catch {
      toast.error('Could not connect to server while loading schedules.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const toggleDay = (day) => {
    setForm((prev) => {
      const exists = prev.days.includes(day)
      const days = exists ? prev.days.filter((item) => item !== day) : [...prev.days, day]
      return { ...prev, days }
    })
  }

  const generateSchedule = async () => {
    const token = getAuthToken()
    if (!token) {
      toast.error('You must be logged in to generate a schedule.')
      return
    }

    if (!form.days.length) {
      toast.error('Choose at least one study day.')
      return
    }

    const subjects = form.subjectsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    setGenerating(true)
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          goal: form.goal.trim(),
          focusLevel: form.focusLevel,
          availableHours: Number(form.availableHours),
          useSelectedCourses: form.useSelectedCourses,
          subjects,
          days: form.days,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Could not generate schedule.')
        return
      }

      setActiveSchedule(data)
      setSchedules((prev) => [data, ...prev].slice(0, 5))
      toast.success('Study schedule generated.')
    } catch {
      toast.error('Could not connect to server while generating schedule.')
    } finally {
      setGenerating(false)
    }
  }

  const groupedBlocks = (activeSchedule?.blocks || []).reduce((map, block) => {
    if (!map[block.day]) map[block.day] = []
    map[block.day].push(block)
    return map
  }, {})

  return (
    <StudentLayout>
      <div className="sg-root">
        <header className="sg-hero">
          <div>
            <h1 className="sg-title">AI study schedule generator</h1>
            <p className="sg-subtitle">
              Build a weekly plan from your selected courses, available time, and current goal.
            </p>
          </div>
          <div className="sg-hero-card">
            <span className="sg-hero-label">Student</span>
            <strong>{user?.name || user?.email || 'StudyCircle learner'}</strong>
          </div>
        </header>

        <div className="sg-layout">
          <section className="sg-card sg-form-card">
            <h2 className="sg-card-title">Generate schedule</h2>

            <label className="sg-field">
              <span>Plan title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="sg-input"
              />
            </label>

            <label className="sg-field">
              <span>Study goal</span>
              <textarea
                value={form.goal}
                onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))}
                className="sg-textarea"
                rows={3}
                placeholder="e.g. Prepare for midterms and finish practice sheets"
              />
            </label>

            <div className="sg-grid">
              <label className="sg-field">
                <span>Weekly hours</span>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={form.availableHours}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, availableHours: e.target.value }))
                  }
                  className="sg-input"
                />
              </label>

              <label className="sg-field">
                <span>Focus mode</span>
                <select
                  value={form.focusLevel}
                  onChange={(e) => setForm((prev) => ({ ...prev, focusLevel: e.target.value }))}
                  className="sg-input"
                >
                  <option value="balanced">Balanced</option>
                  <option value="exam">Exam prep</option>
                  <option value="revision">Revision</option>
                </select>
              </label>
            </div>

            <label className="sg-check">
              <input
                type="checkbox"
                checked={form.useSelectedCourses}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, useSelectedCourses: e.target.checked }))
                }
              />
              <span>Use my selected courses</span>
            </label>

            {!form.useSelectedCourses && (
              <label className="sg-field">
                <span>Subjects</span>
                <input
                  value={form.subjectsText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subjectsText: e.target.value }))
                  }
                  className="sg-input"
                  placeholder="Math, Physics, English"
                />
              </label>
            )}

            <div className="sg-field">
              <span>Study days</span>
              <div className="sg-day-list">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`sg-day-btn ${form.days.includes(day) ? 'sg-day-active' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="sg-primary-btn"
              onClick={generateSchedule}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate schedule'}
            </button>
          </section>

          <section className="sg-card sg-result-card">
            <div className="sg-card-header">
              <h2 className="sg-card-title">Current plan</h2>
              {activeSchedule && (
                <span className="sg-pill">{activeSchedule.availableHours} hrs/week</span>
              )}
            </div>

            {loading ? (
              <p className="sg-muted">Loading schedules...</p>
            ) : !activeSchedule ? (
              <p className="sg-muted">Generate a plan to see your weekly schedule here.</p>
            ) : (
              <>
                <div className="sg-plan-head">
                  <h3>{activeSchedule.title}</h3>
                  <p>{activeSchedule.goal || 'A focused weekly study plan.'}</p>
                </div>

                <div className="sg-schedule-list">
                  {Object.entries(groupedBlocks).map(([day, blocks]) => (
                    <div key={day} className="sg-day-card">
                      <h4>{day}</h4>
                      {blocks.map((block, index) => (
                        <div key={`${day}-${index}`} className="sg-block">
                          <div className="sg-block-time">{block.time}</div>
                          <div>
                            <strong>{block.subject}</strong>
                            <p>{block.task} • {block.durationMinutes} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="sg-card sg-history-card">
            <h2 className="sg-card-title">Recent plans</h2>
            {schedules.length === 0 ? (
              <p className="sg-muted">No saved schedules yet.</p>
            ) : (
              schedules.map((schedule) => (
                <button
                  key={schedule._id}
                  type="button"
                  className={`sg-history-item ${
                    activeSchedule?._id === schedule._id ? 'sg-history-active' : ''
                  }`}
                  onClick={() => setActiveSchedule(schedule)}
                >
                  <strong>{schedule.title}</strong>
                  <span>{new Date(schedule.createdAt).toLocaleDateString()}</span>
                </button>
              ))
            )}
          </aside>
        </div>
      </div>
    </StudentLayout>
  )
}
