"use client"
import { createClient } from "@/lib/supabase/client"
import { setSession } from "@/lib/community-utils"
import type { CommunityUser, TraderLevel } from "@/lib/community-utils"

export type P2PAuthResult = { ok: true; user?: CommunityUser; confirmationRequired?: boolean } | { ok: false; error: string }

async function loadProfile(): Promise<CommunityUser> {
  const response = await fetch("/api/p2p/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}), cache: "no-store" })
  const payload = await response.json()
  if (!response.ok || !payload.ok || !payload.user) throw new Error(payload.error || "Could not load your account profile.")
  setSession(payload.user as CommunityUser)
  return payload.user as CommunityUser
}
export async function getP2PAccount(): Promise<CommunityUser | null> {
  try {
    const sb = createClient()
    const { data: { session } } = await sb.auth.getSession()
    if (!session) return null
    const response = await fetch("/api/p2p/account", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !payload.ok || !payload.user) return null
    setSession(payload.user as CommunityUser)
    return payload.user as CommunityUser
  } catch { return null }
}
export async function p2pSignUp(input: { fullName: string; email: string; password: string; phone: string; level: TraderLevel }): Promise<P2PAuthResult> {
  try {
    const sb = createClient()
    const { data, error } = await sb.auth.signUp({
      email: input.email.trim().toLowerCase(), password: input.password,
      options: { data: { full_name: input.fullName.trim(), phone: input.phone.trim(), level: input.level }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    })
    if (error) return { ok: false, error: error.message }
    if (!data.session) return { ok: true, confirmationRequired: true }
    return { ok: true, user: await loadProfile() }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Account creation failed." } }
}
export async function p2pSignIn(input: { email: string; password: string }): Promise<P2PAuthResult> {
  try {
    const sb = createClient()
    const { error } = await sb.auth.signInWithPassword({ email: input.email.trim().toLowerCase(), password: input.password })
    if (error) return { ok: false, error: error.message }
    return { ok: true, user: await loadProfile() }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Sign in failed." } }
}
export async function p2pSignInWithGoogle(): Promise<P2PAuthResult> {
  try {
    const sb = createClient()
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/`, queryParams: { prompt: "select_account" } } })
    return error ? { ok: false, error: error.message } : { ok: true }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Google sign-in could not start." } }
}
