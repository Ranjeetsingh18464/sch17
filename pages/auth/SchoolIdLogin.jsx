import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginWithIdentifier, getUserProfile } from '../../src/services/authService'
import toast from 'react-hot-toast'

export default function SchoolIdLogin() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier || !password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    try {
      const user = await loginWithIdentifier(identifier, password)
      const profile = await getUserProfile(user.uid)
      const role = profile?.role?.toLowerCase().replace(/\s+/g, '_') || 'school_admin'
      toast.success('Login successful!')
      navigate(`/dashboard/${role}`, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Invalid ID or password')
    } finally { setLoading(false) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">School ID Login</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in using your ID, teacher ID, student ID, or parent ID</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email or ID</label>
          <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="input-field" placeholder="e.g. ADM-001, TCH-001, you@school.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500"><Link to="/auth/login" className="text-primary-600 font-medium">Back to email login</Link></p>
    </motion.div>
  )
}
