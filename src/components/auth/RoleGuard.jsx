import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { canView } from '../../config/permissions'

export default function RoleGuard({ module, children, fallback }) {
  const { role, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  if (!role || !canView(role, module)) {
    if (fallback) return fallback
    return <Navigate to={`/dashboard/${role || 'school_admin'}`} replace />
  }

  return children
}
