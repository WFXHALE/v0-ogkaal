import { NextRequest, NextResponse } from "next/server"

// ── IMPORTANT: env vars MUST be read inside the handler, not at module level.
// Reading at module level captures `undefined` at build time in Next.js.

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; chatId: string; error?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    })
    const json = await res.json() as { ok: boolean; description?: string }
    if (!json.ok) return { ok: false, chatId, error: json.description }
    return { ok: true, chatId }
  } catch (err) {
    return { ok: false, chatId, error: String(err) }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Read env vars fresh on every request — never at module scope
    const botToken  = process.env.TELEGRAM_BOT_TOKEN
    const chatIdEnv = process.env.TELEGRAM_CHAT_ID || "8197983781"

    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured. Add it in project environment variables." },
        { status: 500 },
      )
    }

    const { type, title, body, message, chatId: overrideChatId, _rawText, userChatId } = await req.json() as {
      type?: string
      title?: string
      body?: string
      message?: string
      chatId?: string
      _rawText?: boolean     // if true, use `message` as-is (pre-built HTML)
      userChatId?: string    // send to this specific user chat (for user notifications)
    }

    // ── Build the message text ────────────────────────────────────────────
    let text: string
    if (_rawText && message) {
      // Pre-built HTML — use directly (admin_alert from admin-submissions.ts)
      text = message
    } else if (type === "test") {
      text = `<b>OG KAAL TRADER — Test Notification</b>\n\n${message || "Bot connection verified. Integration is working."}\n\n<i>Sent from Admin Panel</i>`
    } else {
      const notifTitle = title   || "Admin Notification"
      const notifBody  = body    || message || ""
      text = `<b>OG KAAL TRADER</b>\n\n<b>${notifTitle}</b>\n${notifBody}\n\n<i>— Admin Panel Broadcast</i>`
    }

    // ── Determine targets ─────────────────────────────────────────────────
    const targets = new Set<string>()

    if (userChatId) {
      // User-directed notification (approval/rejection) — send only to the user
      targets.add(userChatId)
    } else if (type === "admin_alert") {
      // New submission alert — send only to admin chat
      targets.add(chatIdEnv)
    } else if (type === "test") {
      // Test — send to override or admin chat
      targets.add(overrideChatId || chatIdEnv)
    } else {
      // Broadcast — send to override or admin chat; also channel if configured separately
      const primaryTarget = overrideChatId || chatIdEnv
      targets.add(primaryTarget)
      if (chatIdEnv !== "8197983781") targets.add(chatIdEnv)
    }

    // ── Send to all targets ───────────────────────────────────────────────
    const results = await Promise.all(
      Array.from(targets).map(id => sendTelegramMessage(botToken, id, text))
    )
    const failed  = results.filter(r => !r.ok)
    const success = results.filter(r => r.ok)

    if (success.length === 0) {
      return NextResponse.json(
        { ok: false, error: failed[0]?.error, details: failed },
        { status: 502 },
      )
    }

    if (failed.length > 0) {
      // Partial — at least one succeeded
      return NextResponse.json({ ok: true, partial: true, sent: success.length, errors: failed.map(f => f.error) })
    }

    return NextResponse.json({ ok: true, sent: success.length })
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal server error", detail: String(err) }, { status: 500 })
  }
}
