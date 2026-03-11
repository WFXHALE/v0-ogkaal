import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const OTP_TTL_MINUTES   = 15
const MAX_OTP_PER_DAY   = 5
const DAILY_WINDOW_HRS  = 24

// Crypto-secure 6-digit OTP
function generateOtp(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1_000_000).padStart(6, "0")
}

async function hashOtp(otp: string): Promise<string> {
  const buf  = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(otp))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

// POST /api/dashboard/forgot-password — send OTP to email
export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const supabase   = await createClient()
    const normalised = email.trim().toLowerCase()

    const { data: user } = await supabase
      .from("dashboard_users")
      .select("id, email, full_name, otp_attempts_today, otp_attempts_reset_at")
      .eq("email", normalised)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      )
    }

    // Daily rate-limit
    const now        = Date.now()
    const resetAt    = user.otp_attempts_reset_at ? new Date(user.otp_attempts_reset_at).getTime() : 0
    const windowMs   = DAILY_WINDOW_HRS * 60 * 60 * 1000
    const attemptsToday = resetAt && (now - resetAt) < windowMs ? (user.otp_attempts_today ?? 0) : 0

    if (attemptsToday >= MAX_OTP_PER_DAY) {
      return NextResponse.json(
        { error: `Too many requests. You can request a new OTP up to ${MAX_OTP_PER_DAY} times per day.` },
        { status: 429 }
      )
    }

    const otp       = generateOtp()
    const otpHash   = await hashOtp(otp)
    const expiresAt = new Date(now + OTP_TTL_MINUTES * 60 * 1000).toISOString()

    await supabase
      .from("dashboard_users")
      .update({
        otp_hash:             otpHash,
        otp_expires_at:       expiresAt,
        otp_attempts_today:   attemptsToday + 1,
        otp_attempts_reset_at: resetAt && (now - resetAt) < windowMs
          ? user.otp_attempts_reset_at
          : new Date(now).toISOString(),
      })
      .eq("id", user.id)

    const { error: emailErr } = await resend.emails.send({
      from:    "noreply@ogkaal.com",
      to:      normalised,
      subject: "Your OG KAAL Password Reset Code",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr>
          <td style="padding:28px 36px 20px;border-bottom:1px solid #1a1a1a;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">OG KAAL</p>
            <p style="margin:3px 0 0;font-size:12px;color:#666;">Client Dashboard</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#fff;">Password Reset OTP</p>
            <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.6;">
              Hi ${user.full_name ?? "there"},<br/>use the code below to reset your password. It expires in <strong style="color:#aaa;">${OTP_TTL_MINUTES} minutes</strong>.
            </p>
            <div style="text-align:center;margin:0 0 24px;">
              <span style="display:inline-block;padding:16px 32px;background:#c9a84c;color:#0a0a0a;font-size:32px;font-weight:800;border-radius:12px;letter-spacing:8px;font-family:monospace;">
                ${otp}
              </span>
            </div>
            <p style="margin:0;font-size:12px;color:#555;line-height:1.7;">
              If you did not request this, ignore this email — your account remains secure.<br/>
              Do <strong style="color:#888;">not</strong> share this code with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;border-top:1px solid #1a1a1a;">
            <p style="margin:0;font-size:11px;color:#444;">OG KAAL &middot; This is an automated message.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    })

    if (emailErr) {
      console.error("[forgot-password] Resend error:", emailErr)
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[forgot-password] Unexpected error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}

// PUT /api/dashboard/forgot-password — verify OTP and set new password
export async function PUT(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP and new password are required." }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const supabase   = await createClient()
    const normalised = email.trim().toLowerCase()

    const { data: user } = await supabase
      .from("dashboard_users")
      .select("id, otp_hash, otp_expires_at")
      .eq("email", normalised)
      .single()

    if (!user || !user.otp_hash || !user.otp_expires_at) {
      return NextResponse.json({ error: "No OTP request found. Please request a new code." }, { status: 400 })
    }

    if (new Date(user.otp_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new code." }, { status: 400 })
    }

    const inputHash = await hashOtp(otp.trim())
    if (inputHash !== user.otp_hash) {
      return NextResponse.json({ error: "Incorrect code. Please check and try again." }, { status: 400 })
    }

    // Hash the new password using the same SHA-256 approach as hashPassword() in dash-auth
    const pwBuf  = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(newPassword))
    const pwHash = Array.from(new Uint8Array(pwBuf)).map(b => b.toString(16).padStart(2, "0")).join("")

    const { error: updateErr } = await supabase
      .from("dashboard_users")
      .update({
        password_hash:  pwHash,
        otp_hash:       null,
        otp_expires_at: null,
      })
      .eq("id", user.id)

    if (updateErr) {
      console.error("[forgot-password] Update error:", updateErr)
      return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[forgot-password] Unexpected error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
