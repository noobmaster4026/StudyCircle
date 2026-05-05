import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import RegLog from './pages/reglog'
import Homepage from './pages/homepage'
import StudentDashboard from './pages/student_dashboard'
import TeacherDashboard from './pages/teacher_dashboard'
import AdminDashboard from './pages/admin_dashboard'
import Settings from './pages/settings'
import StudySession from './pages/studySession'
import TutorMarketplace from './pages/tutorMarketplace'
import ManageCourse from './pages/manageCourse'
import ManageBookings from './pages/manageBookings'
import AiStudySchedule from './pages/ai'

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<RegLog />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/manage-course" element={<ManageCourse />} />
        <Route path="/teacher/manage-bookings" element={<ManageBookings />} />
        <Route path="/teacher/*" element={<Navigate to="/teacher/manage-course" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/study-session" element={<StudySession />} />
        <Route path="/tutor-marketplace" element={<TutorMarketplace />} />
        <Route path="/ai-schedule" element={<AiStudySchedule />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  )
}

export default App
