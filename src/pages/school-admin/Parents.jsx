import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db, collection, doc, getDocs, setDoc, query, where } from '../../services/firebase'
import { useAuthorization } from '../../hooks/useAuthorization'
import { createUserAccount } from '../../services/authService'
import toast from 'react-hot-toast'

export default function Parents() {
  const navigate = useNavigate()
  const { userProfile, loading: authLoading } = useAuth()
  const { can } = useAuthorization()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [filterName, setFilterName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '+91 ', password: '12345678', children: '' })

  useEffect(() => {
    if (!authLoading && userProfile) fetchData()
  }, [authLoading, userProfile])

  const fetchData = async () => {
    setLoading(true)
    try {
      const schoolId = userProfile?.schoolId || ''
      let snap
      try {
        const q = schoolId
          ? query(collection(db, 'users'), where('role', '==', 'student'), where('schoolId', '==', schoolId))
          : query(collection(db, 'users'), where('role', '==', 'student'))
        snap = await getDocs(q)
      } catch {
        try { snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student'))) } catch { snap = { forEach: () => {} } }
      }
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      setStudents(list)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s => {
    if (filterName && !s.name.toLowerCase().includes(filterName.toLowerCase()) && !(s.parent || '').toLowerCase().includes(filterName.toLowerCase())) return false
    return true
  })

  const handleAddParent = async () => {
    if (!form.name) { toast.error('Parent name is required'); return }
    setSaving(true)
    try {
      const schoolId = userProfile?.schoolId || ''
      const parentId = 'PAR-' + String(Date.now()).slice(-5)
      const email = form.email || form.name.toLowerCase().replace(/\s+/g, '.') + '@parent.school'

      await createUserAccount({
        email,
        password: form.password,
        name: form.name,
        role: 'parent',
        parentId,
        schoolId,
        phone: form.phone,
        children: form.children ? form.children.split(',').map(c => c.trim()) : [],
      })

      const parentDocId = doc(collection(db, 'users')).id
      await setDoc(doc(db, 'users', parentDocId), {
        name: form.name,
        email,
        parentId,
        schoolId,
        role: 'parent',
        phone: form.phone,
        children: form.children ? form.children.split(',').map(c => c.trim()) : [],
        isActive: true,
      })

      toast.success(`Parent account created! ID: ${parentId}, Email: ${email}`)
      setForm({ name: '', email: '', phone: '+91 ', password: '12345678', children: '' })
      setShowForm(false)
    } catch (err) {
      toast.error(err.message || 'Failed to create parent')
    } finally {
      setSaving(false)
    }
  }

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Parents</h1>
          {can('studentRecords', 'create') && (
            <button onClick={() => setShowForm(!showForm)} className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">{showForm ? 'Cancel' : '+ Add Parent'}</button>
          )}
        </div>

        {showForm && (
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Parent</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Parent Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email (for login)</label>
                <input type="email" placeholder="parent@school.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                <input type="text" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Password</label>
                <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Children (comma-separated names)</label>
                <input type="text" placeholder="e.g. Rahul, Priya" value={form.children} onChange={e => setForm({ ...form, children: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddParent} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50">{saving ? 'Creating...' : 'Add Parent'}</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">* A parent login account will be auto-created.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <input value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Search by student or parent name..." className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 flex-1 min-w-[200px]" />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Student Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Father's Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Father's Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Address</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.parent || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.parentPhone || s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.address || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewing(s)} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {viewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewing(null)}>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{viewing.name}</h2>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500 dark:text-gray-400">Father's Name: <span className="text-gray-900 dark:text-white">{viewing.parent || '—'}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Father's Phone: <span className="text-gray-900 dark:text-white">{viewing.parentPhone || viewing.phone || '—'}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Grade: <span className="text-gray-900 dark:text-white">{viewing.grade} - {viewing.section}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Student Phone: <span className="text-gray-900 dark:text-white">{viewing.phone || '—'}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Address: <span className="text-gray-900 dark:text-white">{viewing.address || '—'}</span></p>
              </div>
              <button onClick={() => setViewing(null)} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
