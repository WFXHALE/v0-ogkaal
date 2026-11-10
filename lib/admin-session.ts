const SESSION_TTL_SECONDS = 30 * 60

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function getSigningKey(): Promise<CryptoKey | null> {
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) return null
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export async function createAdminSessionToken(): Promise<string | null> {
  const key = await getSigningKey()
  if (!key) return null
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })))
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const key = await getSigningKey()
  if (!key) return false
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(parts[1]),
      new TextEncoder().encode(parts[0]),
    )
    if (!valid) return false
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0]))) as { role?: string; exp?: number }
    return payload.role === "admin" && typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_SECONDS
