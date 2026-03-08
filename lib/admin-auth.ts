// Admin authentication with enhanced security
// Using SHA-256 for password hashing (in production, use bcrypt on server)

const ADMIN_STORAGE_KEY = "og_admin_account"
const SESSION_STORAGE_KEY = "og_admin_session"
const LOGIN_ATTEMPTS_KEY = "og_login_attempts"
const SECURITY_LOGS_KEY = "og_security_logs"
const OTP_STORAGE_KEY = "og_otp_data"
const PENDING_2FA_KEY = "og_pending_2fa"

// Configuration
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

// Hash function (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "og_kaal_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Interfaces
export interface AdminAccount {
  email: string
  username: string
  phone: string
  passwordHash: string
  twoFactorEnabled: boolean
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
  type: "login_success" | "login_failed" | "logout" | "password_reset" | "otp_sent" | "2fa_verified"
  email?: string
  ipAddress: string
  location: string
  timestamp: string
  details?: string
}

export interface OTPData {
  code: string
  email?: string
  phone?: string
  expiresAt: string
  purpose: "login" | "2fa" | "password_reset"
}

export interface Pending2FA {
  email: string
  code: string
  expiresAt: string
}

// Get IP and location
async function getIPAndLocation(): Promise<{ ip: string; location: string }> {
  try {
    const response = await fetch("https://ipapi.co/json/", { cache: "no-store" })
    const data = await response.json()
    return {
      ip: data.ip || "Unknown",
      location: data.city && data.country_name ? `${data.city}, ${data.country_name}` : "Unknown"
    }
  } catch {
    return { ip: "Unknown", location: "Unknown" }
  }
}

// Security Logs
export function getSecurityLogs(): SecurityLog[] {
  if (typeof window === "undefined") return []
  try {
    const logs = localStorage.getItem(SECURITY_LOGS_KEY)
    return logs ? JSON.parse(logs) : []
  } catch {
    return []
  }
}

export async function addSecurityLog(
  type: SecurityLog["type"],
  email?: string,
  details?: string
): Promise<void> {
  if (typeof window === "undefined") return
  
  const { ip, location } = await getIPAndLocation()
  const log: SecurityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    email,
    ipAddress: ip,
    location,
    timestamp: new Date().toISOString(),
    details
  }
  
  const logs = getSecurityLogs()
  logs.unshift(log)
  // Keep only last 100 logs
  localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(logs.slice(0, 100)))
}

// Login Attempts Management
function getLoginAttempts(): LoginAttempts {
  if (typeof window === "undefined") return { count: 0, lastAttempt: "" }
  try {
    const data = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
    return data ? JSON.parse(data) : { count: 0, lastAttempt: "" }
  } catch {
    return { count: 0, lastAttempt: "" }
  }
}

function setLoginAttempts(attempts: LoginAttempts): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
}

function resetLoginAttempts(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
}

export function isAccountLocked(): { locked: boolean; remainingSeconds?: number } {
  const attempts = getLoginAttempts()
  if (attempts.lockedUntil) {
    const lockEnd = new Date(attempts.lockedUntil)
    const now = new Date()
    if (lockEnd > now) {
      return { 
        locked: true, 
        remainingSeconds: Math.ceil((lockEnd.getTime() - now.getTime()) / 1000)
      }
    }
  }
  return { locked: false }
}

function recordFailedAttempt(): { locked: boolean; attemptsRemaining: number } {
  const attempts = getLoginAttempts()
  attempts.count += 1
  attempts.lastAttempt = new Date().toISOString()
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
    setLoginAttempts(attempts)
    return { locked: true, attemptsRemaining: 0 }
  }
  
  setLoginAttempts(attempts)
  return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - attempts.count }
}

// Admin Account Management
export function adminExists(): boolean {
  if (typeof window === "undefined") return false
  const admin = localStorage.getItem(ADMIN_STORAGE_KEY)
  return admin !== null
}

