import { useState, useEffect } from 'react'
import { db, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, query, where } from '../../services/firebase'

export default function Users() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', status: 'Active' })

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'super_admin'))
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      setUsers(list)
    })
    return unsub
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    try {
      if (editing) {
        await updateDoc(doc(db, 'users', editing.id), { name: form.name, email: form.email, isActive: form.status === 'Active' })
        setEditing(null)
      } else {
        await setDoc(doc(collection(db, 'users')), { name: form.name, email: form.email, role: 'super_admin', isActive: form.status === 'Active', isApproved: true, createdAt: new Date().toISOString() })
      }
    } catch (err) {
      console.error('User save error:', err)
    }
    setForm({ name: '', email: '', status: 'Active' })
    setShowForm(false)
  }

  const startEdit = (user) => {
    setEditing(user)
    setForm({ name: user.name, email: user.email, status: user.isActive ? 'Active' : 'Inactive' })
    setShowForm(true)
  }

  const deleteUser = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', id))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Super Admins</h1>
          <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', email: '', status: 'Active' }) }} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">{showForm ? 'Cancel' : '+ Add Admin'}</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input type="text" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">{editing ? 'Update' : 'Save'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm({ name: '', email: '', status: 'Active' }) }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition">Cancel</button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => startEdit(u)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">Edit</button>
                        <button onClick={() => deleteUser(u.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No super admins found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
