// lib/dash-auth.ts
// Dedicated authentication for the Client Dashboard.
// Completely separate from the Community auth system (community-utils.ts).

// Note: all DB operations go through server-side API routes (lib/db) to avoid
// the Supabase anon key "Invalid API key" error when called from the browser.

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
  if (typeof window !== "undefined") {
    import("./analytics").then(({ Analytics }) => Analytics.logout()).catch(() => {})
  }
}

// ── Auth operations (Supabase-backed) ────────────────────────────────────────

export async function login(
  identifier: string,   // accepts either user_id OR email
  password: string
): Promise<{ success: true; user: DashboardUser } | { success: false; error: string; code?: string; userId?: string; email?: string }> {
  const hash = await hashPassword(password)

  try {
    const res  = await fetch("/api/dashboard/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ identifier: identifier.trim().toLowerCase(), passwordHash: hash }),
    })
    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: json.error ?? "Login failed.", code: json.code, userId: json.userId, email: json.email }
    }

    const data = json.data as Record<string, unknown>

    const user: DashboardUser = {
      id:              String(data.id),
      userId:          String(data.user_id),
      email:           String(data.email),
      fullName:        String(data.full_name),
      createdAt:       String(data.created_at),
      numericUid:      data.numeric_uid      ? Number(data.numeric_uid)      : undefined,
      tradingLevel:    data.trading_level    ? String(data.trading_level)    : undefined,
      marketType:      data.market_type      ? String(data.market_type)      : undefined,
      tradingType:     data.trading_type     ? String(data.trading_type)     : undefined,
      yearsExperience: data.years_experience ? String(data.years_experience) : undefined,
      isVerified:      Boolean(data.is_verified),
      kycStatus:       (data.kyc_status as DashboardUser["kycStatus"]) ?? "none",
    }

    const session: DashboardSession = {
      ...user,
      loggedInAt: Date.now(),
      backupCode: data.backup_code ? String(data.backup_code) : undefined,
      avatarUrl:  data.avatar_url  ? String(data.avatar_url)  : undefined,
    }
    setSession(session)

    if (typeof window !== "undefined") {
      import("./analytics").then(({ Analytics, identifyUser }) => {
        identifyUser(user.id)
        Analytics.login("email")
      }).catch(() => {})
    }
    return { success: true, user }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}

export async function loginWithBackupCode(
  email: string,
  backupCode: string
): Promise<{ success: true; user: DashboardUser } | { success: false; error: string }> {
  const backupCodeHash = await hashPassword(backupCode.replace(/-/g, ""))

  try {
    const res  = await fetch("/api/dashboard/login-backup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim().toLowerCase(), backupCodeHash }),
    })
    const json = await res.json()

    if (!res.ok) return { success: false, error: json.error ?? "Login failed." }

    const data = json.data as Record<string, unknown>
    const user: DashboardUser = {
      id:              String(data.id),
      userId:          String(data.user_id),
      email:           String(data.email),
      fullName:        String(data.full_name),
      createdAt:       String(data.created_at),
      numericUid:      data.numeric_uid      ? Number(data.numeric_uid)      : undefined,
      tradingLevel:    data.trading_level    ? String(data.trading_level)    : undefined,
      marketType:      data.market_type      ? String(data.market_type)      : undefined,
      tradingType:     data.trading_type     ? String(data.trading_type)     : undefined,
      yearsExperience: data.years_experience ? String(data.years_experience) : undefined,
      isVerified:      Boolean(data.is_verified),
      kycStatus:       (data.kyc_status as DashboardUser["kycStatus"]) ?? "none",
    }
    const session: DashboardSession = {
      ...user,
      loggedInAt: Date.now(),
      backupCode: data.backup_code ? String(data.backup_code) : undefined,
      avatarUrl:  data.avatar_url  ? String(data.avatar_url)  : undefined,
    }
    setSession(session)
    return { success: true, user }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}

// ── Email verification ────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res  = await fetch("/api/dashboard/send-verification", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim().toLowerCase(), userId: userId.trim().toLowerCase() }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error ?? "Failed to send verification email." }
    return { success: true }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}

export async function verifyEmailOtp(
  email: string,
  userId: string,
  otp: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res  = await fetch("/api/dashboard/verify-email", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim().toLowerCase(), userId: userId.trim().toLowerCase(), otp: otp.trim() }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error ?? "Verification failed." }
    return { success: true }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}

// Send OTP to the user's email (rate-limited to 5/day on server)
export async function sendPasswordResetOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/dashboard/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim().toLowerCase() }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error ?? "Failed to send OTP." }
    return { success: true }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}

// Verify OTP and set a new password
export async function verifyOtpAndResetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/dashboard/forgot-password", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        email:       email.trim().toLowerCase(),
        otp:         otp.trim(),
        newPassword,
      }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error ?? "Reset failed." }
    return { success: true }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}

// ── Fetch backup code from DB (auto-generates if missing) ─────────────────────

export async function fetchBackupCode(userId: string): Promise<string | null> {
  try {
    const res  = await fetch(`/api/dashboard/fetch-backup-code?userId=${encodeURIComponent(userId)}`)
    const json = await res.json()
    if (!res.ok || !json.backupCode) return null
    return String(json.backupCode)
  } catch {
    return null
  }
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
  // Hash the password and generate backup code client-side so the plaintext
  // password is never sent over the wire.
  const passwordHash   = await hashPassword(params.password)
  const backupCode     = generateBackupCode()
  const backupCodeHash = await hashPassword(backupCode.replace(/-/g, ""))
  const numericUid     = Math.floor(100000 + Math.random() * 900000)

  // Delegate the actual INSERT to the server-side API route which uses
  // lib/db (POSTGRES_URL_NON_POOLING + service role) — bypasses the anon
  // Supabase client that causes "Invalid API key" errors.
  try {
    const res = await fetch("/api/dashboard/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId:         params.userId,
        email:          params.email,
        fullName:       params.fullName,
        passwordHash,
        backupCode,
        backupCodeHash,
        numericUid,
        tradingLevel:    params.tradingLevel,
        marketType:      params.marketType,
        tradingType:     params.tradingType,
        yearsExperience: params.yearsExperience,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: json.error ?? "Registration failed. Please try again." }
    }

    const data = json.data as Record<string, unknown>
    const user: DashboardUser = {
      id:              String(data.id),
      userId:          String(data.user_id),
      email:           String(data.email),
      fullName:        String(data.full_name),
      createdAt:       String(data.created_at),
      numericUid,
      tradingLevel:    params.tradingLevel    || undefined,
      marketType:      params.marketType      || undefined,
      tradingType:     params.tradingType     || undefined,
      yearsExperience: params.yearsExperience || undefined,
    }

    if (typeof window !== "undefined") {
      import("./analytics").then(({ Analytics, identifyUser }) => {
        identifyUser(user.id)
        Analytics.signUp("email")
      }).catch(() => {})
    }

    return { success: true, user, backupCode }
  } catch {
    return { success: false, error: "Network error. Please try again." }
  }
}
