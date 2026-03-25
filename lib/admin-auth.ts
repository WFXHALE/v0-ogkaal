// Admin authentication — direct credential login, no OTP/2FA
// Password hashing via SHA-256 (client-side demo; move to server bcrypt for production)

const ADMIN_STORAGE_KEY   = "og_admin_account"
const SESSION_STORAGE_KEY = "og_admin_session"
const LOGIN_ATTEMPTS_KEY  = "og_login_attempts"
const SECURITY_LOGS_KEY   = "og_security_logs"

const MAX_LOGIN_ATTEMPTS   = 5
const LOCKOUT_DURATION_MS  = 24 * 60 * 60 * 1000 // 24 hours (per spec)
const SESSION_DURATION_MS  = 30 * 60 * 1000       // 30 minutes — "Remember Admin Session" feature

// ─── Password hashing ────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "og_kaal_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface AdminAccount {
  email: string
  username: string
  phone: string
  passwordHash: string
  createdAt: string
}

export interface AdminSession {
  email: string
  loginTime: string
  expiresAt: string
  ipAddress?: string
  location?: string
}

export interface LoginAttempts {
  count: number
  lastAttempt: string
  lockedUntil?: string
}

export interface SecurityLog {
  id: string
  type: "login_success" | "login_failed" | "logout" | "password_reset" | "password_change"
  email?: string
  ipAddress: string
  location: string
  timestamp: string
  details?: string
}

export type LoginMethod = "email" | "username" | "phone"

// ─── IP / location ────────────────────────────────────────────────────────────

async function getIPAndLocation(): Promise<{ ip: string; location: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" })
    const d = await res.json()
    return {
      ip:       d.ip || "Unknown",
      location: d.city && d.country_name ? `${d.city}, ${d.country_name}` : "Unknown",
    }
  } catch {
    return { ip: "Unknown", location: "Unknown" }
  }
}

// ─── Security logs ────────────────────────────────────────────────────────────

export function getSecurityLogs(): SecurityLog[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(SECURITY_LOGS_KEY) || "[]") } catch { return [] }
}

export async function addSecurityLog(
  type: SecurityLog["type"],
  email?: string,
  details?: string,
): Promise<void> {
  if (typeof window === "undefined") return
  const { ip, location } = await getIPAndLocation()
  const log: SecurityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type, email, ipAddress: ip, location,
    timestamp: new Date().toISOString(),
    details,
  }
  const logs = getSecurityLogs()
  logs.unshift(log)
  localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(logs.slice(0, 100)))
}

// ─── Login attempt tracking ───────────────────────────────────────────────────

function getLoginAttempts(): LoginAttempts {
  if (typeof window === "undefined") return { count: 0, lastAttempt: "" }
  try { return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || "null") || { count: 0, lastAttempt: "" } } catch { return { count: 0, lastAttempt: "" } }
}

function setLoginAttempts(a: LoginAttempts) {
  if (typeof window === "undefined") return
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(a))
}

function resetLoginAttempts() {
  if (typeof window === "undefined") return
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
}

export function isAccountLocked(): { locked: boolean; remainingSeconds?: number } {
  const a = getLoginAttempts()
  if (a.lockedUntil) {
    const lockEnd = new Date(a.lockedUntil)
    if (lockEnd > new Date()) {
      return { locked: true, remainingSeconds: Math.ceil((lockEnd.getTime() - Date.now()) / 1000) }
    }
  }
  return { locked: false }
}

function recordFailedAttempt(): { locked: boolean; attemptsRemaining: number } {
  const a = getLoginAttempts()
  a.count += 1
  a.lastAttempt = new Date().toISOString()
  if (a.count >= MAX_LOGIN_ATTEMPTS) {
    a.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
    setLoginAttempts(a)
    return { locked: true, attemptsRemaining: 0 }
  }
  setLoginAttempts(a)
  return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - a.count }
}

// ─── Admin account ────────────────────────────────────────────────────────────

export function adminExists(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(ADMIN_STORAGE_KEY) !== null
}

export function getAdminAccount(): AdminAccount | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || "null") } catch { return null }
}

export async function createAdminAccount(
  email: string,
  password: string,
  username?: string,
  phone?: string,
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Cannot create account on server" }
  if (adminExists()) return { success: false, error: "Admin account already exists" }
  if (!email.includes("@")) return { success: false, error: "Invalid email address" }
  if (password.length < 8) return { success: false, error: "Password must be at least 8 characters" }

  const account: AdminAccount = {
    email:        email.toLowerCase().trim(),
    username:     username || email.split("@")[0],
    phone:        phone || "",
    passwordHash: await hashPassword(password),
    createdAt:    new Date().toISOString(),
  }
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(account))
  await addSecurityLog("login_success", email, "Admin account created")
  return { success: true }
}

