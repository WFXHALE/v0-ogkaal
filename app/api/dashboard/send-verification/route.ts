import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { query, queryOne } from "@/lib/db"

const TOKEN_TTL_MINUTES   = 30
const MAX_RESENDS_PER_DAY = 5
const RESEND_WINDOW_HRS   = 24

function generateOtp(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1_000_000).padStart(6, "0")
}

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { email, userId } = await req.json() as { email?: string; userId?: string }

    if (!email || !userId) {
      return NextResponse.json({ error: "email and userId are required." }, { status: 400 })
    }

    const normalised  = email.trim().toLowerCase()
    const normUserId  = userId.trim().toLowerCase()

    const user = await queryOne<{ id: string; full_name: string; is_verified: boolean }>(
      "SELECT id, full_name, is_verified FROM dashboard_users WHERE user_id = $1",
      [normUserId]
    )

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 })
    if (user.is_verified) return NextResponse.json({ error: "Email is already verified." }, { status: 409 })

    // Rate-limit: max MAX_RESENDS_PER_DAY per day
    const windowStart = new Date(Date.now() - RESEND_WINDOW_HRS * 60 * 60 * 1000).toISOString()
    const countRows   = await query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM email_verification_tokens WHERE user_id = $1 AND created_at >= $2",
      [normUserId, windowStart]
    )
    const count = parseInt(countRows[0]?.count ?? "0", 10)
    if (count >= MAX_RESENDS_PER_DAY) {
      return NextResponse.json(
        { error: `Too many verification emails. Try again in ${RESEND_WINDOW_HRS} hours.` },
        { status: 429 }
      )
    }

    // Invalidate existing unused tokens
    await query(
      "DELETE FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL",
      [normUserId]
    )

    const otp       = generateOtp()
    const tokenHash = await hashToken(otp)
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString()

    await query(
      `INSERT INTO email_verification_tokens (user_id, email, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [normUserId, normalised, tokenHash, expiresAt]
    )

    const { error: emailErr } = await resend.emails.send({
      from:    "noreply@ogkaal.com",
      to:      normalised,
      subject: "Verify your OG KAAL account",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="padding:28px 36px 20px;border-bottom:1px solid #1a1a1a;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">OG KAAL</p>
          <p style="margin:3px 0 0;font-size:12px;color:#666;">Email Verification</p>
        </td></tr>
        <tr><td style="padding:28px 36px;">
          <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#fff;">Verify Your Email</p>
          <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.6;">
            Hi ${user.full_name ?? "there"},<br/>
            Enter the code below to verify your email address. It expires in <strong style="color:#aaa;">${TOKEN_TTL_MINUTES} minutes</strong>.
          </p>
          <div style="text-align:center;margin:0 0 24px;">
            <span style="display:inline-block;padding:16px 32px;background:#FCD535;color:#0a0a0a;font-size:32px;font-weight:800;border-radius:12px;letter-spacing:8px;font-family:monospace;">
              ${otp}
            </span>
          </div>
          <p style="margin:0;font-size:12px;color:#555;line-height:1.7;">
            If you did not create an OG KAAL account, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding:16px 36px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;font-size:11px;color:#444;">OG KAAL &middot; This is an automated message.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    })

    if (emailErr) {
      console.error("[send-verification] Resend error:", emailErr)
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-verification] error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
