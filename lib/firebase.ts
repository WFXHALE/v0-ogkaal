"use client"

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAnalytics, type Analytics }                       from "firebase/analytics"
import { getMessaging, type Messaging }                       from "firebase/messaging"
import { getAuth, GoogleAuthProvider, type Auth }             from "firebase/auth"

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
