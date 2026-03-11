// lib/dash-auth.ts
// Dedicated authentication for the Client Dashboard.
// Completely separate from the Community auth system (community-utils.ts).

import { createClient } from "@/lib/supabase/client"

// ── Constants ──────────────────────────────────────────────────────────────────

const SESSION_KEY     = "og_dashboard_session"
const BACKUP_CODE_KEY = "og_dashboard_backup_code"
// Sessions are persistent — no timeout. User must manually log out.

// ── Backup code plain-text storage ────────────────────────────────────────────

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
  userId: string
  email: string
  fullName: string
  createdAt: string
  numericUid?: number
  tradingLevel?: string
  marketType?: string
  tradingType?: string
  yearsExperience?: string
  isVerified?: boolean
  kycStatus?: "none" | "pending" | "approved" | "rejected"
}

export interface DashboardSession extends DashboardUser {
  loggedInAt: number
  backupCode?: string
  avatarUrl?: string
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
  return code
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
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function logout(): void {
  setSession(null)
}

// ── Auth operations (Supabase-backed) ────────────────────────────────────────

export async function login(
  identifier: string,   // accepts either user_id OR email
  password: string
): Promise<{ success: true; user: DashboardUser } | { success: false; error: string }> {
  const supabase = createClient()
  const hash     = await hashPassword(password)
  const cleaned  = identifier.trim().toLowerCase()

  // Try user_id first; if nothing found, fall back to email lookup
  let { data, error } = await supabase
    .from("dashboard_users")
    .select("*")
    .eq("user_id", cleaned)
    .maybeSingle()

  if (!data) {
    const byEmail = await supabase
      .from("dashboard_users")
      .select("*")
      .eq("email", cleaned)
      .maybeSingle()
    data  = byEmail.data
    error = byEmail.error
  }

  if (error || !data) return { success: false, error: "No account found. Check your User ID or email." }

  if (data.password_hash !== hash) {
    return { success: false, error: "Incorrect password. Please try again." }
  }

  const user: DashboardUser = {
    id:               String(data.id),
    userId:           String(data.user_id),
    email:            String(data.email),
    fullName:         String(data.full_name),
    createdAt:        String(data.created_at),
    numericUid:       data.numeric_uid      ? Number(data.numeric_uid)      : undefined,
    tradingLevel:     data.trading_level    ? String(data.trading_level)    : undefined,
    marketType:       data.market_type      ? String(data.market_type)      : undefined,
    tradingType:      data.trading_type     ? String(data.trading_type)     : undefined,
    yearsExperience:  data.years_experience ? String(data.years_experience) : undefined,
    isVerified:       Boolean(data.is_verified),
    kycStatus:        (data.kyc_status as DashboardUser["kycStatus"]) ?? "none",
  }

  const session: DashboardSession = {
    ...user,
    loggedInAt: Date.now(),
    backupCode: data.backup_code ? String(data.backup_code) : undefined,
    avatarUrl:  data.avatar_url  ? String(data.avatar_url)  : undefined,
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
    id:               String(data.id),
    userId:           String(data.user_id),
    email:            String(data.email),
    fullName:         String(data.full_name),
    createdAt:        String(data.created_at),
    numericUid:       data.numeric_uid      ? Number(data.numeric_uid)      : undefined,
    tradingLevel:     data.trading_level    ? String(data.trading_level)    : undefined,
    marketType:       data.market_type      ? String(data.market_type)      : undefined,
    tradingType:      data.trading_type     ? String(data.trading_type)     : undefined,
    yearsExperience:  data.years_experience ? String(data.years_experience) : undefined,
    isVerified:       Boolean(data.is_verified),
    kycStatus:        (data.kyc_status as DashboardUser["kycStatus"]) ?? "none",
  }

  const session: DashboardSession = {
    ...user,
    loggedInAt: Date.now(),
    backupCode: data.backup_code ? String(data.backup_code) : undefined,
    avatarUrl:  data.avatar_url  ? String(data.avatar_url)  : undefined,
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
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { success: false, error: "Reset link has expired. Please request a new one." }
  }

  const hash = await hashPassword(newPassword)
  const { error: updateErr } = await supabase
    .from("dashboard_users")
    .update({ password_hash: hash })
    .eq("email", data.email)

  if (updateErr) return { success: false, error: "Failed to update password. Please try again." }

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
  if (data.backup_code) return String(data.backup_code)

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
  tradingLevel?: string
  marketType?: string
  tradingType?: string
  yearsExperience?: string
}): Promise<{ success: true; user: DashboardUser; backupCode: string } | { success: false; error: string }> {
  const supabase = createClient()

  // Check duplicate User ID
  const { data: existingId } = await supabase
    .from("dashboard_users")
    .select("id")
    .eq("user_id", params.userId.trim())
    .maybeSingle()
  if (existingId) return { success: false, error: "User ID already taken. Please choose another." }

  // Check duplicate email
  const { data: existingEmail } = await supabase
    .from("dashboard_users")
    .select("id")
    .eq("email", params.email.trim().toLowerCase())
    .maybeSingle()
  if (existingEmail) return { success: false, error: "An account with this email already exists. Try logging in." }

  const passwordHash   = await hashPassword(params.password)
  const backupCode     = generateBackupCode()
  const backupCodeHash = await hashPassword(backupCode.replace(/-/g, ""))

  // Generate a random 6-digit numeric UID
  const numericUid = Math.floor(100000 + Math.random() * 900000)

  const { data, error } = await supabase
    .from("dashboard_users")
    .insert({
      user_id:          params.userId.trim().toLowerCase(),
      email:            params.email.trim().toLowerCase(),
      full_name:        params.fullName.trim(),
      password_hash:    passwordHash,
      backup_code_hash: backupCodeHash,
      backup_code:      backupCode,
      numeric_uid:      numericUid,
      trading_level:    params.tradingLevel    || null,
      market_type:      params.marketType      || null,
      trading_type:     params.tradingType     || null,
      years_experience: params.yearsExperience || null,
    })
    .select()
    .single()

  if (error || !data) {
    // Surface the actual constraint violation if any
    const msg = error?.message ?? ""
    if (msg.includes("email"))   return { success: false, error: "Email already registered." }
    if (msg.includes("user_id")) return { success: false, error: "User ID already taken." }
    return { success: false, error: "Registration failed. Please try again." }
  }

  const user: DashboardUser = {
    id:               String(data.id),
    userId:           String(data.user_id),
    email:            String(data.email),
    fullName:         String(data.full_name),
    createdAt:        String(data.created_at),
    numericUid:       numericUid,
    tradingLevel:     params.tradingLevel    || undefined,
    marketType:       params.marketType      || undefined,
    tradingType:      params.tradingType     || undefined,
    yearsExperience:  params.yearsExperience || undefined,
  }

  return { success: true, user, backupCode }
}
