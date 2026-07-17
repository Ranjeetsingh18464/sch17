import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  serverTimestamp,
} from './firebase'

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

export const registerSuperAdmin = async (email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const profile = {
    uid: cred.user.uid,
    email,
    name: 'Super Admin',
    role: 'super_admin',
    isApproved: true,
    isActive: true,
    xp: 0,
    level: 1,
    streak: 0,
    schoolId: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'users', cred.user.uid), profile, { merge: true })
  return cred.user
}

export const loginWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export const loginWithIdentifier = async (identifier, password) => {
  const usersRef = collection(db, 'users')
  const q = query(usersRef,
    where('isActive', '==', true),
    where('email', '==', identifier)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    const cred = await signInWithEmailAndPassword(auth, identifier, password)
    return cred.user
  }
  const q2 = query(usersRef,
    where('isActive', '==', true),
    where('adminId', '==', identifier)
  )
  const snap2 = await getDocs(q2)
  if (!snap2.empty) {
    const userData = snap2.docs[0].data()
    const cred = await signInWithEmailAndPassword(auth, userData.email, password)
    return cred.user
  }
  const q3 = query(usersRef,
    where('isActive', '==', true),
    where('teacherId', '==', identifier)
  )
  const snap3 = await getDocs(q3)
  if (!snap3.empty) {
    const userData = snap3.docs[0].data()
    const cred = await signInWithEmailAndPassword(auth, userData.email, password)
    return cred.user
  }
  const q4 = query(usersRef,
    where('isActive', '==', true),
    where('studentId', '==', identifier)
  )
  const snap4 = await getDocs(q4)
  if (!snap4.empty) {
    const userData = snap4.docs[0].data()
    const cred = await signInWithEmailAndPassword(auth, userData.email, password)
    return cred.user
  }
  const q5 = query(usersRef,
    where('isActive', '==', true),
    where('parentId', '==', identifier)
  )
  const snap5 = await getDocs(q5)
  if (!snap5.empty) {
    const userData = snap5.docs[0].data()
    const cred = await signInWithEmailAndPassword(auth, userData.email, password)
    return cred.user
  }
  throw new Error('No account found with this ID or email')
}

export const signOutUser = async () => {
  await fbSignOut(auth)
}

export const resetUserPassword = async (email) => {
  await sendPasswordResetEmail(auth, email)
}

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) return { uid: snap.id, ...snap.data() }
  return null
}

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDVvuBUWqEHzfFvXWWmr-QttUGgIjpKWgY'

export const createUserAccount = async ({ email, password, name, role, schoolId, phone, studentId, teacherId, parentId, adminId, grade, section, address, children }) => {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = data.error?.message || 'Failed to create auth user'
    if (data.error?.message === 'EMAIL_EXISTS') throw new Error('An account with this email already exists')
    throw new Error(msg)
  }

  const profile = {
    uid: data.localId,
    email,
    name,
    phone: phone || '',
    role,
    schoolId: schoolId || '',
    isApproved: true,
    isActive: true,
    xp: 0,
    level: 1,
    streak: 0,
    notificationPreferences: { email: true, push: true, sms: false },
    privacySettings: { showProfile: true, showAchievements: true, allowParentAccess: true },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (studentId) profile.studentId = studentId
  if (teacherId) profile.teacherId = teacherId
  if (parentId) profile.parentId = parentId
  if (adminId) profile.adminId = adminId
  if (grade) profile.grade = grade
  if (section) profile.section = section
  if (address) profile.address = address
  if (children) profile.children = children

  await setDoc(doc(db, 'users', data.localId), profile, { merge: true })

  return { uid: data.localId, email: data.email }
}

export const updateUserProfile = async (uid, data) => {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
