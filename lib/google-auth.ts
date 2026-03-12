"use client"

import { GoogleAuthProvider, signInWithPopup, signOut, getAuth } from "firebase/auth"
import { app, auth } from "./firebase"
import { createClient } from "./supabase/client"
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
    const provider = new GoogleAuthProvider()
    provider.addScope("email")
    provider.addScope("profile")
    provider.setCustomParameters({ prompt: "select_account" })

    const result  = await signInWithPopup(auth, provider)
    const gUser   = result.user
    const email   = gUser.email?.toLowerCase() ?? ""
    const name    = gUser.displayName ?? email.split("@")[0]

    if (!email) return { success: false, error: "Google account has no email." }

    const supabase = createClient()

    // Try to find existing dashboard_users row by email
    const { data: existing } = await supabase
      .from("dashboard_users")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    let row = existing
    let isNew = false

    if (!row) {
      // Create a new user row — no password (google_uid stored instead)
      isNew = true
      const userId = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 20) +
        "_" + Math.random().toString(36).slice(2, 6)

      const numericUid = Math.floor(10000000 + Math.random() * 90000000)

      const { data: inserted, error: insErr } = await supabase
        .from("dashboard_users")
        .insert({
          user_id:    userId,
          email,
          full_name:  name,
          google_uid: gUser.uid,
          numeric_uid: numericUid,
          password_hash: "", // no password for Google users
          is_verified: true,
          kyc_status:  "none",
        })
        .select("*")
        .single()

      if (insErr || !inserted) {
        return { success: false, error: "Failed to create account. Please try again." }
      }
      row = inserted
    } else if (!row.google_uid) {
      // Link existing account to Google
      await supabase
        .from("dashboard_users")
        .update({ google_uid: gUser.uid })
        .eq("id", row.id)
    }

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
