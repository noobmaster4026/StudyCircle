import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import StudentLayout from './student_layout'
import '../styles/student_dashboard.css'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [selectedCourseIds, setSelectedCourseIds] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingSelection, setLoadingSelection] = useState(false)
  const [updatingCourseId, setUpdatingCourseId] = useState(null)
  const [searchAvailable, setSearchAvailable] = useState('')
  const [searchYourCourses, setSearchYourCourses] = useState('')
  const [initialCoursesLoaded, setInitialCoursesLoaded] = useState(false)

  const filterBySearch = (list, query) => {
    if (!query.trim()) return list
    const q = query.trim().toLowerCase()
    return list.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q)
    )
  }

  const COURSES_API = 'http://localhost:5000/api/courses'
  const IND_INFO_API = 'http://localhost:5000/api/ind-infos'

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  // Load all available courses
  useEffect(() => {
    const fetchCourses = async ({ silent } = { silent: false }) => {
      if (!silent) setLoadingCourses(true)
      try {
        const res = await fetch(COURSES_API)
        const data = await res.json()
        if (!res.ok) {
          if (!silent) toast.error(data.message || 'Failed to load courses.')
        } else {
          setCourses(data)
          if (!silent) setInitialCoursesLoaded(true)
        }
      } catch {
        if (!silent) toast.error('Could not connect to server while loading courses.')
      } finally {
        if (!silent) setLoadingCourses(false)
      }
    }

    fetchCourses()

    // Silent polling for live seat updates (no visible refresh)
    const intervalId = setInterval(() => {
      fetchCourses({ silent: true })
    }, 2000)

    return () => clearInterval(intervalId)
  }, [])

  // Load student's selected courses
  useEffect(() => {
    if (!user?.id) return

    const fetchSelection = async () => {
      setLoadingSelection(true)
      try {
        const res = await fetch(`${IND_INFO_API}/${user.id}`)
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.message || 'Failed to load your courses.')
        } else {
          const ids = Array.isArray(data.courses)
            ? data.courses.map((c) => (typeof c === 'string' ? c : c._id))
            : []
          setSelectedCourseIds(ids)
        }
      } catch {
        toast.error('Could not connect to server while loading your courses.')
      } finally {
        setLoadingSelection(false)
      }
    }

    fetchSelection()
  }, [user?.id])

  const isSelected = (courseId) => selectedCourseIds.includes(courseId)

  const handleAddCourse = async (courseId) => {
    if (!user?.id) {
      toast.error('You must be logged in as a student.')
      return
    }

    setUpdatingCourseId(courseId)
    try {
      const res = await fetch(`${IND_INFO_API}/${user.id}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to add course.')
      } else {
        const ids = Array.isArray(data.courses)
          ? data.courses.map((c) => (typeof c === 'string' ? c : c._id))
          : []
        setSelectedCourseIds(ids)
        toast.success('Course added.')
      }
    } catch {
      toast.error('Could not connect to server while adding course.')
    } finally {
      setUpdatingCourseId(null)
    }
  }

  const handleDropCourse = async (courseId) => {
    if (!user?.id) {
      toast.error('You must be logged in as a student.')
      return
    }

    setUpdatingCourseId(courseId)
    try {
      const res = await fetch(`${IND_INFO_API}/${user.id}/courses/${courseId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to drop course.')
      } else {
        const ids = Array.isArray(data.courses)
          ? data.courses.map((c) => (typeof c === 'string' ? c : c._id))
          : []
        setSelectedCourseIds(ids)
        toast.success('Course dropped.')
      }
    } catch {
      toast.error('Could not connect to server while dropping course.')
    } finally {
      setUpdatingCourseId(null)
    }
  }

  const availableCourses = courses.filter((course) => !isSelected(course._id))
  const selectedCourses = courses.filter((course) => isSelected(course._id))
  const filteredAvailable = filterBySearch(availableCourses, searchAvailable)
  const filteredYourCourses = filterBySearch(selectedCourses, searchYourCourses)

  return (
    <StudentLayout>
      <h1 className="sd-page-title">Student Dashboard</h1>
      <p className="sd-page-subtitle">
        Browse available courses and add or drop them from your list.
      </p>

      <div className="sd-feature-grid">
        <button
          type="button"
          className="sd-feature-card"
          onClick={() => navigate('/study-session')}
        >
          <span className="sd-feature-label">Peer study</span>
          <strong>Create or join sessions</strong>
          <span>Use invite codes, seats, and ratings with classmates.</span>
        </button>
        <button
          type="button"
          className="sd-feature-card"
          onClick={() => navigate('/tutor-marketplace')}
        >
          <span className="sd-feature-label">Marketplace</span>
          <strong>Book a tutor</strong>
          <span>Find teachers by course offer and tuition fee.</span>
        </button>
        <button
          type="button"
          className="sd-feature-card"
          onClick={() => navigate('/ai-schedule')}
        >
          <span className="sd-feature-label">AI planner</span>
          <strong>Generate a study schedule</strong>
          <span>Build a saved weekly plan from your courses, goals, and deadlines.</span>
        </button>
      </div>

      <div className="sd-course-columns">
        <section className="sd-course-card">
          <div className="sd-section-header">
            <h2 className="sd-section-title">Available courses</h2>
          </div>
          <input
            type="text"
            className="sd-search-input"
            placeholder="Search by name or code…"
            value={searchAvailable}
            onChange={(e) => setSearchAvailable(e.target.value)}
            aria-label="Search available courses"
          />

          {(!initialCoursesLoaded && loadingCourses) || loadingSelection ? (
            <p className="sd-muted-text">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="sd-muted-text">No courses available yet.</p>
          ) : availableCourses.length === 0 ? (
            <p className="sd-muted-text">You have added all available courses.</p>
          ) : filteredAvailable.length === 0 ? (
            <p className="sd-muted-text">No matches for your search.</p>
          ) : (
            <ul className="sd-course-list">
              {filteredAvailable.map((course) => {
                const busy = updatingCourseId === course._id
                return (
                  <li key={course._id} className="sd-course-item">
                    <div className="sd-course-main">
                      <div className="sd-course-code">{course.code}</div>
                      <div className="sd-course-name">{course.name}</div>
                      <div className="sd-course-capacity">Seats: {course.seatCapacity ?? 0}</div>
                    </div>
                    <button
                      type="button"
                      className="sd-primary-btn"
                      onClick={() => handleAddCourse(course._id)}
                      disabled={busy}
                    >
                      {busy ? 'Updating…' : 'Add'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="sd-course-card">
          <div className="sd-section-header">
            <h2 className="sd-section-title">Your courses</h2>
          </div>
          <input
            type="text"
            className="sd-search-input"
            placeholder="Search by name or code…"
            value={searchYourCourses}
            onChange={(e) => setSearchYourCourses(e.target.value)}
            aria-label="Search your courses"
          />

          {(!initialCoursesLoaded && loadingCourses) || loadingSelection ? (
            <p className="sd-muted-text">Loading your courses…</p>
          ) : selectedCourses.length === 0 ? (
            <p className="sd-muted-text">You have not added any courses yet.</p>
          ) : filteredYourCourses.length === 0 ? (
            <p className="sd-muted-text">No matches for your search.</p>
          ) : (
            <ul className="sd-course-list">
              {filteredYourCourses.map((course) => {
                const busy = updatingCourseId === course._id
                return (
                  <li key={course._id} className="sd-course-item">
                    <div className="sd-course-main">
                      <div className="sd-course-code">{course.code}</div>
                      <div className="sd-course-name">{course.name}</div>
                      <div className="sd-course-capacity">Seats: {course.seatCapacity ?? 0}</div>
                    </div>
                    <button
                      type="button"
                      className="sd-secondary-btn"
                      onClick={() => handleDropCourse(course._id)}
                      disabled={busy}
                    >
                      {busy ? 'Updating…' : 'Drop'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </StudentLayout>
  )
}
