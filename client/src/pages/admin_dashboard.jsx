import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../styles/admin_dashboard.css'

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [courses, setCourses] = useState([])
  const [courseForm, setCourseForm] = useState({ name: '', code: '', seatCapacity: 0 })
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [editingSeatCapacity, setEditingSeatCapacity] = useState(0)
  const navigate = useNavigate()

  const COURSES_API = 'http://localhost:5000/api/courses'

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const initial = (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase()

  const handleSettings = () => {
    setIsProfileMenuOpen(false)
    navigate('/settings')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsProfileMenuOpen(false)
    toast.success('Logged out successfully')
    navigate('/')
  }

  // Load courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true)
      try {
        const res = await fetch(COURSES_API)
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.message || 'Failed to load courses.')
        } else {
          setCourses(data)
        }
      } catch {
        toast.error('Could not connect to server while loading courses.')
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [])

  const handleCourseChange = (e) => {
    const { name, value } = e.target
    setCourseForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    if (!courseForm.name.trim() || !courseForm.code.trim()) {
      toast.error('Please provide course name and code.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch(COURSES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: courseForm.name.trim(),
          code: courseForm.code.trim(),
          seatCapacity: Number(courseForm.seatCapacity) || 0,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to create course.')
      } else {
        setCourses((prev) => [data, ...prev])
        setCourseForm({ name: '', code: '', seatCapacity: 0 })
        toast.success('Course created.')
      }
    } catch {
      toast.error('Could not connect to server while creating course.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`${COURSES_API}/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to delete course.')
      } else {
        setCourses((prev) => prev.filter((c) => c._id !== id))
        toast.success('Course deleted.')
      }
    } catch {
      toast.error('Could not connect to server while deleting course.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStartEditCourse = (course) => {
    setEditingCourseId(course._id)
    setEditingSeatCapacity(course.seatCapacity ?? 0)
  }

  const handleCancelEdit = () => {
    setEditingCourseId(null)
    setEditingSeatCapacity(0)
  }

  const handleSaveCourseEdit = async (courseId) => {
    const capacityNumber = Number(editingSeatCapacity)
    if (Number.isNaN(capacityNumber) || capacityNumber < 0) {
      toast.error('Seat capacity must be a non-negative number.')
      return
    }

    try {
      const res = await fetch(`${COURSES_API}/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatCapacity: capacityNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Failed to update course.')
        return
      }

      setCourses((prev) => prev.map((course) => (course._id === data._id ? data : course)))
      toast.success('Course updated.')
      handleCancelEdit()
    } catch {
      toast.error('Could not connect to server while updating course.')
    }
  }

  return (
    <div className="ad-root">
      <header className="ad-navbar">
        <div className="ad-nav-left">
          <button
            type="button"
            className="ad-toggle-btn"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <span className="ad-logo-text">StudyCircle Admin</span>
        </div>

        <div className="ad-nav-right">
          {user && (
            <span className="ad-nav-username">
              {user.name || user.email}
            </span>
          )}

          <div className="ad-avatar-wrapper">
            <button
              type="button"
              className="ad-avatar-circle"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
            >
              {initial}
            </button>

            {isProfileMenuOpen && (
              <div className="ad-profile-menu">
                <button
                  type="button"
                  className="ad-profile-item"
                  onClick={handleSettings}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className="ad-profile-item ad-profile-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="ad-layout">
        <aside
          className={`ad-sidebar ${
            isSidebarOpen ? 'ad-sidebar-open' : 'ad-sidebar-closed'
          }`}
        >
          <div className="ad-sidebar-section-title">Menu</div>
          <button
            type="button"
            className="ad-sidebar-item ad-sidebar-item-active"
          >
            Select course
          </button>
        </aside>

        <main
          className={`ad-main ${
            isSidebarOpen ? 'ad-main-with-sidebar' : 'ad-main-full'
          }`}
        >
          <h1 className="ad-page-title">Admin Dashboard</h1>
          <p className="ad-page-subtitle">
            Create and manage courses for your institution.
          </p>

          <section className="ad-course-card">
            <h2 className="ad-section-title">Create course</h2>
            <form className="ad-course-form" onSubmit={handleCreateCourse}>
              <div className="ad-course-fields">
                <div className="ad-field">
                  <label className="ad-label" htmlFor="course-name">Course name</label>
                  <input
                    id="course-name"
                    name="name"
                    className="ad-input"
                    placeholder="e.g. Introduction to Algorithms"
                    value={courseForm.name}
                    onChange={handleCourseChange}
                  />
                </div>
                <div className="ad-field">
                  <label className="ad-label" htmlFor="course-code">Course code</label>
                  <input
                    id="course-code"
                    name="code"
                    className="ad-input"
                    placeholder="e.g. CS101"
                    value={courseForm.code}
                    onChange={handleCourseChange}
                  />
                </div>
                <div className="ad-field">
                  <label className="ad-label" htmlFor="seat-capacity">Seat capacity</label>
                  <input
                    id="seat-capacity"
                    name="seatCapacity"
                    type="number"
                    min={0}
                    className="ad-input"
                    value={courseForm.seatCapacity}
                    onChange={handleCourseChange}
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="ad-primary-btn"
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create course'}
              </button>
            </form>
          </section>

          <section className="ad-course-list-section">
            <div className="ad-section-header">
              <h2 className="ad-section-title">Courses</h2>
            </div>

            {loadingCourses ? (
              <p className="ad-muted-text">Loading courses…</p>
            ) : courses.length === 0 ? (
              <p className="ad-muted-text">No courses created yet.</p>
            ) : (
              <ul className="ad-course-list">
                {courses.map((course) => (
                  <li key={course._id} className="ad-course-item">
                    <div className="ad-course-main">
                      <div className="ad-course-code">{course.code}</div>
                      <div className="ad-course-name">{course.name}</div>
                      <div className="ad-course-capacity">
                        Seat capacity: {course.seatCapacity ?? 0}
                      </div>
                    </div>

                    {editingCourseId === course._id ? (
                      <div className="ad-course-actions">
                        <input
                          type="number"
                          className="ad-input ad-input-small"
                          value={editingSeatCapacity}
                          min={0}
                          onChange={(e) => setEditingSeatCapacity(e.target.value)}
                        />
                        <button
                          type="button"
                          className="ad-btn ad-btn-primary"
                          onClick={() => handleSaveCourseEdit(course._id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="ad-btn ad-btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="ad-course-actions">
                        <button
                          type="button"
                          className="ad-btn ad-btn-secondary"
                          onClick={() => handleStartEditCourse(course)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ad-danger-btn"
                          onClick={() => handleDeleteCourse(course._id)}
                          disabled={deletingId === course._id}
                        >
                          {deletingId === course._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
