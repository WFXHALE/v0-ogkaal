import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }

  const supabase = await createClient()
  const normalised = email.trim().toLowerCase()

  // Look up the user
  const { data: user } = await supabase
    .from("dashboard_users")
    .select("id, email, full_name")
    .eq("email", normalised)
    .single()

  if (!user) {
    return NextResponse.json(
      { error: "No account found with that email. Please register first." },
      { status: 404 }
    )
  }

  // Generate a short-lived token (1 hour)
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await supabase
    .from("dashboard_password_resets")
    .upsert(
      { email: normalised, token, expires_at: expiresAt },
      { onConflict: "email" }
    )

  const baseUrl = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000"
  const resetLink = `${baseUrl}/dashboard/reset-password?token=${token}`

  const { error: emailError } = await resend.emails.send({
    from: "OG Kaal <noreply@ogkaal.com>",
    to: normalised,
    subject: "Reset Your Client Dashboard Password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #1a1a1a;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">OG Kaal</p>
              <p style="margin:4px 0 0;font-size:13px;color:#666666;">Client Dashboard</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">Reset your password</p>
              <p style="margin:0 0 24px;font-size:14px;color:#888888;line-height:1.6;">
                Hi ${user.full_name ?? "there"},<br/>
                We received a request to reset your Client Dashboard password. Click the button below to choose a new one.
              </p>
              <a href="${resetLink}"
                 style="display:inline-block;padding:14px 28px;background:#c9a84c;color:#0a0a0a;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
                Reset Password
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#555555;line-height:1.7;">
                This link expires in <strong style="color:#888888;">1 hour</strong>. If you didn't request a reset, you can safely ignore this email — your account remains secure.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:11px;color:#444444;">
                Can't click the button? Copy and paste this link into your browser:<br/>
                <a href="${resetLink}" style="color:#c9a84c;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })

  if (emailError) {
    console.error("[forgot-password] Resend error:", emailError)
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
