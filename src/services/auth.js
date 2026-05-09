import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'

export const signIn = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const signOut = async () => {
  return firebaseSignOut(auth)
}
