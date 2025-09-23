import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyD21yu4QQGqsNCivB5AWAOk7ubaTHaTCzo",
  authDomain: "vive-coding-3bd24.firebaseapp.com",
  databaseURL: "https://vive-coding-3bd24-default-rtdb.firebaseio.com",
  projectId: "vive-coding-3bd24",
  storageBucket: "vive-coding-3bd24.firebasestorage.app",
  messagingSenderId: "731224315620",
  appId: "1:731224315620:web:929b5d86eea44d04e0fef1",
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