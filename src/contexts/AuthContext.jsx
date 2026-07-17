import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  onAuthChange,
  loginWithEmail,
  loginWithIdentifier,
  registerSuperAdmin,
  signOutUser,
  resetUserPassword,
  getUserProfile,
  updateUserProfile,
} from '../services/authService'

const normalizeRole = (role) => {
  if (!role) return 'school_admin'
  return role.toLowerCase().replace(/\s+/g, '_')
}

const roleNames = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  principal: 'Principal',
  vice_principal: 'Vice Principal',
  admin_officer: 'Admin Officer',
  accountant: 'Accountant',
  teacher: 'Teacher',
  class_teacher: 'Class Teacher',
  librarian: 'Librarian',
  receptionist: 'Receptionist',
  student: 'Student',
  parent: 'Parent',
  transport: 'Transport Manager',
  hostel_warden: 'Hostel Warden',
}

const roleIcons = {
  super_admin: '🛡️',
  school_admin: '🏫',
  principal: '👔',
  vice_principal: '👔',
  admin_officer: '📋',
  accountant: '💰',
  teacher: '👨‍🏫',
  class_teacher: '👩‍🏫',
  librarian: '📚',
  receptionist: '📞',
  student: '🎓',
  parent: '👨‍👩‍👧‍👦',
  transport: '🚌',
  hostel_warden: '🏠',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setLoading(true)
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          let profile = await getUserProfile(firebaseUser.uid)
          if (profile) {
            profile = { ...profile, role: normalizeRole(profile.role) }
          }
          setUserProfile(profile)
        } catch (err) {
          console.error('Failed to load profile:', err)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const profile = await getUserProfile(user.uid)
    setUserProfile(profile)
  }, [user])

  const signIn = useCallback(async (email, password) => {
    setError(null)
    try {
      const fbUser = await loginWithEmail(email, password)
      let profile = await getUserProfile(fbUser.uid)
      if (profile) profile = { ...profile, role: normalizeRole(profile.role) }
      setUserProfile(profile)
      return { user: fbUser, userProfile: profile }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const signUp = useCallback(async (email, password) => {
    setError(null)
    try {
      const fbUser = await registerSuperAdmin(email, password)
      const profile = await getUserProfile(fbUser.uid)
      setUserProfile(profile)
      return { user: fbUser }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const signOut = useCallback(async () => {
    await signOutUser()
    setUser(null)
    setUserProfile(null)
    navigate('/auth/login')
  }, [navigate])

  const resetPassword = useCallback(async (email) => {
    await resetUserPassword(email)
  }, [])

  const role = userProfile?.role || 'school_admin'

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile,
      isAuthenticated: !!user,
      role,
      isApproved: userProfile?.isApproved ?? false,
      roleNames,
      roleIcons
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
