export function escapeTelegramHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export async function sendAdminTelegramAlert(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID || "8197983781"
  if (!botToken || !chatId || !message.trim()) return

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    cache: "no-store",
  })
  const payload = await response.json() as { ok?: boolean; description?: string }
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || `Telegram request failed with HTTP ${response.status}`)
  }
}
