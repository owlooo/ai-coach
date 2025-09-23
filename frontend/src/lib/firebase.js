// Firebase CDN을 사용하여 로드
const { initializeApp, getAuth, getFirestore, getStorage } = window.firebase || {}

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

// Firebase 초기화 (CDN이 로드된 경우에만)
let app = null
let auth = null
let db = null
let storage = null

if (initializeApp && getAuth && getFirestore && getStorage) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

// Firebase 서비스들 export
export { auth, db, storage }
export default app
