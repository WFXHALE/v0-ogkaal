// lib/dashboard-auth.ts
// Dedicated authentication for the Client Dashboard.
// Completely separate from the Community auth system (community-utils.ts).

import { createClient } from "@/lib/supabase/client"

// ── Constants ──────────────────────────────────────────────────────────────────

const SESSION_KEY     = "og_dashboard_session"
const TIMEOUT_MS      = 5 * 60 * 1000   // 5 minutes inactivity
const LAST_ACTIVE_KEY = "og_dashboard_last_active"
const BACKUP_CODE_KEY = "og_dashboard_backup_code"

// ── Backup code plain-text storage ────────────────────────────────────────────
// Stored in localStorage after registration so the user can reveal it later.

export function storeBackupCode(code: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(BACKUP_CODE_KEY, code)
}

export function getStoredBackupCode(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(BACKUP_CODE_KEY)
}

export function clearStoredBackupCode(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(BACKUP_CODE_KEY)
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardUser {
  id: string
  userId: string       // user-chosen login ID
  email: string
  fullName: string
  createdAt: string
}

export interface DashboardSession extends DashboardUser {
  loggedInAt: number
  backupCode?: string   // plain-text, loaded from DB on login
}

// ── Password hashing (SHA-256 via Web Crypto API) ─────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "og_dashboard_salt_v1")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

// ── Backup code generation ─────────────────────────────────────────────────────

export function generateBackupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 16; i++) {
    if (i === 4 || i === 8 || i === 12) code += "-"
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code  // format: XXXX-XXXX-XXXX-XXXX
}

// ── Session management ────────────────────────────────────────────────────────

export function getSession(): DashboardSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DashboardSession
  } catch { return null }
}

export function setSession(session: DashboardSession | null): void {
  if (typeof window === "undefined") return
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    touchActivity()
  } else {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(LAST_ACTIVE_KEY)
  }
}

export function touchActivity(): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()))
}

export function isSessionTimedOut(): boolean {
  if (typeof window === "undefined") return false
  const session = getSession()
  if (!session) return false
  const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY) ?? 0)
  return Date.now() - lastActive > TIMEOUT_MS
}

export function logout(): void {
  setSession(null)
}

// ── Auth operations (Supabase-backed) ────────────────────────────────────────

export async function login(
  userId: string,
  password: string
): Promise<{ success: true; user: DashboardUser } | { success: false; error: string }> {
  const supabase = createClient()
  const hash = await hashPassword(password)

  const { data, error } = await supabase
    .from("dashboard_users")
    .select("*")
    .eq("user_id", userId.trim())
    .single()

  if (error || !data) return { success: false, error: "Invalid User ID or password." }

  if (data.password_hash !== hash) {
    // Check backup code as fallback
    if (data.backup_code_hash && data.backup_code_hash === (await hashPassword(password))) {
      // valid backup code login
    } else {
      return { success: false, error: "Invalid User ID or password." }
    }
  }

  const user: DashboardUser = {
    id:        String(data.id),
    userId:    String(data.user_id),
    email:     String(data.email),
    fullName:  String(data.full_name),
    createdAt: String(data.created_at),
  }

  const session: DashboardSession = {
    ...user,
    loggedInAt: Date.now(),
    backupCode: data.backup_code ? String(data.backup_code) : undefined,
  }
  setSession(session)
  return { success: true, user }
}

export async function loginWithBackupCode(
  email: string,
  backupCode: string
): Promise<{ success: true; user: DashboardUser } | { success: false; error: string }> {
  const supabase = createClient()
  const hash = await hashPassword(backupCode.replace(/-/g, ""))

  const { data, error } = await supabase
    .from("dashboard_users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .single()

  if (error || !data) return { success: false, error: "No account found with that email." }
  if (data.backup_code_hash !== hash) return { success: false, error: "Invalid backup code." }

  const user: DashboardUser = {
    id:        String(data.id),
    userId:    String(data.user_id),
    email:     String(data.email),
    fullName:  String(data.full_name),
    createdAt: String(data.created_at),
  }

  const session: DashboardSession = {
    ...user,
    loggedInAt: Date.now(),
    backupCode: data.backup_code ? String(data.backup_code) : undefined,
  }
  setSession(session)
  return { success: true, user }
}

export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/dashboard/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error ?? "Failed to send reset email." }
    return { success: true }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("dashboard_password_resets")
    .select("*")
    .eq("token", token)
    .single()

  if (error || !data) return { success: false, error: "Invalid or expired reset link." }
  if (new Date(data.expires_at).getTime() < Date.now()) return { success: false, error: "Reset link has expired. Please request a new one." }

  const hash = await hashPassword(newPassword)
  const { error: updateErr } = await supabase
    .from("dashboard_users")
    .update({ password_hash: hash })
    .eq("email", data.email)

  if (updateErr) return { success: false, error: "Failed to update password. Please try again." }

  // Delete the used token
  await supabase.from("dashboard_password_resets").delete().eq("token", token)

  return { success: true }
}

// ── Fetch backup code from DB (auto-generates if missing) ─────────────────────

export async function fetchBackupCode(userId: string): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("dashboard_users")
    .select("backup_code")
    .eq("id", userId)
    .single()

  if (error || !data) return null

  // If backup code already exists, return it
  if (data.backup_code) return String(data.backup_code)

  // Auto-generate and save a new one if missing
  const newCode = generateBackupCode()
  await supabase
    .from("dashboard_users")
    .update({ backup_code: newCode })
    .eq("id", userId)

  return newCode
}

export async function registerDashboardUser(params: {
  userId: string
  email: string
  fullName: string
  password: string
}): Promise<{ success: true; user: DashboardUser; backupCode: string } | { success: false; error: string }> {
  const supabase = createClient()

  // Check if user_id already taken
  const { data: existing } = await supabase
    .from("dashboard_users")
    .select("id")
    .eq("user_id", params.userId.trim())
    .single()

  if (existing) return { success: false, error: "User ID already taken. Please choose another." }

  const passwordHash = await hashPassword(params.password)
  const backupCode = generateBackupCode()
  const backupCodeHash = await hashPassword(backupCode.replace(/-/g, ""))

  const { data, error } = await supabase
    .from("dashboard_users")
    .insert({
      user_id:          params.userId.trim(),
      email:            params.email.trim().toLowerCase(),
      full_name:        params.fullName.trim(),
      password_hash:    passwordHash,
      backup_code_hash: backupCodeHash,
      backup_code:      backupCode,
    })
    .select()
    .single()

  if (error || !data) return { success: false, error: "Registration failed. Please try again." }

  const user: DashboardUser = {
    id:        String(data.id),
    userId:    String(data.user_id),
    email:     String(data.email),
    fullName:  String(data.full_name),
    createdAt: String(data.created_at),
  }

  return { success: true, user, backupCode }
}
