import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import TeacherLayout from './teacher_layout'
import '../styles/teacher_dashboard.css'

const COURSES_API = 'http://localhost:5000/api/courses'

export default function ManageCourse() {
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const [courses, setCourses] = useState([])
  const [savedCourses, setSavedCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [savingCourseId, setSavingCourseId] = useState(null)
  const [removingCourseId, setRemovingCourseId] = useState(null)
  const [rateByCourseId, setRateByCourseId] = useState({})
  const [searchAvailable, setSearchAvailable] = useState('')
  const [searchYourOffers, setSearchYourOffers] = useState('')

  const getAuthToken = () => localStorage.getItem('token')

  const filterBySearch = (list, query) => {
    if (!query.trim()) return list
    const q = query.trim().toLowerCase()
    return list.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q),
    )
  }

  const fetchMyProfile = async () => {
    const token = getAuthToken()
    if (!token) return

    setLoadingProfile(true)
    try {
      const res = await fetch('http://localhost:5000/api/tutors/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Unable to load your tutor profile.')
        return
      }

      const offers = Array.isArray(data.courses) ? data.courses : []
      setSavedCourses(offers)

      const map = {}
      offers.forEach((o) => {
        if (o.courseId) map[o.courseId] = o.rate ?? ''
      })
      setRateByCourseId(map)
    } catch {
      toast.error('Could not connect to server while loading profile.')
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchCourses = async () => {
    setLoadingCourses(true)
    try {
      const res = await fetch(COURSES_API)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Failed to load courses.')
        return
      }
      setCourses(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Could not connect to server while loading courses.')
    } finally {
      setLoadingCourses(false)
    }
  }

  useEffect(() => {
    fetchCourses()
    fetchMyProfile()
  }, [])

  const persistSavedCourses = async (coursesToSave) => {
    const token = getAuthToken()
    if (!token) {
      toast.error('You must be logged in as a teacher.')
      return coursesToSave
    }

    try {
      const res = await fetch('http://localhost:5000/api/tutors/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courses: coursesToSave }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save profile.')
      }

      return Array.isArray(data.courses) ? data.courses : coursesToSave
    } catch (err) {
      toast.error(err.message || 'Could not save profile.')
      return coursesToSave
    }
  }

  const isOffered = (courseId) =>
    savedCourses.some((c) => String(c.courseId) === String(courseId))

  const handleSaveOffer = async (course) => {
    if (!course?._id) return

    const rawRate = rateByCourseId[course._id]
    const rateNumber = Number(rawRate)
    if (Number.isNaN(rateNumber) || rateNumber <= 0) {
      toast.error('Please enter a valid rate in BDT.')
      return
    }

    setSavingCourseId(course._id)
    try {
      const record = {
        courseId: course._id,
        courseCode: course.code,
        courseName: course.name,
        rate: rateNumber,
      }

      const updated = savedCourses.slice()
      const existingIndex = updated.findIndex(
        (c) => String(c.courseId) === String(record.courseId),
      )
      if (existingIndex >= 0) updated[existingIndex] = record
      else updated.push(record)

      const persisted = await persistSavedCourses(updated)
      setSavedCourses(persisted)
      toast.success('Course offer saved.')
    } finally {
      setSavingCourseId(null)
    }
  }

  const handleRemoveOffer = async (courseId) => {
    setRemovingCourseId(courseId)
    try {
      const updated = savedCourses.filter((c) => String(c.courseId) !== String(courseId))
      const persisted = await persistSavedCourses(updated)
      setSavedCourses(persisted)
      toast.success('Course offer removed.')
    } finally {
      setRemovingCourseId(null)
    }
  }

  const availableCourses = courses
  const yourOffers = savedCourses

  const filteredAvailable = filterBySearch(availableCourses, searchAvailable)
  const filteredOffers = filterBySearch(
    yourOffers.map((o) => ({ _id: o.courseId, code: o.courseCode, name: o.courseName, rate: o.rate })),
    searchYourOffers,
  )

  const loading = loadingCourses || loadingProfile

  return (
    <TeacherLayout>
      <div className="td-hero">
        <div>
          <h1 className="td-hero-title">Manage course</h1>
          <p className="td-hero-subtitle">
            Add the courses you teach and set your rate in <strong>BDT</strong>.
          </p>
        </div>
        <div className="td-hero-badge">
          {user?.name || user?.email ? (
            <>
              <span className="td-hero-dot" />
              <span>{user.name || user.email}</span>
            </>
          ) : (
            'Teacher'
          )}
        </div>
      </div>

      <div className="td-course-columns">
        <section className="td-card">
          <div className="td-card-header">
            <h2 className="td-card-title">Available courses</h2>
          </div>
          <input
            type="text"
            className="td-search-input"
            placeholder="Search by name or code…"
            value={searchAvailable}
            onChange={(e) => setSearchAvailable(e.target.value)}
          />

          {loading ? (
            <p className="td-muted">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="td-muted">No courses available yet.</p>
          ) : filteredAvailable.length === 0 ? (
            <p className="td-muted">No matches for your search.</p>
          ) : (
            <ul className="td-course-list-modern">
              {filteredAvailable.map((course) => {
                const offered = isOffered(course._id)
                const busy = savingCourseId === course._id
                const currentRate = rateByCourseId[course._id] ?? ''

                return (
                  <li key={course._id} className="td-course-item-modern">
                    <div className="td-course-main">
                      <div className="td-course-code">{course.code}</div>
                      <div className="td-course-name">{course.name}</div>
                    </div>

                    <div className="td-offer-controls">
                      <div className="td-rate-input-wrap">
                        <span className="td-rate-prefix">BDT</span>
                        <input
                          type="number"
                          className="td-rate-input"
                          value={currentRate}
                          onChange={(e) =>
                            setRateByCourseId((prev) => ({
                              ...prev,
                              [course._id]: e.target.value,
                            }))
                          }
                          min={0}
                          step={1}
                          placeholder="Rate"
                          aria-label={`Rate for ${course.code}`}
                        />
                      </div>

                      <button
                        type="button"
                        className="td-btn td-btn-primary td-btn-small"
                        onClick={() => handleSaveOffer(course)}
                        disabled={busy}
                      >
                        {busy ? 'Saving…' : offered ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="td-card">
          <div className="td-card-header">
            <h2 className="td-card-title">Your offers</h2>
          </div>
          <input
            type="text"
            className="td-search-input"
            placeholder="Search by name or code…"
            value={searchYourOffers}
            onChange={(e) => setSearchYourOffers(e.target.value)}
          />

          {loading ? (
            <p className="td-muted">Loading your offers…</p>
          ) : savedCourses.length === 0 ? (
            <p className="td-muted">You haven’t added any course offers yet.</p>
          ) : filteredOffers.length === 0 ? (
            <p className="td-muted">No matches for your search.</p>
          ) : (
            <div className="td-saved-list">
              {filteredOffers.map((item) => {
                const busy = removingCourseId === item._id
                return (
                  <div key={item._id} className="td-saved-item td-saved-item-modern">
                    <div>
                      <strong>{item.code}</strong> • {item.name}
                      <div className="td-saved-sub">
                        Rate: <strong>BDT {Number(item.rate || 0).toFixed(0)}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="td-btn td-btn-secondary td-btn-small"
                      onClick={() => handleRemoveOffer(item._id)}
                      disabled={busy}
                    >
                      {busy ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </TeacherLayout>
  )
}

