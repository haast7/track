import { useState, useEffect } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Salvar usuário no Firestore: /users/{userId}
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      createdAt: serverTimestamp(),
      plan: 'free',
    })

    return userCredential
  }

  const logout = async () => {
    await signOut(auth)
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
  }
}
