import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createUserAccount } from '../../services/authService'
import { db, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, deleteField } from '../../services/firebase'
import toast from 'react-hot-toast'

const genCode = (prefix) => {
  const n = Math.floor(100 + Math.random() * 900)
  return `${prefix}${n}`
}

const genId = (prefix) => {
  const n = Date.now() % 10000
  return `${prefix}${String(n).padStart(3, '0')}`
}

export default function Schools() {
  const { user } = useAuth()
  const [schools, setSchools] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', adminName: '', principal: '', adminEmail: '', adminPassword: '12345678', phone: '', plan: 'No Plan', address: '', active: true, createdBy: user?.email || 'Super Admin', createdAt: '' })

  useEffect(() => {
    if (!form.createdAt) {
      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      setForm(prev => ({ ...prev, createdAt: today }))
    }
  }, [user])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'schools'), (snap) => {
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      setSchools(list)
    })
    return unsub
  }, [])

  const toggleStatus = async (id) => {
    try {
      const school = schools.find(s => s.id === id)
      if (school) await updateDoc(doc(db, 'schools', id), { active: !school.active, updatedAt: serverTimestamp() })
    } catch (err) {
      toast.error('Failed to toggle status: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this school? This action cannot be undone.')) return
    try {
      await deleteDoc(doc(db, 'schools', id))
      toast.success('School deleted')
    } catch (err) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.principal) return
    if (editing) {
      try {
        await setDoc(doc(db, 'schools', editing.id), { ...form, updatedAt: serverTimestamp() }, { merge: true })
        setEditing(null)
        toast.success('School updated')
      } catch (err) {
        toast.error('Update failed: ' + err.message)
        return
      }
    } else {
      if (!form.adminEmail || !form.adminPassword) {
        toast.error('Admin email and password are required for new schools')
        return
      }
      setLoading(true)
      try {
        const schoolId = genCode('SCH-')
        const adminId = genId('ADM-')

        await setDoc(doc(db, 'schools', schoolId), {
          schoolId,
          adminId,
          name: form.name,
          adminName: form.adminName,
          principal: form.principal,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          phone: form.phone,
          plan: form.plan,
          address: form.address,
          active: form.active,
          createdBy: form.createdBy || user?.email || 'Super Admin',
          createdAt: form.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        try {
          const result = await createUserAccount({
            email: form.adminEmail,
            password: form.adminPassword,
            name: form.adminName,
            role: 'school_admin',
            adminId,
            schoolId,
            phone: form.phone,
          })
          await updateDoc(doc(db, 'schools', schoolId), { adminUid: result.uid })
        } catch (authErr) {
          console.error('Admin auth creation failed:', authErr)
          toast.error('School saved but admin account creation failed. You may need to create the admin manually.')
        }

        toast.success(`School created! Admin ID: ${adminId}, Email: ${form.adminEmail}`)
      } catch (err) {
        toast.error(err.message || 'Failed to create school')
        return
      } finally {
        setLoading(false)
      }
    }
    setForm({ name: '', adminName: '', principal: '', adminEmail: '', adminPassword: '12345678', phone: '', plan: 'No Plan', address: '', active: true, createdBy: user?.email || 'Super Admin', createdAt: '' })
    setShowForm(false)
  }

  const startEdit = (school) => {
    setEditing(school)
    setForm({ name: school.name, adminName: school.adminName, principal: school.principal, adminEmail: school.adminEmail, adminPassword: school.adminPassword, phone: school.phone, plan: school.plan, address: school.address, active: school.active, createdBy: school.createdBy, createdAt: school.createdAt || '' })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', adminName: '', principal: '', adminEmail: '', adminPassword: '12345678', phone: '', plan: 'No Plan', address: '', active: true, createdBy: user?.email || 'Super Admin', createdAt: '' })
  }

  const cleanupProfile = async () => {
    if (!user) return toast.error('Not logged in')
    try {
      const fields = { grade: deleteField(), section: deleteField(), studentId: deleteField(), parentId: deleteField(), parent: deleteField(), children: deleteField() }
      await updateDoc(doc(db, 'users', user.uid), fields)
      toast.success('Profile cleaned up successfully')
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Schools</h1>
          <div className="flex gap-2">
            {user?.uid === 'lZVVHv872zMDKFRQN3507hp2HiJ3' && (
              <button onClick={cleanupProfile} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition">
                Cleanup Profile
              </button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              {showForm ? 'Cancel' : '+ Add School'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Edit School' : 'Add New School'}</h2>
              <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School ID</label>
                  <div className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm font-mono">{editing ? editing.schoolId : genCode('SCH-')}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin ID</label>
                  <div className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm font-mono">{editing ? editing.adminId : genId('ADM-')}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter admin name" value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter school name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter principal name" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Email <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="admin@school.com" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} placeholder="Min 6 chars" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">{showPw ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input type="text" placeholder="Contact number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription Plan</label>
                  <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    {['No Plan', 'Basic', 'Standard', 'Premium'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={form.active ? 'Active' : 'Inactive'} onChange={e => setForm({ ...form, active: e.target.value === 'Active' })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created By</label>
                  <input type="text" placeholder="Who created this" value={form.createdBy} onChange={e => setForm({ ...form, createdBy: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created At</label>
                  <input type="text" placeholder="DD-MM-YYYY" value={form.createdAt} onChange={e => setForm({ ...form, createdAt: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea rows="2" placeholder="School address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50">{loading ? 'Creating...' : editing ? 'Update School' : 'Create School'}</button>
                <button type="button" onClick={cancelForm} className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition">Cancel</button>
              </div>
              {!editing && (
                <p className="text-xs text-gray-400 mt-2">* A school admin account will be automatically created with the email and password provided.</p>
              )}
            </form>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">School ID</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Admin ID</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Principal</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {schools.map((s, idx) => (
                  <tr key={s.id} className="group transition-all duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:shadow-sm hover:scale-[1.002] cursor-default" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{s.schoolId}</td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{s.adminId}</td>
                    <td className="px-4 py-3.5 text-gray-900 dark:text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">{s.principal}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">{s.adminEmail}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">{s.phone}</td>
                    <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${s.plan === 'Premium' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:text-yellow-400' : s.plan === 'Standard' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-400' : s.plan === 'Basic' ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>{s.plan}</span></td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleStatus(s.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md hover:scale-105 ${s.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/40' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40'}`}>{s.active ? 'Active' : 'Inactive'}</button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewing(s)} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-800/50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150">View</button>
                        <button onClick={() => startEdit(s)} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-800/50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-800/50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150">Delete</button>
                      </div>
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
                <p className="text-gray-500 dark:text-gray-400">School ID: <span className="text-gray-900 dark:text-white">{viewing.schoolId}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Admin ID: <span className="text-gray-900 dark:text-white">{viewing.adminId}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Principal: <span className="text-gray-900 dark:text-white">{viewing.principal}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Email: <span className="text-gray-900 dark:text-white">{viewing.adminEmail}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Phone: <span className="text-gray-900 dark:text-white">{viewing.phone}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Plan: <span className="text-gray-900 dark:text-white">{viewing.plan}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Status: <span className={`${viewing.active ? 'text-green-600' : 'text-red-600'}`}>{viewing.active ? 'Active' : 'Inactive'}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Address: <span className="text-gray-900 dark:text-white">{viewing.address || '—'}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Created By: <span className="text-gray-900 dark:text-white">{viewing.createdBy}</span></p>
                <p className="text-gray-500 dark:text-gray-400">Created At: <span className="text-gray-900 dark:text-white">{viewing.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || viewing.createdAt || '—'}</span></p>
              </div>
              <button onClick={() => setViewing(null)} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
