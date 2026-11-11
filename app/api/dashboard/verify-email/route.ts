import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

export const runtime = "nodejs"

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function POST(req: NextRequest) {
  try {
    const { email, userId, otp } = await req.json() as {
      email?: string
      userId?: string
      otp?: string
    }

    if (!email || !userId || !otp || otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json({ error: "A valid email, User ID and six-digit code are required." }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()
    const normUserId = userId.trim().toLowerCase()
    const account = await queryOne<{ id: string }>(
      "SELECT id FROM dashboard_users WHERE user_id = $1 AND email = $2",
      [normUserId, normalised]
    )
    if (!account) {
      return NextResponse.json({ error: "Account details do not match." }, { status: 400 })
    }

    const inputHash = await hashToken(otp.trim())
    const token = await queryOne<{
      id: string
      token_hash: string
      expires_at: string
    }>(
      `SELECT id, token_hash, expires_at
       FROM email_verification_tokens
       WHERE user_id = $1 AND email = $2 AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [normUserId, normalised]
    )

    if (!token) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 })
    }
    if (new Date(token.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 })
    }
    if (token.token_hash !== inputHash) {
      return NextResponse.json({ error: "Incorrect code. Please check and try again." }, { status: 400 })
    }

    const consumed = await query(
      "UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1 AND used_at IS NULL RETURNING id",
      [token.id]
    )
    if (!consumed.length) {
      return NextResponse.json({ error: "This verification code has already been used." }, { status: 409 })
    }

    await query(
      "UPDATE dashboard_users SET is_verified = TRUE WHERE user_id = $1 AND email = $2",
      [normUserId, normalised]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[verify-email] error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
