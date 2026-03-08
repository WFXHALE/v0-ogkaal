// Admin authentication library
// Contains both server-side and client-side functions

const SESSION_STORAGE_KEY = "og_admin_session"
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface AdminSession {
  email: string
  loginTime: string
  expiresAt: string
}

// ============================================
// SERVER-SIDE FUNCTIONS (for API routes)
// ============================================

// In-memory OTP storage (in production, use Redis or database)
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map()

// Get admin credentials from environment variables
export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || '',
    username: process.env.ADMIN_USERNAME || '',
    phone: process.env.ADMIN_PHONE || '',
    password: process.env.ADMIN_PASSWORD || '',
  }
}

// Check if phone matches admin phone
export function isAdminPhone(phone: string): boolean {
  const admin = getAdminCredentials()
  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '')
  const adminPhone = admin.phone.replace(/[\s\-\(\)]/g, '')
  return normalizedPhone === adminPhone || phone === admin.phone
}

// Check if email matches admin email
export function isAdminEmail(email: string): boolean {
  const admin = getAdminCredentials()
  return email.toLowerCase() === admin.email.toLowerCase()
}

// Update password (in-memory only, resets on server restart)
let overridePassword: string | null = null
export function updatePassword(newPassword: string): void {
  overridePassword = newPassword
  console.log('[ADMIN AUTH] Password updated (in-memory only)')
}

// Get the current password (checks override first)
export function getCurrentPassword(): string {
  if (overridePassword) return overridePassword
  return getAdminCredentials().password
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  console.log('[ADMIN AUTH] Generated OTP:', otp)
  return otp
}

// Store OTP with expiration (5 minutes)
export function storeOTP(identifier: string, otp: string): void {
  otpStore.set(identifier.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  })
}

// Verify OTP
export function verifyOTP(identifier: string, otp: string): boolean {
  const stored = otpStore.get(identifier.toLowerCase())
  if (!stored) return false
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(identifier.toLowerCase())
    return false
  }
  
  if (stored.otp !== otp) return false
  
  // OTP is valid, delete it
  otpStore.delete(identifier.toLowerCase())
  return true
}

// Generate a simple session token
export function generateSessionToken(): string {
  return `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// ============================================
// CLIENT-SIDE FUNCTIONS (for components)
// ============================================

// Admin account always exists when using env-based auth
export function adminExists(): boolean {
  return true
}

// Get admin account info (client-side placeholder)
export function getAdminAccount() {
  return null // Account info is on server via env vars
}

// Create admin account (no-op for env-based auth)
export async function createAdminAccount(
  _email: string,
  _password: string
): Promise<{ success: boolean; error?: string }> {
  return { success: true }
}

// Login via API
export async function loginAdmin(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; requires2FA?: boolean; loginType?: string; devOTP?: string }> {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, step: 'password' }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' }
    }

    if (data.requiresOTP) {
      return { success: true, requires2FA: true, devOTP: data.devOTP }
    }

    // Create client session
    createSession(identifier)
    return { success: true }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Verify 2FA OTP
export async function verify2FA(
  identifier: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp, step: 'verify-otp' }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Verification failed' }
    }

    createSession(identifier)
    return { success: true }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Phone OTP login - request OTP
export async function sendPhoneOTP(
  phone: string
): Promise<{ success: boolean; error?: string; devOTP?: string }> {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: phone, loginType: 'phone', step: 'request-otp' }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send OTP' }
    }

    return { success: true, devOTP: data.devOTP }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Phone OTP login - verify OTP
export async function verifyPhoneOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: phone, otp, loginType: 'phone', step: 'verify-otp' }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Verification failed' }
    }

    createSession(phone)
    return { success: true }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Forgot password - request OTP
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string; devOTP?: string }> {
  try {
    const response = await fetch('/api/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, step: 'request-otp' }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send OTP' }
    }

    return { success: true, devOTP: data.devOTP }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Forgot password - verify OTP
export async function verifyResetOTP(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string; resetToken?: string }> {
  try {
    const response = await fetch('/api/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, step: 'verify-otp' }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Verification failed' }
    }

    return { success: true, resetToken: data.resetToken }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// Forgot password - reset password
export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetToken, newPassword, step: 'reset-password' }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Reset failed' }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

// ============================================
// SESSION MANAGEMENT (Client-side)
// ============================================

function createSession(identifier: string): void {
  if (typeof window === 'undefined') return

  const session: AdminSession = {
    email: identifier,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function isSessionValid(): boolean {
  if (typeof window === 'undefined') return false

  const sessionData = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionData) return false

  try {
    const session: AdminSession = JSON.parse(sessionData)
    const expiresAt = new Date(session.expiresAt)
    return expiresAt > new Date()
  } catch {
    return false
  }
}

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null

  const sessionData = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionData) return null

  try {
    return JSON.parse(sessionData)
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  if (typeof window === 'undefined') return

  // Clear server cookie
  try {
    await fetch('/api/admin/logout', { method: 'POST' })
  } catch {
    // Ignore errors
  }

  // Clear local session
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
