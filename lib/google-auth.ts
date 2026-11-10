"use client"

import { GoogleAuthProvider, signInWithPopup, signOut, getAuth } from "firebase/auth"
import { app } from "./firebase"
import { Analytics, identifyUser } from "./analytics"
import type { DashboardSession } from "./dash-auth"

const SESSION_KEY = "og_dashboard_session"

function setSession(session: DashboardSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

export async function signInWithGoogle(): Promise<
  | { success: true; user: DashboardSession; isNew: boolean }
  | { success: false; error: string }
> {
  try {
    // Initialise Auth in the browser at click time. A module-level Auth instance
    // may be unavailable if the Firebase module was evaluated during SSR.
    const authInstance = getAuth(app)
    const provider = new GoogleAuthProvider()
    provider.addScope("email")
    provider.addScope("profile")
    provider.setCustomParameters({ prompt: "select_account" })

    const result  = await signInWithPopup(authInstance, provider)
    const gUser   = result.user
    const email   = gUser.email?.toLowerCase() ?? ""
    const name    = gUser.displayName ?? email.split("@")[0]

    if (!email) return { success: false, error: "Google account has no email." }

    // The custom dashboard account is stored in PostgreSQL, not Supabase Auth.
    // Verify Firebase identity and create/load the dashboard row server-side.
    const idToken = await gUser.getIdToken()
    const response = await fetch("/api/dashboard/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
    const payload = await response.json()
    if (!response.ok || !payload?.data) {
      console.error("[google-auth] Dashboard account API failed:", payload?.error)
      return { success: false, error: payload?.error ?? "Failed to create account. Please try again." }
    }
    const row = payload.data
    const isNew = Boolean(payload.isNew)

    const session: DashboardSession = {
      id:              String(row.id),
      userId:          String(row.user_id),
      email:           String(row.email),
      fullName:        String(row.full_name),
      createdAt:       String(row.created_at),
      numericUid:      row.numeric_uid   ? Number(row.numeric_uid)   : undefined,
      tradingLevel:    row.trading_level ? String(row.trading_level) : undefined,
      marketType:      row.market_type   ? String(row.market_type)   : undefined,
      tradingType:     row.trading_type  ? String(row.trading_type)  : undefined,
      yearsExperience: row.years_experience ? String(row.years_experience) : undefined,
      isVerified:      Boolean(row.is_verified),
      kycStatus:       (row.kyc_status as DashboardSession["kycStatus"]) ?? "none",
      avatarUrl:       row.avatar_url    ? String(row.avatar_url)    : undefined,
      loggedInAt:      Date.now(),
    }

    setSession(session)
    identifyUser(session.id)
    if (isNew) Analytics.signUp("google")
    else Analytics.login("google")

    return { success: true, user: session, isNew }
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? ""
    const msg  = err instanceof Error ? err.message : ""
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" ||
        msg.includes("popup-closed-by-user") || msg.includes("cancelled")) {
      return { success: false, error: "Sign-in cancelled." }
    }
    if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
      return { success: false, error: "Google sign-in is not available on this domain. Please use email/password to sign in." }
    }
    if (code === "auth/api-key-not-valid" || msg.includes("api-key-not-valid")) {
      return { success: false, error: "Login temporarily unavailable, please try again." }
    }
    return { success: false, error: "Google sign-in failed. Please try again." }
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    await signOut(getAuth(app))
  } catch {}
}
