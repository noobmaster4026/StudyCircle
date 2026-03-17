import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import StudentLayout from './student_layout'
import '../styles/studySession.css'

const API_URL = 'http://localhost:5000/api/study-sessions'

export default function StudySession() {
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const userName = user?.name || user?.email || 'Student'
  const userId = user?.id

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState(null)
  const [joiningSessionId, setJoiningSessionId] = useState(null)
  const [activeTab, setActiveTab] = useState('my') // 'my' | 'joined' | 'explore'
  const [selectedSession, setSelectedSession] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberRatings, setMemberRatings] = useState([])
  const [memberAverage, setMemberAverage] = useState(null)
  const [memberRatingCount, setMemberRatingCount] = useState(0)
  const [memberRatingScore, setMemberRatingScore] = useState(0)
  const [memberRatingComment, setMemberRatingComment] = useState('')
  const [loadingMemberRatings, setLoadingMemberRatings] = useState(false)
  const [savingMemberRating, setSavingMemberRating] = useState(false)
  const [memberRatingsMap, setMemberRatingsMap] = useState({})

  const [form, setForm] = useState({
    name: '',
    description: '',
    seatMode: 'unlimited',
    seatLimit: 5,
  })

  const [createdInviteCode, setCreatedInviteCode] = useState(null)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinTarget, setJoinTarget] = useState(null)
  const [joinCode, setJoinCode] = useState('')

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const url = userId ? `${API_URL}?userId=${encodeURIComponent(userId)}` : API_URL
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Unable to load sessions.')
        return
      }
      setSessions(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Could not connect to server while loading sessions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const isCreator = (session) =>
    String(session.creator?.userId || '') === String(userId || '')

  const isParticipant = (session) =>
    Array.isArray(session.participants) &&
    session.participants.some(
      (p) => String(p.userId || '') === String(userId || ''),
    )

  const mySessions = sessions.filter((session) => isCreator(session))
  const joinedSessions = sessions.filter(
    (session) => !isCreator(session) && isParticipant(session),
  )
  const exploreSessions = sessions

  const visibleSessions =
    activeTab === 'my'
      ? mySessions
      : activeTab === 'joined'
      ? joinedSessions
      : exploreSessions

  useEffect(() => {
    setSelectedSession(null)
  }, [activeTab])

  const openCreateModal = () => {
    setCreatedInviteCode(null)
    setForm({ name: '', description: '', seatMode: 'unlimited', seatLimit: 5 })
    setModalOpen(true)
  }

  const openJoinModalByCode = () => {
    setJoinTarget(null)
    setJoinCode('')
    setJoinModalOpen(true)
  }

  const closeCreateModal = () => {
    setModalOpen(false)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Session name is required.')
      return
    }

    if (!userId) {
      toast.error('You must be logged in to create a session.')
      return
    }

    setCreating(true)

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        seatLimit: form.seatMode === 'unlimited' ? null : Number(form.seatLimit),
        creator: {
          userId,
          name: userName,
          email: user?.email,
        },
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to create session.')
      } else {
        toast.success('Session created.')
        setCreatedInviteCode(data.inviteCode || null)
        closeCreateModal()
        fetchSessions()
      }
    } catch {
      toast.error('Could not connect to server while creating session.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (sessionId) => {
    if (!userId) return

    setDeletingSessionId(sessionId)
    try {
      const res = await fetch(`${API_URL}/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to delete session.')
      } else {
        toast.success('Session deleted.')
        fetchSessions()
      }
    } catch {
      toast.error('Could not connect to server while deleting session.')
    } finally {
      setDeletingSessionId(null)
    }
  }

  const openJoinModal = (session) => {
    setJoinTarget(session)
    setJoinCode(session?.inviteCode || '')
    setJoinModalOpen(true)
  }

  const closeJoinModal = () => {
    setJoinModalOpen(false)
    setJoinTarget(null)
    setJoinCode('')
  }

  const openDetailsModal = async (session) => {
    setSelectedSession(session)
    setDetailsModalOpen(true)

    // Fetch latest ratings for all members of this session (from ratings collection)
    const map = {}
    await Promise.all(
      (session.participants || []).map(async (member) => {
        if (!member.userId) return
        try {
          const res = await fetch(`http://localhost:5000/api/ratings/${member.userId}`)
          const data = await res.json()
          if (res.ok) {
            map[member.userId] = data.average ?? null
          }
        } catch {
          // Ignore fetch failures; will show fallback
        }
      }),
    )
    setMemberRatingsMap(map)
  }

  const closeDetailsModal = () => {
    setDetailsModalOpen(false)
  }

  const openMemberModal = async (member) => {
    // Close session detail modal so only one overlay is visible.
    setDetailsModalOpen(false)

    setSelectedMember(member)
    setMemberModalOpen(true)
    setMemberRatings([])
    setMemberAverage(null)
    setMemberRatingCount(0)
    setMemberRatingScore(0)
    setMemberRatingComment('')

    // Fetch latest ratings for this member
    setLoadingMemberRatings(true)
    try {
      const res = await fetch(`http://localhost:5000/api/ratings/${member.userId}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Could not load member ratings.')
        return
      }

      setMemberRatings(Array.isArray(data.ratings) ? data.ratings : [])
      setMemberAverage(data.average ?? null)
      setMemberRatingCount(data.count ?? 0)

      // If current user already rated, prefill
      const already = (data.ratings || []).find(
        (r) => String(r.reviewerId) === String(userId),
      )
      if (already) {
        setMemberRatingScore(already.score || 0)
        setMemberRatingComment(already.comment || '')
      }
    } catch {
      toast.error('Could not connect to server while loading ratings.')
    } finally {
      setLoadingMemberRatings(false)
    }
  }

  const closeMemberModal = () => {
    setMemberModalOpen(false)
    setSelectedMember(null)
  }

  const getAuthToken = () => localStorage.getItem('token')

  const submitMemberRating = async () => {
    if (!userId) {
      toast.error('You must be logged in to rate members.')
      return
    }

    if (!selectedMember) return

    const score = Number(memberRatingScore)
    if (!score || score < 1 || score > 5) {
      toast.error('Please choose a rating between 1 and 5.')
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast.error('You must be logged in to rate members.')
      return
    }

    setSavingMemberRating(true)
    try {
      const res = await fetch(
        `http://localhost:5000/api/ratings/${selectedMember.userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            score,
            comment: memberRatingComment.trim(),
          }),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Could not save rating.')
        return
      }

      setMemberRatings(Array.isArray(data.ratings) ? data.ratings : [])
      setMemberAverage(data.average ?? null)
      setMemberRatingCount(data.count ?? 0)
      toast.success('Rating saved.')
    } catch {
      toast.error('Could not connect to server while saving rating.')
    } finally {
      setSavingMemberRating(false)
    }
  }

  const handleJoinSubmit = async () => {
    if (!userId) {
      toast.error('You must be logged in to join a session.')
      return
    }

    if (!joinCode.trim()) {
      toast.error('Invite code is required.')
      return
    }

    // Find matching session by invite code locally
    const target = sessions.find(
      (session) => session.inviteCode === joinCode.trim(),
    )

    if (!target) {
      toast.error('No session found with that invite code.')
      return
    }

    setJoiningSessionId(target._id)

    try {
      const res = await fetch(`${API_URL}/${target._id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: userName,
          email: user?.email,
          inviteCode: joinCode.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to join session.')
      } else {
        toast.success('Joined session.')
        closeJoinModal()
        fetchSessions()
      }
    } catch {
      toast.error('Could not connect to server while joining session.')
    } finally {
      setJoiningSessionId(null)
    }
  }

  const formatSeats = (session) => {
    const taken = session.participants?.length ?? 0
    if (!session.seatLimit) {
      return `${taken} joined (unlimited)`
    }
    return `${taken} / ${session.seatLimit} joined`
  }

  const renderRating = (rating) => {
    if (rating == null) return '—'
    const clamped = Math.max(0, Math.min(5, rating))
    const full = Math.floor(clamped)
    const empty = 5 - full
    const stars = '★'.repeat(full) + '☆'.repeat(empty)
    return `${stars} ${clamped.toFixed(1)}`
  }

  return (
    <StudentLayout>
      <div className="ss-root">
        <header className="ss-header">
          <div>
            <h1 className="ss-title">Study session</h1>
            <p className="ss-subtitle">
              Welcome {userName}. Join or create sessions with your peers.
            </p>

            <div className="ss-tabbar">
              <button
                type="button"
                className={`ss-tab ${activeTab === 'my' ? 'ss-tab-active' : ''}`}
                onClick={() => setActiveTab('my')}
              >
                My sessions
              </button>
              <button
                type="button"
                className={`ss-tab ${activeTab === 'joined' ? 'ss-tab-active' : ''}`}
                onClick={() => setActiveTab('joined')}
              >
                Joined sessions
              </button>
              <button
                type="button"
                className={`ss-tab ${activeTab === 'explore' ? 'ss-tab-active' : ''}`}
                onClick={() => setActiveTab('explore')}
              >
                Explore
              </button>
            </div>
          </div>

          <div className="ss-actions">
            <button
              type="button"
              className="ss-big-btn ss-secondary"
              onClick={openJoinModalByCode}
            >
              Join session
            </button>
            <button
              type="button"
              className="ss-big-btn ss-primary"
              onClick={openCreateModal}
            >
              Create session
            </button>
          </div>
        </header>

        <main className="ss-main">
          <div className="ss-content">
            <div className="ss-main-panel">
              <div className="ss-session-list">
                <div className="ss-session-list-header">
                  <h2 className="ss-sidebar-title">
                    {activeTab === 'my'
                      ? 'My sessions'
                      : activeTab === 'joined'
                      ? 'Joined sessions'
                      : 'Explore sessions'}
                  </h2>
                </div>

                {loading ? (
                  <p className="ss-muted-text">Loading sessions…</p>
                ) : visibleSessions.length === 0 ? (
                  <p className="ss-muted-text">
                    {activeTab === 'my'
                      ? 'You have not created or joined any sessions yet.'
                      : activeTab === 'joined'
                      ? 'You have not joined any sessions yet.'
                      : 'No sessions found.'}
                  </p>
                ) : (
                  visibleSessions.map((session) => {
                    const owned = isCreator(session)
                    const busy =
                      deletingSessionId === session._id ||
                      joiningSessionId === session._id
                    const joined = session.participants?.some(
                      (p) => String(p.userId) === String(userId),
                    )

                    return (
                      <div
                        key={session._id}
                        className={`ss-session-card ${
                          selectedSession?._id === session._id
                            ? 'ss-session-selected'
                            : ''
                        }`}
                        onClick={() => openDetailsModal(session)}
                      >
                        <div className="ss-session-header">
                          <div>
                            <div className="ss-session-name">
                              {session.name}
                            </div>
                            <div className="ss-session-meta">
                              {formatSeats(session)} • Created by {session.creator?.name}
                            </div>
                            {owned && session.inviteCode && (
                              <div className="ss-session-invite">
                                Invite code: <strong>{session.inviteCode}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ss-session-description">
                          {session.description || 'No description provided.'}
                        </div>

                        <div className="ss-session-actions">
                          {owned ? (
                            <button
                              type="button"
                              className="ss-session-btn ss-danger"
                              onClick={() => handleDelete(session._id)}
                              disabled={busy}
                            >
                              {busy ? 'Deleting…' : 'Delete'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="ss-session-btn ss-primary"
                              onClick={() => openJoinModal(session)}
                              disabled={busy || joined}
                            >
                              {joined ? 'Joined' : busy ? 'Joining…' : 'Join'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </main>

        {modalOpen && (
          <div className="ss-modal-overlay" role="dialog" aria-modal="true">
            <div className="ss-modal">
              <div className="ss-modal-header">
                <h2 className="ss-modal-title">Create study session</h2>
                <button
                  type="button"
                  className="ss-modal-close"
                  onClick={closeCreateModal}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="ss-modal-body">
                <label className="ss-field">
                  <span className="ss-field-label">Session name</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="ss-input"
                    placeholder="e.g. Algebra study group"
                  />
                </label>

                <label className="ss-field">
                  <span className="ss-field-label">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="ss-textarea"
                    rows={3}
                    placeholder="Optional details (topics, meeting link, etc.)"
                  />
                </label>

                <div className="ss-field">
                  <span className="ss-field-label">Seat limit</span>
                  <div className="ss-seat-options">
                    <label className="ss-radio">
                      <input
                        type="radio"
                        name="seatMode"
                        value="unlimited"
                        checked={form.seatMode === 'unlimited'}
                        onChange={() =>
                          setForm((prev) => ({ ...prev, seatMode: 'unlimited' }))
                        }
                      />
                      <span>Unlimited</span>
                    </label>
                    <label className="ss-radio">
                      <input
                        type="radio"
                        name="seatMode"
                        value="limited"
                        checked={form.seatMode === 'limited'}
                        onChange={() =>
                          setForm((prev) => ({ ...prev, seatMode: 'limited' }))
                        }
                      />
                      <span>Set seat count</span>
                    </label>
                  </div>

                  {form.seatMode === 'limited' && (
                    <input
                      type="number"
                      className="ss-input"
                      value={form.seatLimit}
                      min={1}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          seatLimit: Number(e.target.value),
                        }))
                      }
                    />
                  )}
                </div>
              </div>

              <div className="ss-modal-actions">
                <button
                  type="button"
                  className="ss-secondary-btn"
                  onClick={closeCreateModal}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ss-primary-btn"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? 'Creating…' : 'Create session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {joinModalOpen && (
          <div className="ss-modal-overlay" role="dialog" aria-modal="true">
            <div className="ss-modal">
              <div className="ss-modal-header">
                <h2 className="ss-modal-title">Join session</h2>
                <button
                  type="button"
                  className="ss-modal-close"
                  onClick={closeJoinModal}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="ss-modal-body">
                <p className="ss-modal-text">
                  Enter the 9-character code provided by the session creator.
                </p>
                <label className="ss-field">
                  <span className="ss-field-label">Invite code</span>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
                    className="ss-input"
                    maxLength={9}
                    placeholder="e.g. abcdefghi"
                  />
                </label>
              </div>

              <div className="ss-modal-actions">
                <button
                  type="button"
                  className="ss-secondary-btn"
                  onClick={closeJoinModal}
                  disabled={joiningSessionId}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ss-primary-btn"
                  onClick={handleJoinSubmit}
                  disabled={joiningSessionId}
                >
                  {joiningSessionId ? 'Joining…' : 'Join session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {detailsModalOpen && selectedSession && (
          <div className="ss-modal-overlay" role="dialog" aria-modal="true">
            <div className="ss-modal">
              <div className="ss-modal-header">
                <h2 className="ss-modal-title">{selectedSession.name}</h2>
                <button
                  type="button"
                  className="ss-modal-close"
                  onClick={closeDetailsModal}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="ss-modal-body">
                <p className="ss-modal-text">
                  {selectedSession.description || 'No description provided.'}
                </p>
                <p className="ss-modal-text">
                  {formatSeats(selectedSession)} • Created by {selectedSession.creator?.name}
                </p>

                <h3 className="ss-sidebar-title">Members</h3>
                {selectedSession.participants?.length ? (
                  <ul className="ss-member-list">
                    {selectedSession.participants.map((participant) => (
                      <li
                        key={participant.userId}
                        className="ss-member ss-member-clickable"
                        onClick={() => openMemberModal(participant)}
                      >
                        <div className="ss-member-name">{participant.name}</div>
                        <div className="ss-member-rating">
                          {renderRating(memberRatingsMap[participant.userId] ?? participant.rating)}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ss-muted-text">No members have joined yet.</p>
                )}
              </div>

              <div className="ss-modal-actions">
                <button
                  type="button"
                  className="ss-primary-btn"
                  onClick={closeDetailsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {memberModalOpen && selectedMember && (
          <div className="ss-modal-overlay" role="dialog" aria-modal="true">
            <div className="ss-modal ss-modal-modern">
              <div className="ss-modal-header">
                <h2 className="ss-modal-title">{selectedMember.name}</h2>
                <button
                  type="button"
                  className="ss-modal-close"
                  onClick={closeMemberModal}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="ss-modal-body">
                <p className="ss-modal-text">
                  {selectedMember.email}
                </p>

                <div className="ss-field">
                  <span className="ss-field-label">Current rating</span>
                  <div className="ss-member-rating">
                    {memberAverage != null
                      ? renderRating(memberAverage)
                      : 'No ratings yet'}
                    {memberRatingCount > 0 && (
                      <span className="ss-muted-text"> ({memberRatingCount})</span>
                    )}
                  </div>
                </div>

                <h3 className="ss-sidebar-title">Add / update rating</h3>
                <div className="ss-field">
                  <span className="ss-field-label">Score</span>
                  <div className="ss-score-options">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`ss-score-btn ${
                          memberRatingScore === val ? 'ss-score-btn-active' : ''
                        }`}
                        onClick={() => setMemberRatingScore(val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="ss-field">
                  <span className="ss-field-label">Comment (optional)</span>
                  <textarea
                    value={memberRatingComment}
                    onChange={(e) => setMemberRatingComment(e.target.value)}
                    className="ss-textarea"
                    rows={3}
                    placeholder="Optional note for the member"
                  />
                </label>

              </div>

              <div className="ss-modal-actions">
                <button
                  type="button"
                  className="ss-secondary-btn"
                  onClick={closeMemberModal}
                  disabled={savingMemberRating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ss-primary-btn"
                  onClick={submitMemberRating}
                  disabled={savingMemberRating}
                >
                  {savingMemberRating ? 'Updating…' : 'Update rating'}
                </button>
              </div>
            </div>
          </div>
        )}

        {createdInviteCode && (
          <div className="ss-modal-overlay" role="dialog" aria-modal="true">
            <div className="ss-modal">
              <div className="ss-modal-header">
                <h2 className="ss-modal-title">Session created</h2>
                <button
                  type="button"
                  className="ss-modal-close"
                  onClick={() => setCreatedInviteCode(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="ss-modal-body">
                <p className="ss-modal-text">
                  Share the following code with classmates so they can join your session.
                </p>
                <div className="ss-invite-code">
                  <span className="ss-invite-code-value">{createdInviteCode}</span>
                  <button
                    type="button"
                    className="ss-secondary-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteCode)
                      toast.success('Invite code copied to clipboard')
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="ss-modal-actions">
                <button
                  type="button"
                  className="ss-primary-btn"
                  onClick={() => setCreatedInviteCode(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