export function getAdminAccount(): AdminAccount | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(ADMIN_STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function createAdminAccount(
  email: string, 
  password: string,
  username?: string,
  phone?: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot create account on server" }
  }
  
  if (adminExists()) {
    return { success: false, error: "Admin account already exists" }
  }
  
  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email address" }
  }
  
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }
  
  const passwordHash = await hashPassword(password)
  const adminAccount: AdminAccount = {
    email: email.toLowerCase().trim(),
    username: username || email.split("@")[0],
    phone: phone || "",
    passwordHash,
    twoFactorEnabled: true, // Enable 2FA by default
    createdAt: new Date().toISOString()
  }
  
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminAccount))
  await addSecurityLog("login_success", email, "Admin account created")
  return { success: true }
}

// Login Methods
export type LoginMethod = "email" | "username" | "phone"

export async function loginAdmin(
  identifier: string, 
  password: string,
  method: LoginMethod = "email"
): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot login on server" }
  }
  
  // Check if locked
  const lockStatus = isAccountLocked()
  if (lockStatus.locked) {
    await addSecurityLog("login_failed", identifier, "Account locked")
    return { 
      success: false, 
      error: `Access denied. Unauthorized login attempt. Try again in ${lockStatus.remainingSeconds} seconds.`
    }
  }
  
  const admin = getAdminAccount()
  if (!admin) {
    return { success: false, error: "No admin account found. Please complete setup first." }
  }
  
  // Verify identifier based on method
  let identifierMatch = false
  switch (method) {
    case "email":
      identifierMatch = admin.email === identifier.toLowerCase().trim()
      break
    case "username":
      identifierMatch = admin.username.toLowerCase() === identifier.toLowerCase().trim()
      break
    case "phone":
      identifierMatch = admin.phone === identifier.trim()
      break
  }
  
  if (!identifierMatch) {
    const attemptResult = recordFailedAttempt()
    await addSecurityLog("login_failed", identifier, `Invalid ${method}`)
    if (attemptResult.locked) {
      return { 
        success: false, 
        error: "Access denied. Unauthorized login attempt. Account locked for 5 minutes."
      }
    }
    return { 
      success: false, 
      error: `Invalid credentials. ${attemptResult.attemptsRemaining} attempts remaining.`
    }
  }
  
  const isValid = await verifyPassword(password, admin.passwordHash)
  if (!isValid) {
    const attemptResult = recordFailedAttempt()
    await addSecurityLog("login_failed", identifier, "Invalid password")
    if (attemptResult.locked) {
      return { 
        success: false, 
        error: "Access denied. Unauthorized login attempt. Account locked for 5 minutes."
      }
    }
    return { 
      success: false, 
      error: `Invalid credentials. ${attemptResult.attemptsRemaining} attempts remaining.`
    }
  }
  
  // Check if 2FA is enabled
  if (admin.twoFactorEnabled) {
    // Generate and store 2FA code
    const code = generateOTP()
    const pending2FA: Pending2FA = {
      email: admin.email,
      code,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS).toISOString()
    }
    localStorage.setItem(PENDING_2FA_KEY, JSON.stringify(pending2FA))
    await addSecurityLog("otp_sent", admin.email, "2FA code sent")
    
    return { success: true, requires2FA: true }
  }
  
  // Create session if no 2FA
  await createSession(admin.email)
  resetLoginAttempts()
  await addSecurityLog("login_success", admin.email, `Login via ${method}`)
  
  return { success: true }
}

// OTP Login
export async function sendOTP(
  identifier: string, 
  type: "email" | "phone"
): Promise<{ success: boolean; error?: string; otp?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot send OTP on server" }
  }
  
  const admin = getAdminAccount()
  if (!admin) {
    return { success: false, error: "No admin account found" }
  }
  
  const match = type === "email" 
    ? admin.email === identifier.toLowerCase().trim()
    : admin.phone === identifier.trim()
  
  if (!match) {
    return { success: false, error: `Invalid ${type}` }
  }
  
  const code = generateOTP()
  const otpData: OTPData = {
    code,
    [type]: identifier,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
    purpose: "login"
  }
  
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData))
  await addSecurityLog("otp_sent", admin.email, `OTP sent to ${type}`)
  
  // In production, this would send actual OTP via SMS/Email
  // For demo, return the OTP to display
  return { success: true, otp: code }
}

