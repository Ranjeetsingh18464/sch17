import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { doc, getDoc } from './services/firebase'
import { db } from './services/firebase'
import { setSchoolSettings } from './store/slices/themeSlice'
import { useAuth } from './contexts/AuthContext'

import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import RoleGuard from './components/auth/RoleGuard'

import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import PhoneLogin from '../pages/auth/PhoneLogin'
import SchoolIdLogin from '../pages/auth/SchoolIdLogin'
import AccountApproval from '../pages/auth/AccountApproval'

import SuperAdminDashboard from './pages/super-admin/Dashboard'
import SuperAdminSchools from './pages/super-admin/Schools'
import SuperAdminAnalytics from './pages/super-admin/Analytics'
import SuperAdminUsers from './pages/super-admin/Users'
import SuperAdminRevenue from './pages/super-admin/Revenue'
import SuperAdminPlans from './pages/super-admin/Plans'
import SuperAdminModeration from './pages/super-admin/Moderation'
import SuperAdminAdControls from './pages/super-admin/AdControls'
import SuperAdminSystem from './pages/super-admin/System'

import SchoolAdminDashboard from './pages/school-admin/Dashboard'
import SchoolAdminClasses from './pages/school-admin/Classes'
import SchoolAdminSubjects from './pages/school-admin/Subjects'
import SchoolAdminTeachers from './pages/school-admin/Teachers'
import SchoolAdminStudents from './pages/school-admin/Students'
import SchoolAdminParents from './pages/school-admin/Parents'
import SchoolAdminFees from './pages/school-admin/Fees'
import SchoolAdminAttendance from './pages/school-admin/Attendance'
import SchoolAdminHomework from './pages/school-admin/Homework'
import SchoolAdminEvents from './pages/school-admin/Events'
import SchoolAdminTimetable from './pages/school-admin/Timetable'
import SchoolAdminAnnouncements from './pages/school-admin/Announcements'
import SchoolAdminCustomization from './pages/school-admin/Customization'
import SchoolAdminModeration from './pages/school-admin/Moderation'

import PrincipalDashboard from './pages/principal/Dashboard'
import PrincipalTeachers from './pages/principal/Teachers'
import PrincipalClasses from './pages/principal/Classes'
import PrincipalStudents from './pages/principal/Students'
import PrincipalAnalytics from './pages/principal/Analytics'
import PrincipalReports from './pages/principal/Reports'
import PrincipalEvents from './pages/principal/Events'
import PrincipalAnnouncements from './pages/principal/Announcements'

import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherHomework from './pages/teacher/Homework'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherMarks from './pages/teacher/Marks'
import TeacherResults from './pages/teacher/Results'
import TeacherTimetable from './pages/teacher/Timetable'
import TeacherNotes from './pages/teacher/Notes'
import TeacherQuizzes from './pages/teacher/Quizzes'
import TeacherAssignments from './pages/teacher/Assignments'
import TeacherGroups from './pages/teacher/Groups'
import TeacherGroupDetail from './pages/teacher/GroupDetail'
import TeacherCommunication from './pages/teacher/Communication'
import TeacherClassNotices from './pages/teacher/ClassNotices'

import StudentDashboard from './pages/student/Dashboard'
import StudentHomework from './pages/student/Homework'
import StudentTimetable from './pages/student/Timetable'
import StudentAttendance from './pages/student/Attendance'
import StudentResults from './pages/student/Results'
import StudentAssignments from './pages/student/Assignments'
import StudentNotes from './pages/student/Notes'
import StudentAchievements from './pages/student/Achievements'
import StudentQuizzes from './pages/student/Quizzes'
import StudentGroups from './pages/student/Groups'
import StudentAiAssistant from './pages/student/AiAssistant'
import StudentStudyPlanner from './pages/student/StudyPlanner'
import StudentProgress from './pages/student/Progress'
import StudentExamSchedule from './pages/student/ExamSchedule'

