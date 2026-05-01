import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../styles/teacher_dashboard.css'

export default function TeacherLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const initial = (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase()
  const isActive = (path) => location.pathname === path

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

  return (
    <div className="td-root">
      <header className="td-navbar">
        <div className="td-nav-left">
          <button
            type="button"
            className="td-toggle-btn"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <span className="td-logo-text">StudyCircle</span>
        </div>

        <div className="td-nav-right">
          {user && <span className="td-nav-username">{user.name || user.email}</span>}

          <div className="td-avatar-wrapper">
            <button
              type="button"
              className="td-avatar-circle"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
            >
              {initial}
            </button>

            {isProfileMenuOpen && (
              <div className="td-profile-menu">
                <button type="button" className="td-profile-item" onClick={handleSettings}>
                  Settings
                </button>
                <button
                  type="button"
                  className="td-profile-item td-profile-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="td-layout">
        <aside
          className={`td-sidebar ${isSidebarOpen ? 'td-sidebar-open' : 'td-sidebar-closed'}`}
        >
          <div className="td-sidebar-section-title">Menu</div>
          <button
            type="button"
            className={`td-sidebar-item ${isActive('/teacher/manage-course') ? 'td-sidebar-item-active' : ''}`}
            onClick={() => navigate('/teacher/manage-course')}
          >
            Manage course
          </button>
          <button
            type="button"
            className={`td-sidebar-item ${isActive('/teacher/manage-bookings') ? 'td-sidebar-item-active' : ''}`}
            onClick={() => navigate('/teacher/manage-bookings')}
          >
            Manage bookings
          </button>
        </aside>

        <main className={`td-main ${isSidebarOpen ? 'td-main-with-sidebar' : 'td-main-full'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}

