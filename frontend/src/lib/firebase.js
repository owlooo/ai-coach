import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD21yu4QQGqsNCivB5AWAOk7ubaTHaTCzo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vive-coding-3bd24.firebaseapp.com",
  databaseURL: "https://vive-coding-3bd24-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vive-coding-3bd24",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vive-coding-3bd24.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "731224315620",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:731224315620:web:929b5d86eea44d04e0fef1",
  measurementId: "G-VEVPWZ9HBQ"
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)

// Firebase 서비스들 export
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)
export default app
