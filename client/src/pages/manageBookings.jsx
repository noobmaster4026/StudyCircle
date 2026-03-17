import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import TeacherLayout from './teacher_layout'
import '../styles/teacher_dashboard.css'

const API_URL = 'http://localhost:5000/api/bookings/tutor'

export default function ManageBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  const getAuthToken = () => localStorage.getItem('token')

  const fetchBookings = async () => {
    const token = getAuthToken()
    if (!token) {
      setBookings([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Unable to load bookings.')
        return
      }
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Could not connect to server while loading bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  return (
    <TeacherLayout>
      <div className="td-hero">
        <div>
          <h1 className="td-hero-title">Manage bookings</h1>
          <p className="td-hero-subtitle">
            See who booked you and when.
          </p>
        </div>
        <button type="button" className="td-btn td-btn-secondary" onClick={fetchBookings}>
          Refresh
        </button>
      </div>

      <section className="td-card">
        <div className="td-card-header">
          <h2 className="td-card-title">Your booked sessions</h2>
        </div>

        {loading ? (
          <p className="td-muted">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <p className="td-muted">No one has booked you yet.</p>
        ) : (
          <div className="td-booking-list">
            {bookings.map((b) => {
              const student = b.student || {}
              const dateText = b.date ? new Date(b.date).toLocaleDateString() : '—'
              const tutor = b.tutor || {}
              const primaryCourse = tutor.courses?.[0] || {}
              const courseCode = primaryCourse.courseCode || tutor.courseCode || '—'
              const courseName =
                tutor.course || primaryCourse.courseName || primaryCourse.name || 'General tutoring'

              return (
                <div key={b._id} className="td-booking-item">
                  <div className="td-booking-main">
                    <div className="td-booking-title">
                      {student.name || student.email || 'Student'}
                    </div>
                    <div className="td-booking-sub">
                      {courseCode} • {courseName}
                    </div>
                  </div>
                  <div className="td-booking-meta">
                    <div className="td-booking-date">{dateText}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </TeacherLayout>
  )
}

