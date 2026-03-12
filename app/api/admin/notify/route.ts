import { NextRequest, NextResponse } from "next/server"

// Status → user-facing message map
const STATUS_MESSAGES: Record<string, string> = {
  approved:  "Your request has been approved and payment is under process.",
  rejected:  "Your request has been rejected.",
  completed: "Payment completed successfully. Thank you!",
}

export async function POST(req: NextRequest) {
  const { status, userName, userEmail, userTelegram, requestType, amount } =
    await req.json() as {
      status:        string
      userName?:     string
      userEmail?:    string
      userTelegram?: string
      requestType?:  string
      amount?:       string
    }

  const message = STATUS_MESSAGES[status]
  if (!message) return NextResponse.json({ ok: false, error: "Unknown status" }, { status: 400 })

  const label    = requestType ? `[${String(requestType).toUpperCase()}] ` : ""
  const amtLine  = amount ? `\nAmount: ${amount}` : ""
  const fullText =
    `<b>OG KAAL TRADER — Update</b>\n\n` +
    `${label}Status: <b>${status.toUpperCase()}</b>${amtLine}\n\n` +
    `${message}\n\n<i>— OG KAAL Admin</i>`

  const results: { channel: string; ok: boolean; error?: string }[] = []

  // ── Telegram ──────────────────────────────────────────────────────────────────
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (botToken && userTelegram) {
    // Strip leading @ if present, use as chat username or numeric ID
    const chatId = userTelegram.startsWith("@") ? userTelegram : `@${userTelegram}`
    try {
      const res  = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chat_id: chatId, text: fullText, parse_mode: "HTML" }),
      })
      const json = (await res.json()) as { ok: boolean; description?: string }
      results.push({ channel: "telegram", ok: json.ok, error: json.description })
    } catch (err) {
      results.push({ channel: "telegram", ok: false, error: String(err) })
    }
  }

  // ── Email via Resend ──────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && userEmail) {
    try {
      const emailHtml = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0B0E11;color:#f0f0f0;border-radius:12px;">
          <h2 style="color:#FCD535;margin-bottom:8px;">OG KAAL TRADER</h2>
          <p style="font-size:14px;color:#aaa;">${label}Status update</p>
          <div style="background:#1a1d21;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="font-size:18px;font-weight:700;color:#FCD535;margin:0 0 8px;">${status.toUpperCase()}</p>
            ${amount ? `<p style="color:#aaa;margin:0 0 8px;">Amount: ${amount}</p>` : ""}
            <p style="color:#ddd;margin:0;">${message}</p>
          </div>
          <p style="font-size:12px;color:#666;">— OG KAAL Admin Team</p>
        </div>`

      const res = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    "OG KAAL TRADER <noreply@ogkaal.com>",
          to:      [userEmail],
          subject: `Your ${requestType ?? "request"} status: ${status.toUpperCase()}`,
          html:    emailHtml,
        }),
      })
      const json = (await res.json()) as { id?: string; error?: { message?: string } }
      results.push({ channel: "email", ok: res.ok, error: json.error?.message })
    } catch (err) {
      results.push({ channel: "email", ok: false, error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, results })
}