import ParentDashboard from './pages/parent/Dashboard'
import ParentChildAttendance from './pages/parent/ChildAttendance'
import ParentChildResults from './pages/parent/ChildResults'
import ParentChildHomework from './pages/parent/ChildHomework'
import ParentFees from './pages/parent/Fees'
import ParentNotices from './pages/parent/Notices'
import ParentCommunication from './pages/parent/Communication'
import ParentChildTimetable from './pages/parent/ChildTimetable'
import ParentChildAchievements from './pages/parent/ChildAchievements'
import ParentChildPerformance from './pages/parent/ChildPerformance'

import CommunityFeed from './pages/community/Feed'
import CommunityGroups from './pages/community/Groups'
import CommunityGroupDetail from './pages/community/GroupDetail'
import CommunityDoubts from './pages/community/Doubts'
import CommunityAchievementWall from './pages/community/AchievementWall'

import ChatPage from './pages/shared/Chat'
import NotificationsPage from './pages/shared/Notifications'
import FilesPage from './pages/shared/Files'
import ProfilePage from './pages/shared/Profile'
import SettingsPage from './pages/shared/Settings'

const ROLE_ROUTES = {
  super_admin: 'super_admin',
  school_admin: 'school_admin',
  principal: 'principal',
  vice_principal: 'principal',
  admin_officer: 'school_admin',
  accountant: 'school_admin',
  teacher: 'teacher',
  class_teacher: 'teacher',
  librarian: 'school_admin',
  receptionist: 'school_admin',
  student: 'student',
  parent: 'parent',
  transport: 'school_admin',
  hostel_warden: 'school_admin',
}

function ProtectedRoute() {
  const { isAuthenticated, loading, role } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return <Outlet context={{ role }} />
}

function RootRedirect() {
  const { role } = useAuth()
  const baseRoute = ROLE_ROUTES[role] || 'school_admin'
  const target = `/dashboard/${baseRoute}`
  return <Navigate to={target} replace />
}

function DynamicDashboardRedirect() {
  const { role } = useAuth()
  const baseRoute = ROLE_ROUTES[role] || 'school_admin'
  return <Navigate to={baseRoute} replace />
}

