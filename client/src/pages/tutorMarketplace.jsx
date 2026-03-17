import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import StudentLayout from './student_layout'
import '../styles/tutorMarketplace.css'

const API_URL = 'http://localhost:5000/api/tutors'

export default function TutorMarketplace() {
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(false)

  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingTutor, setBookingTutor] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingSaving, setBookingSaving] = useState(false)

  const getAuthToken = () => localStorage.getItem('token')

  const fetchBookings = async () => {
    setBookingsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        setBookings([])
        return
      }

      const res = await fetch('http://localhost:5000/api/bookings', {
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
      setBookingsLoading(false)
    }
  }

  const openBookingModal = (tutor) => {
    setBookingTutor(tutor)
    setBookingDate('')
    setBookingModalOpen(true)
  }

  const closeBookingModal = () => {
    setBookingModalOpen(false)
    setBookingTutor(null)
    setBookingDate('')
  }

  const handleBookingSave = async () => {
    if (!bookingTutor) return

    const selectedDate = bookingDate
    if (!selectedDate) {
      toast.error('Please select a date for your booking.')
      return
    }

    setBookingDate(selectedDate)

    const dateObj = new Date(selectedDate)
    const dateLabel = dateObj.toLocaleDateString()
    const confirmed = window.confirm(
      `Confirm booking with ${bookingTutor.name || bookingTutor.fullName || 'this tutor'} on ${dateLabel}?`,
    )
    if (!confirmed) {
      setBookingDate('')
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast.error('You must be logged in to create a booking.')
      return
    }

    setBookingSaving(true)
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tutorId: bookingTutor._id || bookingTutor.id,
          date: selectedDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Failed to create booking.')
        return
      }
      toast.success('Booking confirmed.')
      closeBookingModal()
      fetchBookings()
    } catch {
      toast.error('Could not connect to server while saving booking.')
    } finally {
      setBookingSaving(false)
    }
  }

  const fetchTutors = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Unable to load tutors.')
        return
      }
      setTutors(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Could not connect to server while loading tutors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTutors()
    fetchBookings()
  }, [])

  return (
    <StudentLayout>
      <div className="tm-root">
        <header className="tm-header">
          <div>
            <h1 className="tm-title">Tutor marketplace</h1>
            <p className="tm-subtitle">
              Browse available tutors and book a session.
            </p>
          </div>
        </header>

        <main className="tm-main">
          <div className="tm-layout">
            <section className="tm-tutors">
              <h2 className="tm-subtitle tm-section-title">Available tutors</h2>
              {loading ? (
                <p className="tm-muted">Loading tutors…</p>
              ) : tutors.length === 0 ? (
                <p className="tm-muted">No tutors available yet.</p>
              ) : (
                <div className="tm-list">
                  {tutors.map((tutor) => {
                    const primaryCourse = tutor.courses?.[0] || {}
                    const courseCode =
                      primaryCourse.courseCode || tutor.courseCode || '—'
                    const courseName =
                      tutor.course || primaryCourse.courseName || primaryCourse.name || 'General tutoring'
                    const price =
                      tutor.rate != null ? tutor.rate : primaryCourse.rate != null ? primaryCourse.rate : null

                    return (
                      <div key={tutor._id || tutor.id} className="tm-card">
                        <div className="tm-card-header">
                          <div>
                            <div className="tm-card-name">
                              {tutor.name || tutor.fullName || 'Unknown Tutor'}
                            </div>
                            <div className="tm-card-email">{tutor.email || ''}</div>
                          </div>
                        </div>

                        <div className="tm-card-body">
                          <div className="tm-card-course">
                            <span className="tm-card-label">Course</span>
                            <div className="tm-card-course-details">
                              <span className="tm-card-course-code">{courseCode}</span>
                              <span className="tm-card-course-name">{courseName}</span>
                            </div>
                          </div>
                          <div className="tm-card-price">
                            <span className="tm-card-label">Tution Fee</span>
                            <span className="tm-card-value">
                              {price != null ? <>BDT {price}</> : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="tm-card-actions">
                          <button
                            type="button"
                            className="tm-btn tm-btn-primary"
                            onClick={() => openBookingModal(tutor)}
                          >
                            Book tutor
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <aside className="tm-sidebar">
              <h2 className="tm-subtitle tm-section-title">Booked tutors</h2>
              {bookingsLoading ? (
                <p className="tm-muted">Loading bookings…</p>
              ) : bookings.length === 0 ? (
                <p className="tm-muted">No bookings yet.</p>
              ) : (
                <div className="tm-bookings-list">
                  {bookings.map((booking) => {
                    const tutor = booking.tutor || {}
                    const primaryCourse = tutor.courses?.[0] || {}
                    const courseCode =
                      primaryCourse.courseCode || tutor.courseCode || '—'
                    const courseName =
                      tutor.course || primaryCourse.courseName || primaryCourse.name || 'General tutoring'
                    const price =
                      tutor.rate != null ? tutor.rate : primaryCourse.rate != null ? primaryCourse.rate : null
                    const dateText = new Date(booking.date).toLocaleDateString()

                    return (
                      <div key={booking._id} className="tm-booking-card">
                        <div className="tm-booking-main">
                          <div className="tm-booking-card-person">
                            {tutor.name || tutor.fullName || 'Tutor'}
                          </div>
                          <div className="tm-booking-course">
                            <span className="tm-booking-course-code">{courseCode}</span>
                            <span className="tm-booking-course-name">{courseName}</span>
                          </div>
                        </div>
                        <div className="tm-booking-meta">
                          <div className="tm-booking-card-date">{dateText}</div>
                          <div className="tm-booking-card-price">
                            {price != null ? <>BDT {price}</> : 'N/A'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      {bookingModalOpen && (
        <div className="tm-modal-backdrop" onClick={closeBookingModal}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tm-modal-title">Book a session</h2>
            <p className="tm-modal-subtitle">
              Select a date to book a session with{' '}
              <strong>
                {bookingTutor?.name || bookingTutor?.fullName || 'this tutor'}
              </strong>
              .
            </p>

            <label className="tm-modal-field">
              <span className="tm-modal-label">Choose a date</span>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="tm-modal-input"
              />
            </label>

            <div className="tm-modal-actions">
              <button
                type="button"
                className="tm-btn tm-btn-primary"
                onClick={handleBookingSave}
                disabled={bookingSaving}
              >
                Confirm booking
              </button>
              <button
                type="button"
                className="tm-btn"
                onClick={closeBookingModal}
                disabled={bookingSaving}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  )
}
