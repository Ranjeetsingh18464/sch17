import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { db, collection, doc, getDocs, deleteDoc, query, where } from '../../services/firebase'

export default function Dashboard() {
  const navigate = useNavigate()
  const { userProfile, loading: authLoading } = useAuth()
  const [selectedStat, setSelectedStat] = useState(null)
  const [counts, setCounts] = useState({ teachers: 0, students: 0, parents: 0, events: 0, fees: 0, announcements: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const schoolId = userProfile?.schoolId || ''
      console.log('[Dashboard] fetching with schoolId:', schoolId)
      const userRef = collection(db, 'users')

      let teacherSnap, studentSnap, parentSnap, eventSnap, announcementSnap, feeRecordSnap
      try { teacherSnap = await getDocs(query(userRef, where('role', '==', 'teacher'), where('schoolId', '==', schoolId))) } catch { teacherSnap = { forEach: () => {} } }
      try { studentSnap = await getDocs(query(userRef, where('role', '==', 'student'), where('schoolId', '==', schoolId))) } catch { studentSnap = { forEach: () => {} } }
      try { parentSnap = await getDocs(query(userRef, where('role', '==', 'parent'), where('schoolId', '==', schoolId))) } catch { parentSnap = { forEach: () => {} } }
      try { eventSnap = await getDocs(collection(db, 'events')) } catch { eventSnap = { forEach: () => {} } }
      try { announcementSnap = await getDocs(collection(db, 'announcements')) } catch { announcementSnap = { forEach: () => {} } }
      try { feeRecordSnap = await getDocs(collection(db, 'feeRecords')) } catch { feeRecordSnap = { forEach: () => {} } }

      const teachers = []
      teacherSnap.forEach(d => teachers.push(d.id))
      const students = []
      studentSnap.forEach(d => students.push({ id: d.id, ...d.data() }))
      const parents = []
      parentSnap.forEach(d => parents.push(d.id))
      const events = []
      eventSnap.forEach(d => events.push({ id: d.id, ...d.data() }))
      const announcements = []
      announcementSnap.forEach(d => announcements.push({ id: d.id, ...d.data() }))
      const feeRecords = []
      feeRecordSnap.forEach(d => feeRecords.push({ id: d.id, ...d.data() }))

      setCounts({
        teachers: teachers.length,
        students: students.length,
        parents: parents.length,
        events: events.length,
        announcements: announcements.length,
        fees: feeRecords.length,
      })

      const activity = []
      events.forEach(ev => {
        activity.push({ action: 'Event created', detail: `${ev.title} - ${ev.date || ''}`, time: ev.date || '', docId: ev.id, collection: 'events' })
      })
      announcements.slice(-3).forEach(a => {
        activity.push({ action: 'Announcement posted', detail: `${a.title} - ${a.date || ''}`, time: a.date || '', docId: a.id, collection: 'announcements' })
      })
      students.slice(-3).forEach(s => {
        activity.push({ action: 'New student admitted', detail: `${s.name} - ${s.grade || ''} ${s.section || ''}`, time: '', docId: s.id, collection: 'users' })
      })
      activity.sort((a, b) => b.time.localeCompare(a.time))
      setRecentActivity(activity.slice(0, 10))
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('[Dashboard] authLoading:', authLoading, 'userProfile:', userProfile)
    if (!authLoading && userProfile) fetchDashboardData()
  }, [authLoading, userProfile])

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete this ${item.action.toLowerCase()}?`)) return
    try {
      await deleteDoc(doc(db, item.collection, item.docId))
      toast.success(`${item.action} deleted`)
      fetchDashboardData()
    } catch (err) {
      console.error('Failed to delete:', err)
      toast.error('Failed to delete')
    }
  }

  const stats = [
    { label: 'Teachers', value: String(counts.teachers), color: 'bg-blue-500', path: '/dashboard/school_admin/teachers' },
    { label: 'Students', value: String(counts.students), color: 'bg-green-500', path: '/dashboard/school_admin/students' },
    { label: 'Parents', value: String(counts.parents), color: 'bg-purple-500', path: '/dashboard/school_admin/parents' },
    { label: 'Fees', value: String(counts.fees), color: 'bg-amber-500', path: '/dashboard/school_admin/fees' },
    { label: 'Events', value: String(counts.events), color: 'bg-teal-500', path: '/dashboard/school_admin/events' },
    { label: 'Announcements', value: String(counts.announcements), color: 'bg-rose-500', path: '/dashboard/school_admin/announcements' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">← Back</button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">School Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-left transition ${
                selectedStat === s.label ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
                </div>
                <button
                  onClick={() => navigate(s.path)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title={`View ${s.label}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No recent activity</p>
            ) : recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mr-2">{item.time}</span>
                {item.docId && (
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition flex-shrink-0"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