// ─── Login — direct credential check, no OTP/2FA ────────────────────────────

export async function loginAdmin(
  identifier: string,
  password: string,
  method: LoginMethod = "email",
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Cannot login on server" }

  const lock = isAccountLocked()
  if (lock.locked) {
    await addSecurityLog("login_failed", identifier, "Account locked")
    return { success: false, error: `Account locked. Try again in ${lock.remainingSeconds}s.` }
  }

  const admin = getAdminAccount()
  if (!admin) return { success: false, error: "No admin account found. Please complete setup first." }

  const id = identifier.toLowerCase().trim()
  const identifierMatch =
    method === "email"    ? admin.email === id :
    method === "username" ? admin.username.toLowerCase() === id :
                            admin.phone === identifier.trim()

  if (!identifierMatch) {
    const r = recordFailedAttempt()
    await addSecurityLog("login_failed", identifier, `Invalid ${method}`)
    return r.locked
      ? { success: false, error: "Account locked for 5 minutes due to too many failed attempts." }
      : { success: false, error: `Invalid credentials. ${r.attemptsRemaining} attempts remaining.` }
  }

  const passwordOk = await verifyPassword(password, admin.passwordHash)
  if (!passwordOk) {
    const r = recordFailedAttempt()
    await addSecurityLog("login_failed", identifier, "Invalid password")
    return r.locked
      ? { success: false, error: "Account locked for 5 minutes due to too many failed attempts." }
      : { success: false, error: `Invalid credentials. ${r.attemptsRemaining} attempts remaining.` }
  }

  // Credentials valid — create session immediately
  await createSession(admin.email)
  resetLoginAttempts()
  await addSecurityLog("login_success", admin.email, `Login via ${method}`)
  return { success: true }
}

// ─── Secret-key login (primary auth method) ──────────────────────────────────
// All lockout logic lives on the server (/api/admin/verify-key).
// The client never reads lockout state from localStorage — the server is the
// single source of truth, tracked per IP in admin_login_attempts.

export async function loginWithSecretKey(key: string): Promise<{
  success:          boolean
  error?:           string
  locked?:          boolean
  remainingSec?:    number
  lockedUntil?:     string
  attemptsLeft?:    number
  failureCount?:    number
}> {
  if (typeof window === "undefined") return { success: false, error: "Cannot login on server" }

  // Generate a stable device ID (stored in localStorage, not used for security — just telemetry)
  let deviceId = localStorage.getItem("og_device_id") ?? ""
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem("og_device_id", deviceId)
  }

  let data: Record<string, unknown> = {}
  let status = 0
  try {
    const res = await fetch("/api/admin/verify-key", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ key: key.trim(), deviceId }),
    })
    status = res.status
    data   = await res.json()
  } catch {
    return { success: false, error: "Network error — could not reach the server. Please try again." }
  }

  if (status === 500) {
    return { success: false, error: String(data.error ?? "Server configuration error. ADMIN_SECRET_KEY may not be set.") }
  }

  if (status === 429 || data.locked) {
    return {
      success:       false,
      locked:        true,
      remainingSec:  Number(data.remainingSec  ?? 0),
      lockedUntil:   String(data.lockedUntil   ?? ""),
      failureCount:  Number(data.failureCount  ?? 0),
      attemptsLeft:  0,
      error:         String(data.error ?? "Too many failed attempts."),
    }
  }

  if (!data.ok && !data.success) {
    return {
      success:       false,
      locked:        false,
      attemptsLeft:  Number(data.attemptsLeft ?? 0),
      failureCount:  Number(data.failureCount ?? 0),
      error:         String(data.error ?? "Invalid key."),
    }
  }

  // Key is correct — create a local session so isSessionValid() returns true
  await createSession("admin")
  return { success: true }
}

