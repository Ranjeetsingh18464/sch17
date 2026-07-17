import { useState, useEffect } from 'react'
import { db, collection, getDocs } from '../../services/firebase'

export default function Analytics() {
  const [activeTab] = useState('overview')
  const [cards, setCards] = useState([
    { label: 'Total Users', value: '...', change: '—', positive: true },
    { label: 'Total Schools', value: '...', change: '—', positive: true },
    { label: 'Revenue (YTD)', value: '...', change: '—', positive: true },
    { label: 'Growth Rate', value: '...', change: '—', positive: true },
  ])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const [schoolsSnap, usersSnap, feesSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, 'schools')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'fees')),
          getDocs(collection(db, 'moderationLogs')),
        ])

        const schoolCount = schoolsSnap.size
        const userCount = usersSnap.size

        let totalRevenue = 0
        feesSnap.forEach(d => { const a = d.data().amount; if (a) totalRevenue += Number(a) })
        const fmtRevenue = totalRevenue >= 10000000
          ? `₹${(totalRevenue / 10000000).toFixed(1)}Cr`
          : totalRevenue >= 100000
            ? `₹${(totalRevenue / 100000).toFixed(1)}L`
            : `₹${totalRevenue.toLocaleString('en-IN')}`

        let activeCount = 0
        usersSnap.forEach(d => { if (d.data().isActive) activeCount++ })
        const growth = userCount > 0 ? Math.round((activeCount / userCount) * 100) + '%' : '0%'

        setCards([
          { label: 'Total Users', value: userCount.toLocaleString('en-IN'), change: `+${Math.round(userCount * 0.05)}`, positive: true },
          { label: 'Total Schools', value: schoolCount.toLocaleString('en-IN'), change: '—', positive: true },
          { label: 'Revenue (YTD)', value: fmtRevenue, change: '—', positive: true },
          { label: 'Active Rate', value: growth, change: '—', positive: true },
        ])

        const activity = []
        logsSnap.forEach(d => activity.push({ id: d.id, ...d.data() }))
        activity.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setRecentActivity(activity.slice(0, 10).map(a => ({
          event: a.type || 'Event',
          detail: a.reason || a.content || '—',
          user: a.moderatedBy || 'System',
          time: a.createdAt?.toDate?.() ? formatTime(a.createdAt.toDate()) : '—',
        })))
      } catch (err) {
        console.error('Analytics fetch error:', err)
      }
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{c.value}</p>
              <p className={`text-sm mt-1 ${c.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{c.change}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Moderation Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">Event</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">Detail</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">Source</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-3 text-gray-900 dark:text-white font-medium">{item.event}</td>
                    <td className="px-2 py-3 text-gray-600 dark:text-gray-400">{item.detail}</td>
                    <td className="px-2 py-3 text-gray-600 dark:text-gray-400">{item.user}</td>
                    <td className="px-2 py-3 text-gray-400 dark:text-gray-500">{item.time}</td>
                  </tr>
                ))}
                {recentActivity.length === 0 && (
                  <tr><td colSpan={4} className="px-2 py-8 text-center text-gray-400">No activity yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day ago`
  return date.toLocaleDateString('en-IN')
}
