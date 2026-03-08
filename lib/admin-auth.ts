// Admin authentication with password hashing
// Using a simple but secure hash function for client-side (in production, use bcrypt on server)

const ADMIN_STORAGE_KEY = "og_admin_account"
const SESSION_STORAGE_KEY = "og_admin_session"

// Simple hash function (SHA-256 simulation for client-side)
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

export interface AdminAccount {
  email: string
  passwordHash: string
  createdAt: string
}

export interface AdminSession {
  email: string
  loginTime: string
  expiresAt: string
}

// Check if admin account exists
export function adminExists(): boolean {
  if (typeof window === "undefined") return false
  const admin = localStorage.getItem(ADMIN_STORAGE_KEY)
  return admin !== null
}

// Create admin account (one-time setup)
export async function createAdminAccount(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot create account on server" }
  }
  
  // Check if admin already exists
  if (adminExists()) {
    return { success: false, error: "Admin account already exists" }
  }
  
  // Validate email
  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email address" }
  }
  
  // Validate password strength
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }
  
  // Hash password and store
  const passwordHash = await hashPassword(password)
  const adminAccount: AdminAccount = {
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString()
  }
  
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminAccount))
  return { success: true }
}

// Login admin
export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot login on server" }
  }
  
  // Check if admin exists
  const adminData = localStorage.getItem(ADMIN_STORAGE_KEY)
  if (!adminData) {
    return { success: false, error: "No admin account found. Please complete setup first." }
  }
  
  try {
    const admin: AdminAccount = JSON.parse(adminData)
    
    // Verify email
    if (admin.email !== email.toLowerCase().trim()) {
      return { success: false, error: "Invalid email or password" }
    }
    
    // Verify password
    const isValid = await verifyPassword(password, admin.passwordHash)
    if (!isValid) {
      return { success: false, error: "Invalid email or password" }
    }
    
    // Create session
    const session: AdminSession = {
      email: admin.email,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    return { success: true }
  } catch {
    return { success: false, error: "Authentication failed. Please try again." }
  }
}

// Check if session is valid
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

// Get current session
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

// Logout
export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

// Delete admin account (for reset purposes - should be protected)
export function deleteAdminAccount(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ADMIN_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