/** Check the server for current lockout status (called on page load). */
export async function checkLockoutStatus(): Promise<{
  locked:       boolean
  remainingSec: number
  lockedUntil:  string | null
  failureCount: number
  attemptsLeft: number
}> {
  try {
    const res  = await fetch("/api/admin/verify-key", { method: "GET", cache: "no-store" })
    const data = await res.json()
    return {
      locked:       !!data.locked,
      remainingSec: Number(data.remainingSec ?? 0),
      lockedUntil:  data.lockedUntil ? String(data.lockedUntil) : null,
      failureCount: Number(data.failureCount ?? 0),
      attemptsLeft: Number(data.attemptsLeft ?? 3),
    }
  } catch {
    return { locked: false, remainingSec: 0, lockedUntil: null, failureCount: 0, attemptsLeft: 3 }
  }
}

// ─── Google login (backup method) ────────────────────────────────────────────
// Verifies the signed-in Google user's email against ADMIN_EMAIL (server-side).

export async function loginWithGoogle(
  email: string,
): Promise<{ success: boolean; error?: string; accessDenied?: boolean }> {
  if (typeof window === "undefined") return { success: false, error: "Cannot login on server" }

  try {
    const res = await fetch("/api/admin/verify-google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()

    if (res.status === 403) {
      addSecurityLog("login_failed", email, "Google login — email not authorised").catch(() => {})
      return { success: false, error: "Access Denied", accessDenied: true }
    }
    if (!res.ok) {
      return { success: false, error: data.error ?? "Server error. Please try again." }
    }
  } catch {
    return { success: false, error: "Network error — could not reach the server. Please try again." }
  }

  await createSession(email)
  resetLoginAttempts()
  addSecurityLog("login_success", email, "Login via Google").catch(() => {})
  return { success: true }
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; error?: string; resetCode?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Cannot process on server" }
  const admin = getAdminAccount()
  if (!admin || admin.email !== email.toLowerCase().trim()) return { success: true } // silent
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  localStorage.setItem("og_reset_code", JSON.stringify({ code, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }))
  await addSecurityLog("password_reset", email, "Password reset requested")
  return { success: true, resetCode: code }
}

export async function resetPassword(
  code: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Cannot process on server" }
  const raw = localStorage.getItem("og_reset_code")
  if (!raw) return { success: false, error: "No reset request found" }
  try {
    const { code: stored, expiresAt } = JSON.parse(raw)
    if (new Date(expiresAt) < new Date()) { localStorage.removeItem("og_reset_code"); return { success: false, error: "Reset code expired" } }
    if (stored !== code) return { success: false, error: "Invalid reset code" }
    if (newPassword.length < 8) return { success: false, error: "Password must be at least 8 characters" }
    const admin = getAdminAccount()
    if (!admin) return { success: false, error: "Admin account not found" }
    admin.passwordHash = await hashPassword(newPassword)
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin))
    localStorage.removeItem("og_reset_code")
    await addSecurityLog("password_reset", admin.email, "Password reset successful")
    return { success: true }
  } catch { return { success: false, error: "Failed to reset password" } }
}

// ─── Session management ───────────────────────────────────────────────────────

async function createSession(email: string): Promise<void> {
  // Write session immediately so login is never blocked by the IP lookup.
  const session: AdminSession = {
    email,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    ipAddress: "Unknown",
    location:  "Unknown",
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

  // Enrich with IP/location in the background — failure is silently ignored.
  getIPAndLocation().then(({ ip, location }) => {
    try {
      const stored: AdminSession = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null")
      if (stored && stored.email === email) {
        stored.ipAddress = ip
        stored.location  = location
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored))
      }
    } catch { /* ignore */ }
  }).catch(() => { /* ignore */ })
}

export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false
  try {
    const s: AdminSession = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null")
    return !!s && new Date(s.expiresAt) > new Date()
  } catch { return false }
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null") } catch { return null }
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return
  const s = getSession()
  if (s) await addSecurityLog("logout", s.email, "User logged out")
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Cannot process on server" }
  const admin = getAdminAccount()
  if (!admin) return { success: false, error: "Admin account not found" }
  const currentHash = await hashPassword(currentPassword)
  if (currentHash !== admin.passwordHash) return { success: false, error: "Current password is incorrect" }
  if (newPassword.length < 8) return { success: false, error: "Password must be at least 8 characters" }
  admin.passwordHash = await hashPassword(newPassword)
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin))
  await addSecurityLog("password_change", admin.email, "Password changed successfully")
  return { success: true }
}

export function deleteAdminAccount(): void {
  if (typeof window === "undefined") return
  ;[ADMIN_STORAGE_KEY, SESSION_STORAGE_KEY, LOGIN_ATTEMPTS_KEY, SECURITY_LOGS_KEY, "og_reset_code"].forEach(k =>
    localStorage.removeItem(k),
  )
}
