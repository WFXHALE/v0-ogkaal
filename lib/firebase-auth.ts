"use client"

/**
 * Community authentication — backed entirely by Supabase (no Firebase SDK).
 *
 * Firebase was causing "auth/api-key-not-valid" errors because the Firebase
 * project API key was invalid or the preview domain was not in the authorized
 * domains list. All auth is now handled directly through Supabase, which is
 * already connected and working.
 *
 * Supports:
 *  - Email / Password (sign-up and sign-in)
 *  - Google OAuth via Supabase (redirect-based, works on all domains)
 *
 * After auth the user is upserted into `community_users` and a session is
 * persisted to localStorage via setSession().
 */

import { createClient } from "@/lib/supabase/client"
import { avatarUrl, setSession } from "@/lib/community-utils"
import type { CommunityUser, TraderLevel } from "@/lib/community-utils"

// ── types ─────────────────────────────────────────────────────────────────────

export interface FirebaseAuthResult {
  ok: boolean
  user?: CommunityUser
  error?: string
  isNew?: boolean
}

// ── helpers ───────────────────────────────────────────────────────────────────

function rowToUser(row: Record<string, unknown>): CommunityUser {
  return {
    id:        row.id        as string,
    fullName:  row.full_name as string,
    email:     row.email     as string,
    phone:     (row.phone    as string) || "",
    level:     row.level     as TraderLevel,
    bio:       row.bio       as string | undefined,
    avatar:    (row.avatar   as string) || avatarUrl(row.full_name as string, row.level as TraderLevel),
    createdAt: row.created_at as string,
    isAdmin:   row.is_admin  as boolean | undefined,
  }
}

/** Hash a password using SHA-256 so we never store plaintext. */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(password + "og_community_salt_v1")
  const buffer  = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

// ── Public API — kept identical so auth-modal.tsx needs zero changes ──────────

/**
 * Sign up with email + password.
 * The `community_users` table has no dedicated password_hash column, so we
 * store the SHA-256 hash in the `bio` field prefixed with "__pw:" — existing
 * user bios that don't start with this prefix are treated as passwordless
 * (legacy accounts) or Google accounts ("__google:" prefix).
 */
export async function firebaseSignUp(opts: {
  email: string
  password: string
  fullName: string
  phone: string
  level: TraderLevel
}): Promise<FirebaseAuthResult> {
  try {
    const sb = createClient()

    // Check for duplicate email
    const { data: existing } = await sb
      .from("community_users")
      .select("id, email")
      .eq("email", opts.email.trim().toLowerCase())
      .limit(1)

    if (existing && existing.length > 0) {
      return { ok: false, error: "An account with this email already exists. Try signing in." }
    }

    if (opts.password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." }
    }

    const passwordHash = await hashPassword(opts.password)
    const id           = Date.now().toString() + Math.random().toString(36).slice(2, 7)
    const avatar       = avatarUrl(opts.fullName, opts.level)
    const now          = new Date().toISOString()

    const newUser: CommunityUser = {
      id, fullName: opts.fullName, email: opts.email.toLowerCase(),
      phone: opts.phone, level: opts.level, avatar, createdAt: now,
    }

    const { error } = await sb.from("community_users").insert({
      id,
      full_name:  opts.fullName,
      email:      opts.email.trim().toLowerCase(),
      phone:      opts.phone,
      level:      opts.level,
      avatar,
      is_admin:   false,
      created_at: now,
      // Store password hash in bio field with a prefix so it's machine-readable
      bio: `__pw:${passwordHash}`,
    })

    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        return { ok: false, error: "An account with this email already exists. Try signing in." }
      }
      return { ok: false, error: "Sign up failed. Please try again." }
    }

    setSession(newUser)
    return { ok: true, user: newUser, isNew: true }
  } catch (err) {
    console.error("[firebaseSignUp] error:", err)
    return { ok: false, error: "Sign up failed. Please check your connection and try again." }
  }
}

/**
 * Sign in with email + password.
 */
export async function firebaseSignIn(opts: {
  email: string
  password: string
}): Promise<FirebaseAuthResult> {
  try {
    const sb = createClient()
    const { data, error } = await sb
      .from("community_users")
      .select("*")
      .eq("email", opts.email.trim().toLowerCase())
      .limit(1)

    if (error || !data || data.length === 0) {
      return { ok: false, error: "No account found with that email. Please sign up first." }
    }

    const row  = data[0] as Record<string, unknown>
    const bio  = (row.bio as string) || ""

    if (bio.startsWith("__google:")) {
      // This account was created via Google OAuth — direct to Google sign-in
      return { ok: false, error: "This account uses Google sign-in. Please click 'Sign in with Google'." }
    }

    if (bio.startsWith("__pw:")) {
      // Verify password
      const storedHash = bio.slice(5)
      const inputHash  = await hashPassword(opts.password)
      if (storedHash !== inputHash) {
        return { ok: false, error: "Incorrect password. Please try again." }
      }
    } else if (!bio) {
      // Legacy account with no password set — allow sign-in (community was originally passwordless)
      // This handles accounts that existed before passwords were added
    } else {
      // Unknown bio prefix — can't verify
      return { ok: false, error: "Unable to sign in. Please use Google sign-in or contact support." }
    }

    const user = rowToUser(row)
    setSession(user)
    return { ok: true, user }
  } catch (err) {
    console.error("[firebaseSignIn] error:", err)
    return { ok: false, error: "Sign in failed. Please check your connection and try again." }
  }
}

/**
 * Sign in / sign up with Google via Supabase OAuth.
 * Uses a redirect flow (no popup) so it works on any domain without
 * configuring authorized domains in Firebase.
 */
export async function firebaseSignInWithGoogle(): Promise<FirebaseAuthResult> {
  try {
    const sb = createClient()
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    })
    if (error) {
      return { ok: false, error: "Google sign-in is currently unavailable. Please use email/password." }
    }
    // OAuth redirect is in progress — the page will navigate away.
    // Return a non-error result so the UI doesn't show an error during redirect.
    return { ok: true }
  } catch {
    return { ok: false, error: "Google sign-in is currently unavailable. Please use email/password." }
  }
}
