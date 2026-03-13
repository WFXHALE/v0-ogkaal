import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

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

    if (!email || !userId || !otp) {
      return NextResponse.json({ error: "email, userId and otp are required." }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()
    const normUserId = userId.trim().toLowerCase()
    const inputHash  = await hashToken(otp.trim())

    const token = await queryOne<{
      id: string
      token_hash: string
      expires_at: string
      used_at: string | null
    }>(
      `SELECT id, token_hash, expires_at, used_at
       FROM email_verification_tokens
       WHERE user_id = $1 AND email = $2 AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [normUserId, normalised]
    )

    if (!token) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      )
    }

    if (new Date(token.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    if (token.token_hash !== inputHash) {
      return NextResponse.json({ error: "Incorrect code. Please check and try again." }, { status: 400 })
    }

    // Mark token as used
    await query(
      "UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1",
      [token.id]
    )

    // Mark user as verified
    await query(
      "UPDATE dashboard_users SET is_verified = TRUE WHERE user_id = $1",
      [normUserId]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[verify-email] error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