export async function verifyOTPLogin(
  otp: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot verify on server" }
  }
  
  const otpDataStr = localStorage.getItem(OTP_STORAGE_KEY)
  if (!otpDataStr) {
    return { success: false, error: "No OTP request found. Please request a new OTP." }
  }
  
  try {
    const otpData: OTPData = JSON.parse(otpDataStr)
    
    if (new Date(otpData.expiresAt) < new Date()) {
      localStorage.removeItem(OTP_STORAGE_KEY)
      return { success: false, error: "OTP expired. Please request a new one." }
    }
    
    if (otpData.code !== otp) {
      return { success: false, error: "Invalid OTP. Please try again." }
    }
    
    const admin = getAdminAccount()
    if (!admin) {
      return { success: false, error: "Admin account not found" }
    }
    
    await createSession(admin.email)
    localStorage.removeItem(OTP_STORAGE_KEY)
    resetLoginAttempts()
    await addSecurityLog("login_success", admin.email, "Login via OTP")
    
    return { success: true }
  } catch {
    return { success: false, error: "Invalid OTP data" }
  }
}

// 2FA Verification
export function getPending2FA(): Pending2FA | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(PENDING_2FA_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function verify2FA(code: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot verify on server" }
  }
  
  const pending = getPending2FA()
  if (!pending) {
    return { success: false, error: "No 2FA verification pending" }
  }
  
  if (new Date(pending.expiresAt) < new Date()) {
    localStorage.removeItem(PENDING_2FA_KEY)
    return { success: false, error: "Verification code expired. Please login again." }
  }
  
  if (pending.code !== code) {
    return { success: false, error: "Invalid verification code" }
  }
  
  await createSession(pending.email)
  localStorage.removeItem(PENDING_2FA_KEY)
  resetLoginAttempts()
  await addSecurityLog("2fa_verified", pending.email, "2FA verification successful")
  
  return { success: true }
}

// Password Reset
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; resetCode?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot process on server" }
  }
  
  const admin = getAdminAccount()
  if (!admin || admin.email !== email.toLowerCase().trim()) {
    // Don't reveal if email exists
    return { success: true }
  }
  
  const code = generateOTP()
  const otpData: OTPData = {
    code,
    email,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
    purpose: "password_reset"
  }
  
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData))
  await addSecurityLog("password_reset", email, "Password reset requested")
  
  // In production, send email with reset link
  return { success: true, resetCode: code }
}

export async function resetPassword(
  code: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot process on server" }
  }
  
  const otpDataStr = localStorage.getItem(OTP_STORAGE_KEY)
  if (!otpDataStr) {
    return { success: false, error: "No reset request found" }
  }
  
  try {
    const otpData: OTPData = JSON.parse(otpDataStr)
    
    if (otpData.purpose !== "password_reset") {
      return { success: false, error: "Invalid reset request" }
    }
    
    if (new Date(otpData.expiresAt) < new Date()) {
      localStorage.removeItem(OTP_STORAGE_KEY)
      return { success: false, error: "Reset code expired" }
    }
    
    if (otpData.code !== code) {
      return { success: false, error: "Invalid reset code" }
    }
    
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" }
    }
    
    const admin = getAdminAccount()
    if (!admin) {
      return { success: false, error: "Admin account not found" }
    }
    
    admin.passwordHash = await hashPassword(newPassword)
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin))
    localStorage.removeItem(OTP_STORAGE_KEY)
    await addSecurityLog("password_reset", admin.email, "Password reset successful")
    
    return { success: true }
  } catch {
    return { success: false, error: "Failed to reset password" }
  }
}

// Session Management
async function createSession(email: string): Promise<void> {
  const { ip, location } = await getIPAndLocation()
  const session: AdminSession = {
    email,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    ipAddress: ip,
    location
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false
  
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
  if (typeof window === "undefined") return null
  
  const sessionData = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionData) return null
  
  try {
    return JSON.parse(sessionData)
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return
  const session = getSession()
  if (session) {
    await addSecurityLog("logout", session.email, "User logged out")
  }
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function deleteAdminAccount(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ADMIN_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
  localStorage.removeItem(OTP_STORAGE_KEY)
  localStorage.removeItem(PENDING_2FA_KEY)
}
