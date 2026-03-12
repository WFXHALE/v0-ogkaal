import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAnalytics, type Analytics }                       from "firebase/analytics"
import { getMessaging, type Messaging }                       from "firebase/messaging"
import { getAuth, GoogleAuthProvider, type Auth }             from "firebase/auth"

// Helper: Next.js inlines missing NEXT_PUBLIC_ vars as the literal string "undefined"
// at build time. We must filter those out and fall back to the hardcoded values.
function env(key: string, fallback: string): string {
  const val = process.env[key]
  return !val || val === "undefined" ? fallback : val
}

// Firebase web config — NEXT_PUBLIC_ values are safe to ship to the browser.
// Hardcoded fallbacks ensure auth works even when env vars aren't set in Vercel.
const firebaseConfig = {
  apiKey:            env("NEXT_PUBLIC_FIREBASE_API_KEY",             "AIzaSyBwQEOzxjsR_eOGpaFhCKvtyWw8eSmy5y4"),
  authDomain:        env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",         "kaalsite.firebaseapp.com"),
  projectId:         env("NEXT_PUBLIC_FIREBASE_PROJECT_ID",          "kaalsite"),
  storageBucket:     env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",      "kaalsite.firebasestorage.app"),
  messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "1075312749724"),
  appId:             env("NEXT_PUBLIC_FIREBASE_APP_ID",              "1:1075312749724:web:cd7c844e891648f22e9159"),
  measurementId:     env("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",      "G-JS503CQ6RZ"),
}

// Singleton — reuse existing app across HMR re-evaluations
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// auth is browser-only — getAuth throws on unauthorized domains during server
// rendering and during the session-restore ping. Wrap so it never crashes the page.
let _auth: Auth | null = null
try { _auth = getAuth(app) } catch { _auth = null }
export const auth: Auth = _auth as Auth

export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope("email")
googleProvider.addScope("profile")
googleProvider.setCustomParameters({ prompt: "select_account" })

// Analytics and Messaging are browser-only
let _analytics: Analytics | null = null
let _messaging: Messaging | null = null

export function getFirebaseAnalytics(): Analytics | null {
  if (typeof window === "undefined") return null
  if (!_analytics) _analytics = getAnalytics(app)
  return _analytics
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null
  if (!("Notification" in window))  return null
  if (!_messaging) _messaging = getMessaging(app)
  return _messaging
}