export default function App() {
  const dispatch = useDispatch()
  const { userProfile } = useAuth()
  const themeMode = useSelector((state) => state.theme.mode)
  const themeColor = useSelector((state) => state.theme.themeColor)

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [themeMode])

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor)
  }, [themeColor])

  useEffect(() => {
    if (!userProfile) return
    const serialize = (data) => {
      const r = {}
      for (const key of Object.keys(data || {})) {
        const v = data[key]
        r[key] = v?.toDate ? v.toDate().toISOString() : v
      }
      return r
    }
    const loadSettings = async () => {
      try {
        const schoolId = userProfile?.schoolId
        if (schoolId) {
          const snap = await getDoc(doc(db, 'schools', schoolId))
          if (snap.exists()) { dispatch(setSchoolSettings(serialize(snap.data()))); return }
        }
        const fallbackSnap = await getDoc(doc(db, 'settings', 'school_customization'))
        if (fallbackSnap.exists()) dispatch(setSchoolSettings(serialize(fallbackSnap.data())))
      } catch (err) {
        console.error('Failed to load school settings:', err)
      }
    }
    loadSettings()
  }, [dispatch, userProfile])

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="phone-login" element={<PhoneLogin />} />
        <Route path="school-id-login" element={<SchoolIdLogin />} />
        <Route path="approval" element={<AccountApproval />} />
      </Route>

      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<RootRedirect />} />
        <Route path="dashboard" element={<MainLayout />}>
          <Route index element={<DynamicDashboardRedirect />} />

          <Route path="super_admin" element={<Outlet />}>
            <Route index element={<RoleGuard module="dashboard"><SuperAdminDashboard /></RoleGuard>} />
            <Route path="schools" element={<RoleGuard module="branchManagement"><SuperAdminSchools /></RoleGuard>} />
            <Route path="analytics" element={<RoleGuard module="reports"><SuperAdminAnalytics /></RoleGuard>} />
            <Route path="users" element={<RoleGuard module="userManagement"><SuperAdminUsers /></RoleGuard>} />
            <Route path="revenue" element={<RoleGuard module="accounts"><SuperAdminRevenue /></RoleGuard>} />
            <Route path="plans" element={<SuperAdminPlans />} />
            <Route path="moderation" element={<RoleGuard module="complaints"><SuperAdminModeration /></RoleGuard>} />
            <Route path="ad-controls" element={<SuperAdminAdControls />} />
            <Route path="system" element={<SuperAdminSystem />} />
          </Route>

          <Route path="school_admin" element={<Outlet />}>
            <Route index element={<RoleGuard module="dashboard"><SchoolAdminDashboard /></RoleGuard>} />
            <Route path="classes" element={<RoleGuard module="studentRecords"><SchoolAdminClasses /></RoleGuard>} />
            <Route path="subjects" element={<RoleGuard module="studentRecords"><SchoolAdminSubjects /></RoleGuard>} />
            <Route path="teachers" element={<RoleGuard module="staffManagement"><SchoolAdminTeachers /></RoleGuard>} />
            <Route path="students" element={<RoleGuard module="studentAdmission"><SchoolAdminStudents /></RoleGuard>} />
            <Route path="parents" element={<RoleGuard module="studentAdmission"><SchoolAdminParents /></RoleGuard>} />
            <Route path="fees" element={<RoleGuard module="feeCollection"><SchoolAdminFees /></RoleGuard>} />
            <Route path="attendance" element={<RoleGuard module="attendance"><SchoolAdminAttendance /></RoleGuard>} />
            <Route path="homework" element={<RoleGuard module="homework"><SchoolAdminHomework /></RoleGuard>} />
            <Route path="events" element={<RoleGuard module="events"><SchoolAdminEvents /></RoleGuard>} />
            <Route path="timetable" element={<RoleGuard module="timetable"><SchoolAdminTimetable /></RoleGuard>} />
            <Route path="announcements" element={<RoleGuard module="noticeBoard"><SchoolAdminAnnouncements /></RoleGuard>} />
            <Route path="moderation" element={<RoleGuard module="complaints"><SchoolAdminModeration /></RoleGuard>} />
            <Route path="customization" element={<RoleGuard module="schoolSettings"><SchoolAdminCustomization /></RoleGuard>} />
          </Route>

          <Route path="principal" element={<Outlet />}>
            <Route index element={<RoleGuard module="dashboard"><PrincipalDashboard /></RoleGuard>} />
            <Route path="teachers" element={<RoleGuard module="staffManagement"><PrincipalTeachers /></RoleGuard>} />
            <Route path="classes" element={<PrincipalClasses />} />
            <Route path="students" element={<RoleGuard module="studentRecords"><PrincipalStudents /></RoleGuard>} />
            <Route path="analytics" element={<RoleGuard module="reports"><PrincipalAnalytics /></RoleGuard>} />
            <Route path="reports" element={<RoleGuard module="reports"><PrincipalReports /></RoleGuard>} />
            <Route path="events" element={<RoleGuard module="events"><PrincipalEvents /></RoleGuard>} />
            <Route path="announcements" element={<RoleGuard module="noticeBoard"><PrincipalAnnouncements /></RoleGuard>} />
          </Route>

          <Route path="teacher" element={<Outlet />}>
            <Route index element={<RoleGuard module="dashboard"><TeacherDashboard /></RoleGuard>} />
            <Route path="homework" element={<RoleGuard module="homework"><TeacherHomework /></RoleGuard>} />
            <Route path="attendance" element={<RoleGuard module="attendance"><TeacherAttendance /></RoleGuard>} />
            <Route path="marks" element={<RoleGuard module="marksReportCards"><TeacherMarks /></RoleGuard>} />
            <Route path="results" element={<RoleGuard module="marksReportCards"><TeacherResults /></RoleGuard>} />
            <Route path="timetable" element={<RoleGuard module="timetable"><TeacherTimetable /></RoleGuard>} />
            <Route path="notes" element={<RoleGuard module="documents"><TeacherNotes /></RoleGuard>} />
            <Route path="quizzes" element={<RoleGuard module="exams"><TeacherQuizzes /></RoleGuard>} />
            <Route path="assignments" element={<RoleGuard module="homework"><TeacherAssignments /></RoleGuard>} />
            <Route path="groups" element={<RoleGuard module="documents"><TeacherGroups /></RoleGuard>} />
            <Route path="groups/:id" element={<RoleGuard module="documents"><TeacherGroupDetail /></RoleGuard>} />
            <Route path="communication" element={<RoleGuard module="smsEmail"><TeacherCommunication /></RoleGuard>} />
            <Route path="class-notices" element={<RoleGuard module="noticeBoard"><TeacherClassNotices /></RoleGuard>} />
          </Route>

          <Route path="student" element={<Outlet />}>
            <Route index element={<RoleGuard module="dashboard"><StudentDashboard /></RoleGuard>} />
            <Route path="homework" element={<RoleGuard module="homework"><StudentHomework /></RoleGuard>} />
            <Route path="timetable" element={<RoleGuard module="timetable"><StudentTimetable /></RoleGuard>} />
            <Route path="attendance" element={<RoleGuard module="attendance"><StudentAttendance /></RoleGuard>} />
            <Route path="results" element={<RoleGuard module="marksReportCards"><StudentResults /></RoleGuard>} />
            <Route path="assignments" element={<RoleGuard module="homework"><StudentAssignments /></RoleGuard>} />
            <Route path="notes" element={<RoleGuard module="documents"><StudentNotes /></RoleGuard>} />
            <Route path="achievements" element={<StudentAchievements />} />
            <Route path="quizzes" element={<RoleGuard module="exams"><StudentQuizzes /></RoleGuard>} />
            <Route path="groups" element={<StudentGroups />} />
            <Route path="ai-assistant" element={<StudentAiAssistant />} />
            <Route path="study-planner" element={<StudentStudyPlanner />} />
            <Route path="progress" element={<RoleGuard module="reports"><StudentProgress /></RoleGuard>} />
            <Route path="exam-schedule" element={<RoleGuard module="exams"><StudentExamSchedule /></RoleGuard>} />
          </Route>

          <Route path="parent" element={<Outlet />}>
            <Route index element={<RoleGuard module="dashboard"><ParentDashboard /></RoleGuard>} />
            <Route path="child-attendance" element={<RoleGuard module="attendance"><ParentChildAttendance /></RoleGuard>} />
            <Route path="child-results" element={<RoleGuard module="marksReportCards"><ParentChildResults /></RoleGuard>} />
            <Route path="child-homework" element={<RoleGuard module="homework"><ParentChildHomework /></RoleGuard>} />
            <Route path="fees" element={<RoleGuard module="feeCollection"><ParentFees /></RoleGuard>} />
            <Route path="notices" element={<RoleGuard module="noticeBoard"><ParentNotices /></RoleGuard>} />
            <Route path="communication" element={<RoleGuard module="smsEmail"><ParentCommunication /></RoleGuard>} />
            <Route path="child-timetable" element={<RoleGuard module="timetable"><ParentChildTimetable /></RoleGuard>} />
            <Route path="child-achievements" element={<ParentChildAchievements />} />
            <Route path="child-performance" element={<RoleGuard module="reports"><ParentChildPerformance /></RoleGuard>} />
          </Route>

          <Route path="community" element={<Outlet />}>
            <Route index element={<CommunityFeed />} />
            <Route path="feed" element={<CommunityFeed />} />
            <Route path="groups" element={<CommunityGroups />} />
            <Route path="groups/:groupId" element={<CommunityGroupDetail />} />
            <Route path="doubts" element={<CommunityDoubts />} />
            <Route path="achievement-wall" element={<CommunityAchievementWall />} />
          </Route>

          <Route path="chat" element={<Outlet />}>
            <Route index element={<ChatPage />} />
          </Route>

          <Route path="notifications" element={<Outlet />}>
            <Route index element={<NotificationsPage />} />
          </Route>

          <Route path="files" element={<Outlet />}>
            <Route index element={<FilesPage />} />
          </Route>

          <Route path="profile" element={<Outlet />}>
            <Route index element={<ProfilePage />} />
          </Route>

          <Route path="settings" element={<Outlet />}>
            <Route index element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  )
}
