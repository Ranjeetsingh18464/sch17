import { useState, useEffect } from 'react'
import { db, collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from '../../services/firebase'

export default function Dashboard() {
  const [selectedStat, setSelectedStat] = useState(null)
  const [stats, setStats] = useState([
    { label: 'Schools', value: '...', color: 'bg-blue-500' },
    { label: 'Users', value: '...', color: 'bg-green-500' },
    { label: 'Revenue', value: '...', color: 'bg-purple-500' },
    { label: 'Active', value: '...', color: 'bg-teal-500' },
  ])
  const [plans, setPlans] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState({ name: '', price: '', features: '', popular: false, active: true })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [schoolsSnap, usersSnap, feesSnap] = await Promise.all([
          getDocs(collection(db, 'schools')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'fees')),
        ])

        const schoolCount = schoolsSnap.size
        const userCount = usersSnap.size

        let totalRevenue = 0
        feesSnap.forEach(d => { const a = d.data().amount; if (a) totalRevenue += Number(a) })

        let activeCount = 0
        usersSnap.forEach(d => { if (d.data().isActive) activeCount++ })
        const activePct = userCount > 0 ? Math.round((activeCount / userCount) * 100) : 0

        const fmtRevenue = totalRevenue >= 10000000
          ? `₹${(totalRevenue / 10000000).toFixed(1)}Cr`
          : totalRevenue >= 100000
            ? `₹${(totalRevenue / 100000).toFixed(1)}L`
            : `₹${totalRevenue.toLocaleString('en-IN')}`

        setStats([
          { label: 'Schools', value: schoolCount.toLocaleString('en-IN'), color: 'bg-blue-500' },
          { label: 'Users', value: userCount.toLocaleString('en-IN'), color: 'bg-green-500' },
          { label: 'Revenue', value: fmtRevenue, color: 'bg-purple-500' },
          { label: 'Active', value: `${activePct}%`, color: 'bg-teal-500' },
        ])
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'subscriptionPlans'), (snap) => {
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      if (list.length > 0) setPlans(list)
    })
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'activityLog'))
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setRecentActivity(list.slice(0, 20))
    })
    return unsub
  }, [])

  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    if (!planForm.name || !planForm.price) return
    try {
      if (editingPlan) {
        const ref = doc(db, 'subscriptionPlans', editingPlan.id)
        await setDoc(ref, { ...planForm, updatedAt: serverTimestamp() }, { merge: true })
        setEditingPlan(null)
      } else {
        const ref = doc(collection(db, 'subscriptionPlans'))
        await setDoc(ref, { ...planForm, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      }
    } catch (err) {
      console.error('Plan save error:', err)
    }
    setPlanForm({ name: '', price: '', features: '', popular: false, active: true })
    setShowPlanForm(false)
  }

  const startEditPlan = (plan) => {
    setEditingPlan(plan)
    setPlanForm({ name: plan.name, price: plan.price, features: plan.features, popular: plan.popular, active: plan.active })
    setShowPlanForm(true)
  }

  const deletePlan = async (id) => {
    try {
      await deleteDoc(doc(db, 'subscriptionPlans', id))
    } catch (err) {
      console.error('Delete plan error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Super Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => setSelectedStat(selectedStat === s.label ? null : s.label)}
              className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-left transition ${
                selectedStat === s.label ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{s.value}</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Plans</h2>
            <button onClick={() => { setShowPlanForm(!showPlanForm); setEditingPlan(null) }} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">{showPlanForm ? 'Cancel' : '+ Add Plan'}</button>
          </div>

          {showPlanForm && (
            <form onSubmit={handlePlanSubmit} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Plan Name *</label>
                  <input type="text" placeholder="e.g. Basic" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Price</label>
                  <input type="text" placeholder="e.g. ₹999/mo" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Features</label>
                  <input type="text" placeholder="Comma separated" value={planForm.features} onChange={e => setPlanForm({ ...planForm, features: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={planForm.popular} onChange={e => setPlanForm({ ...planForm, popular: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={planForm.active} onChange={e => setPlanForm({ ...planForm, active: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">{editingPlan ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => { setShowPlanForm(false); setEditingPlan(null); setPlanForm({ name: '', price: '', features: '', popular: false, active: true }) }} className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className={`rounded-lg border p-4 relative ${plan.popular ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-400' : 'border-gray-200 dark:border-gray-700'}`}>
                {plan.popular && <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded-full">Popular</span>}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => startEditPlan(plan)} className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button onClick={() => deletePlan(plan.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.price}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{plan.features}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${plan.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{plan.active ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-1">
            {recentActivity.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No activity yet</p>}
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {item.createdAt?.toDate?.() ? formatRelativeTime(item.createdAt.toDate()) : item.time || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatRelativeTime(date) {
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
