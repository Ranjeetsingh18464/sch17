import { useState, useEffect } from 'react'
import { db, collection, onSnapshot } from '../../services/firebase'

const statusColors = {
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function Revenue() {
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState([
    { label: 'Monthly Revenue', value: '...', change: '—' },
    { label: 'Annual Revenue', value: '...', change: '—' },
    { label: 'Pending Payouts', value: '...', change: '—' },
    { label: 'Avg per School', value: '...', change: '—' },
  ])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fees'), (snap) => {
      const list = []
      let total = 0
      let pending = 0
      const schools = new Set()

      snap.forEach(d => {
        const data = d.data()
        const amount = Number(data.amount) || 0
        list.push({ id: d.id, date: data.dueDate || data.createdAt?.toDate?.()?.toISOString().split('T')[0] || '—', school: data.schoolName || data.schoolId || '—', amount: `₹${amount.toLocaleString('en-IN')}`, status: data.status || 'Pending', _amount: amount })
        total += amount
        if (data.status === 'Pending') pending += amount
        if (data.schoolId) schools.add(data.schoolId)
      })

      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))

      const monthly = total / 12
      const avg = schools.size > 0 ? total / schools.size : 0

      setStats([
        { label: 'Monthly Revenue', value: `₹${Math.round(monthly).toLocaleString('en-IN')}`, change: '—' },
        { label: 'Annual Revenue', value: `₹${total.toLocaleString('en-IN')}`, change: '—' },
        { label: 'Pending Payouts', value: `₹${pending.toLocaleString('en-IN')}`, change: '—' },
        { label: 'Avg per School', value: `₹${Math.round(avg).toLocaleString('en-IN')}`, change: '—' },
      ])

      setTransactions(list)
    })
    return unsub
  }, [])

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.status.toLowerCase() === filter)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Revenue</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">{s.change}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">School</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-3 text-gray-900 dark:text-white">{t.date}</td>
                    <td className="px-2 py-3 text-gray-600 dark:text-gray-400">{t.school}</td>
                    <td className="px-2 py-3 text-gray-900 dark:text-white font-medium">{t.amount}</td>
                    <td className="px-2 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[t.status] || ''}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-2 py-8 text-center text-gray-400">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
