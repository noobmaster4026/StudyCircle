import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../styles/student_dashboard.css'

export default function StudentLayout({ children }) {
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

  const isActive = (path) => location.pathname === path

  return (
    <div className="sd-root">
      <header className="sd-navbar">
        <div className="sd-nav-left">
          <button
            type="button"
            className="sd-toggle-btn"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <span className="sd-logo-text">StudyCircle</span>
        </div>

        <div className="sd-nav-right">
          {user && (
            <span className="sd-nav-username">{user.name || user.email}</span>
          )}

          <div className="sd-avatar-wrapper">
            <button
              type="button"
              className="sd-avatar-circle"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
            >
              {initial}
            </button>

            {isProfileMenuOpen && (
              <div className="sd-profile-menu">
                <button
                  type="button"
                  className="sd-profile-item"
                  onClick={handleSettings}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className="sd-profile-item sd-profile-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="sd-layout">
        <aside
          className={`sd-sidebar ${
            isSidebarOpen ? 'sd-sidebar-open' : 'sd-sidebar-closed'
          }`}
        >
          <div className="sd-sidebar-section-title">Menu</div>
          <button
            type="button"
            className={`sd-sidebar-item ${
              isActive('/student') ? 'sd-sidebar-item-active' : ''
            }`}
            onClick={() => navigate('/student')}
          >
            Select course
          </button>
          <button
            type="button"
            className={`sd-sidebar-item ${
              isActive('/study-session') ? 'sd-sidebar-item-active' : ''
            }`}
            onClick={() => navigate('/study-session')}
          >
            Study session
          </button>
          <button
            type="button"
            className={`sd-sidebar-item ${
              isActive('/tutor-marketplace') ? 'sd-sidebar-item-active' : ''
            }`}
            onClick={() => navigate('/tutor-marketplace')}
          >
            Tutor marketplace
          </button>
        </aside>

        <main
          className={`sd-main ${
            isSidebarOpen ? 'sd-main-with-sidebar' : 'sd-main-full'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
