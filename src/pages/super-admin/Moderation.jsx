import { useState, useEffect } from 'react'
import { db, collection, doc, updateDoc, onSnapshot } from '../../services/firebase'

export default function Moderation() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'moderationLogs'), (snap) => {
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setItems(list)
    })
    return unsub
  }, [])

  const handleAction = async (id, status) => {
    try {
      await updateDoc(doc(db, 'moderationLogs', id), { action: status, moderatedAt: new Date().toISOString() })
    } catch (err) {
      console.error('Moderation action error:', err)
    }
  }

  const filtered = filter === 'all' ? items : items.filter((i) => (i.action || 'pending') === filter)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Moderation</h1>

        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f} {f === 'all' ? '' : `(${items.filter((i) => (i.action || 'pending') === f).length})`}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((item) => {
            const status = item.action || 'pending'
            return (
              <div key={item.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {item.type || 'Flag'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : status === 'approved' || status === 'flagged'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{item.reason || item.content || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      By {item.contentId || 'unknown'} &middot; {item.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}
                    </p>
                  </div>
                  {status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleAction(item.id, 'approved')} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition">Approve</button>
                      <button onClick={() => handleAction(item.id, 'rejected')} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No {filter} items found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
