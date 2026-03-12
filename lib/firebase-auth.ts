"use client"

/**
 * Unified Firebase authentication helpers for community + profile auth.
 *
 * Supports:
 *  - Email / Password (sign-up and sign-in)
 *  - Google Sign-In (popup)
 *
 * After a successful Firebase auth, the user is upserted into the Supabase
 * `community_users` table and a CommunityUser session is persisted to
 * localStorage.  This makes the same account work on Community, Profile, and
 * anywhere else that reads the community session.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { createClient } from "@/lib/supabase/client"
import { avatarUrl, setSession } from "@/lib/community-utils"
import type { CommunityUser, TraderLevel } from "@/lib/community-utils"

// ── error helpers ─────────────────────────────────────────────────────────────

/** Map raw Firebase error codes to friendly messages. */
function friendlyFirebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use":    "An account with this email already exists. Try signing in.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with that email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/invalid-credential":      "Incorrect email or password.",
    "auth/too-many-requests":       "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed":  "Network error. Please check your connection.",
    "auth/popup-closed-by-user":    "Sign-in cancelled.",
    "auth/cancelled-popup-request": "Sign-in cancelled.",
    "auth/unauthorized-domain":     "Login temporarily unavailable. Please contact support if this persists.",
    "auth/api-key-not-valid":       "Login temporarily unavailable, please try again.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
                                    "Login temporarily unavailable, please try again.",
  }
  return map[code] ?? "Login temporarily unavailable, please try again."
}

function parseFirebaseError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return friendlyFirebaseError((err as { code: string }).code)
  }
  return "Login temporarily unavailable, please try again."
}

// ── Supabase sync ─────────────────────────────────────────────────────────────

async function syncToSupabase(opts: {
  firebaseUid: string
  email: string
  fullName: string
  phone: string
  level: TraderLevel
  photoUrl?: string
}): Promise<CommunityUser> {
  const sb = createClient()

  // Look up by email first
  const { data: existing } = await sb
    .from("community_users")
    .select("*")
    .eq("email", opts.email.toLowerCase())
    .limit(1)

  if (existing && existing.length > 0) {
    const row = existing[0] as Record<string, unknown>
    const user: CommunityUser = {
      id:        row.id        as string,
      fullName:  row.full_name as string,
      email:     row.email     as string,
      phone:     row.phone     as string,
      level:     row.level     as TraderLevel,
      bio:       row.bio       as string | undefined,
      avatar:    (row.avatar as string) || avatarUrl(row.full_name as string, row.level as TraderLevel),
      createdAt: row.created_at as string,
      isAdmin:   row.is_admin  as boolean | undefined,
    }
    setSession(user)
    return user
  }

  // Create new community user row
  const id       = Date.now().toString() + Math.random().toString(36).slice(2, 7)
  const avatar   = opts.photoUrl || avatarUrl(opts.fullName, opts.level)
  const now      = new Date().toISOString()
  const newUser: CommunityUser = {
    id,
    fullName:  opts.fullName,
    email:     opts.email.toLowerCase(),
    phone:     opts.phone,
    level:     opts.level,
    avatar,
    createdAt: now,
  }

  const { error: insertErr } = await sb.from("community_users").insert({
    id,
    full_name:  opts.fullName,
    email:      opts.email.toLowerCase(),
    phone:      opts.phone,
    level:      opts.level,
    avatar,
    is_admin:   false,
    created_at: now,
  })
  if (insertErr) {
    console.error("User creation error:", insertErr)
    throw new Error(insertErr.message)
  }

  setSession(newUser)
  return newUser
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface FirebaseAuthResult {
  ok: boolean
  user?: CommunityUser
  error?: string
  isNew?: boolean
}

/**
 * Sign up with email + password.
 * Creates a Firebase account, then upserts a Supabase community_users row.
 */
export async function firebaseSignUp(opts: {
  email: string
  password: string
  fullName: string
  phone: string
  level: TraderLevel
}): Promise<FirebaseAuthResult> {
  if (!auth) return { ok: false, error: "Authentication is not available. Please try again later." }
  try {
    let cred: UserCredential
    try {
      cred = await createUserWithEmailAndPassword(auth, opts.email, opts.password)
    } catch (err) {
      return { ok: false, error: parseFirebaseError(err) }
    }

    const user = await syncToSupabase({
      firebaseUid: cred.user.uid,
      email:       opts.email,
      fullName:    opts.fullName,
      phone:       opts.phone,
      level:       opts.level,
    })
    return { ok: true, user, isNew: true }
  } catch {
    return { ok: false, error: "Login temporarily unavailable, please try again." }
  }
}

/**
 * Sign in with email + password.
 */
export async function firebaseSignIn(opts: {
  email: string
  password: string
}): Promise<FirebaseAuthResult> {
  if (!auth) return { ok: false, error: "Authentication is not available. Please try again later." }
  try {
    let cred: UserCredential
    try {
      cred = await signInWithEmailAndPassword(auth, opts.email, opts.password)
    } catch (err) {
      return { ok: false, error: parseFirebaseError(err) }
    }

    // Pull community user from Supabase (already exists since they signed up before)
    const sb = createClient()
    const { data } = await sb
      .from("community_users")
      .select("*")
      .eq("email", opts.email.toLowerCase())
      .limit(1)

    if (data && data.length > 0) {
      const row  = data[0] as Record<string, unknown>
      const user: CommunityUser = {
        id:        row.id        as string,
        fullName:  row.full_name as string,
        email:     row.email     as string,
        phone:     row.phone     as string,
        level:     row.level     as TraderLevel,
        bio:       row.bio       as string | undefined,
        avatar:    row.avatar    as string,
        createdAt: row.created_at as string,
        isAdmin:   row.is_admin  as boolean | undefined,
      }
      setSession(user)
      return { ok: true, user }
    }

    // Firebase account exists but no Supabase row — create one
    const user = await syncToSupabase({
      firebaseUid: cred.user.uid,
      email:       opts.email,
      fullName:    cred.user.displayName ?? opts.email.split("@")[0],
      phone:       "",
      level:       "Beginner",
    })
    return { ok: true, user }
  } catch {
    return { ok: false, error: "Login temporarily unavailable, please try again." }
  }
}

/**
 * Sign in / sign up with Google popup.
 */
export async function firebaseSignInWithGoogle(): Promise<FirebaseAuthResult> {
  if (!auth) return { ok: false, error: "Google sign-in is not available on this domain. Please use email/password instead." }
  try {
    const provider = new GoogleAuthProvider()
    provider.addScope("email")
    provider.addScope("profile")
    provider.setCustomParameters({ prompt: "select_account" })

    let cred: UserCredential
    try {
      cred = await signInWithPopup(auth, provider)
    } catch (err) {
      return { ok: false, error: parseFirebaseError(err) }
    }

    const gUser  = cred.user
    const email  = gUser.email?.toLowerCase() ?? ""
    if (!email) return { ok: false, error: "Google account has no email address." }

    const user = await syncToSupabase({
      firebaseUid: gUser.uid,
      email,
      fullName:    gUser.displayName ?? email.split("@")[0],
      phone:       "",
      level:       "Beginner",
      photoUrl:    gUser.photoURL ?? undefined,
    })
    return { ok: true, user }
  } catch {
    return { ok: false, error: "Login temporarily unavailable, please try again." }
  }
}
