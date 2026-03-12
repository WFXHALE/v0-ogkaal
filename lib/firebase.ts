"use client"

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAnalytics, type Analytics }                       from "firebase/analytics"
import { getMessaging, type Messaging }                       from "firebase/messaging"
import { getAuth, GoogleAuthProvider, type Auth }             from "firebase/auth"

// Firebase web config — these NEXT_PUBLIC_ values are safe to ship to the browser.
// Fall back to hardcoded values so the app works even if env vars aren't set in the
// hosting environment (the root cause of the auth/api-key-not-valid error).
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "AIzaSyBwQEOzxjsR_eOGpaFhCKvtyWw8eSmy5y4",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "kaalsite.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "kaalsite",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "kaalsite.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "1075312749724",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "1:1075312749724:web:cd7c844e891648f22e9159",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     ?? "G-JS503CQ6RZ",
}

// Singleton — reuse existing app across HMR re-evaluations
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth: Auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

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
