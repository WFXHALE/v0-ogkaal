// Utility functions for admin submissions

export interface SubmissionData {
  type: "usdt_p2p" | "funded_account" | "mentorship" | "vip_membership" | "support" | "other"
  name: string
  email?: string
  telegram?: string
  phone?: string
  details: Record<string, unknown>
}

// ── Telegram admin alert ──────────────────────────────────────────────────────
// Fires a Telegram message to the admin chat whenever a new submission arrives.
// Never throws — failure is silent so the user flow is never interrupted.
async function notifyAdmin(data: SubmissionData): Promise<void> {
  try {
    const { type, name, email, telegram, phone, details } = data

    let text = ""

    if (type === "usdt_p2p") {
      const action = String(details.action ?? "order").toUpperCase()
      const amount = String(details.amount ?? "N/A")

      if (action === "SELL") {
        // Full sell notification with all payment details
        const upiId    = String(details.upiId    ?? "N/A")
        const upiName  = String(details.upiName  ?? details.accountHolderName ?? "N/A")
        const requestId = String(details.requestId ?? "N/A")
        const now      = new Date()
        const dateStr  = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        const timeStr  = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        text =
          `<b>New USDT SELL Request</b>\n\n` +
          `User: ${name}\n` +
          `Phone: ${phone ?? "N/A"}\n` +
          `Telegram: ${telegram ?? "N/A"}\n` +
          `Amount: ${amount}\n` +
          `UPI ID: <code>${upiId}</code>\n` +
          `UPI Name: ${upiName}\n` +
          `Date: ${dateStr}\n` +
          `Time: ${timeStr}\n` +
          `Request ID: <code>${requestId}</code>\n\n` +
          `<i>— OG KAAL TRADER Admin</i>`
      } else {
        const wallet = details.walletAddress ? `\nWallet: <code>${String(details.walletAddress)}</code>` : ""
        const utr    = details.utrNumber ? `\nUTR: <code>${String(details.utrNumber)}</code>` : ""
        text =
          `<b>New USDT ${action} Request</b>\n` +
          `User: ${name}\n` +
          `Phone: ${phone ?? "N/A"}\n` +
          `Telegram: ${telegram ?? "N/A"}\n` +
          `Amount: ${amount}${wallet}${utr}\n\n` +
          `<i>— OG KAAL TRADER Admin</i>`
      }
    } else if (type === "mentorship") {
      const program = String(details.program ?? "Mentorship")
      text =
        `<b>New Mentorship Payment</b>\n` +
        `User: ${name}\n` +
        `Phone: ${phone ?? "N/A"}\n` +
        `Telegram: ${telegram ?? "N/A"}\n` +
        `Plan: ${program}\n\n` +
        `<i>— OG KAAL TRADER Admin</i>`
    } else if (type === "vip_membership") {
      const plan      = String(details.cardType ?? "VIP")
      const utr       = details.utr ? `\nUTR: <code>${String(details.utr)}</code>` : ""
      const method    = details.paymentMethod ? `\nMethod: ${String(details.paymentMethod)}` : ""
      text =
        `<b>New VIP Payment Received</b>\n` +
        `User: ${name}\n` +
        `Phone: ${phone ?? "N/A"}\n` +
        `Telegram: ${telegram ?? "N/A"}\n` +
        `Plan: ${plan}${method}${utr}\n\n` +
        `<i>— OG KAAL TRADER Admin</i>`
    } else if (type === "funded_account") {
      const amount = String(details.accountSize ?? details.amount ?? "N/A")
      text =
        `<b>New Funded Account Request</b>\n` +
        `User: ${name}\n` +
        `Email: ${email ?? "N/A"}\n` +
        `Phone: ${phone ?? "N/A"}\n` +
        `Amount: ${amount}\n\n` +
        `<i>— OG KAAL TRADER Admin</i>`
    } else if (type === "support") {
      const issueLabel  = String(details.issueType ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
      const orderType   = String(details.mode ?? "").toUpperCase()
      const exchangeVal = String(details.exchange ?? "N/A")
      const walletVal   = details.walletAddress ? `<code>${String(details.walletAddress)}</code>` : "N/A"
      const txId        = details.transactionId  ? `<code>${String(details.transactionId)}</code>`  : "N/A"
      const utrVal      = details.utrNumber      ? `<code>${String(details.utrNumber)}</code>`       : "N/A"
      const instaVal    = String(details.instagram ?? "N/A")

      const fileUrls = details.fileUrls as Record<string, string> | undefined
      let filesSection = ""
      if (fileUrls && Object.keys(fileUrls).length > 0) {
        const labels: Record<string, string> = {
          bankStatement:    "Bank Statement",
          upiScreenshot:    "UPI Screenshot",
          screenRecording:  "Screen Recording",
          walletScreenshot: "Wallet Screenshot",
        }
        filesSection = "\n\n<b>Proof Files:</b>\n" +
          Object.entries(fileUrls)
            .map(([k, url]) => `• <a href="${url}">${labels[k] ?? k}</a>`)
            .join("\n")
      } else {
        filesSection = "\n\nProof Files: None uploaded"
      }

      text =
        `<b>New Support Request</b>\n\n` +
        `<b>Order Type:</b> ${orderType === "BUY" ? "Buy USDT" : orderType === "SELL" ? "Sell USDT" : orderType}\n` +
        `<b>Issue:</b> ${issueLabel || "N/A"}\n\n` +
        `<b>Exchange / Wallet:</b> ${exchangeVal}\n` +
        `<b>Wallet Address:</b> ${walletVal}\n` +
        `<b>Transaction ID:</b> ${txId}\n` +
        `<b>UTR Number:</b> ${utrVal}\n\n` +
        `<b>Phone:</b> ${phone ?? "N/A"}\n` +
        `<b>Email:</b> ${email ?? details.email ?? "N/A"}\n` +
        `<b>Telegram:</b> ${telegram ?? "N/A"}\n` +
        `<b>Instagram:</b> ${instaVal}` +
        filesSection +
        `\n\n<i>— OG KAAL TRADER Admin</i>`
    } else {
      text =
        `<b>New Submission</b>\n` +
        `Type: ${type}\n` +
        `User: ${name}\n` +
        `Email: ${email ?? "N/A"}\n\n` +
        `<i>— OG KAAL TRADER Admin</i>`
    }

    await fetch("/api/telegram-notify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ type: "admin_alert", message: text, _rawText: true }),
    })
  } catch {
    // Silent — never block user flow
  }
}

async function getIpInfo(): Promise<{ ip: string; city?: string; region?: string; country?: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/")
    if (res.ok) {
      const d = await res.json()
      return { ip: d.ip || "Unknown", city: d.city, region: d.region, country: d.country_name }
    }
  } catch { /* fall through */ }
  try {
    const res = await fetch("https://api.ipify.org?format=json")
    if (res.ok) {
      const d = await res.json()
      return { ip: d.ip || "Unknown" }
    }
  } catch { /* fall through */ }
  return { ip: "Unknown" }
}

export async function saveSubmission(data: SubmissionData): Promise<void> {
  const ipInfo = await getIpInfo()
  const location = [ipInfo.city, ipInfo.region, ipInfo.country].filter(Boolean).join(", ") || "Unknown"

  // Write directly to Supabase admin_submissions table via server API route.
  // Use an absolute URL so this works correctly whether called from client or SSR.
  const baseUrl =
    typeof window !== "undefined"
      ? ""  // browser — relative URL is fine
      : (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL}`
          : "http://localhost:3000")

  try {
    const res = await fetch(`${baseUrl}/api/admin/submissions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:            data.type,
        name:            data.name,
        email:           data.email          ?? null,
        phone:           data.phone          ?? null,
        telegram:        data.telegram       ?? null,
        details:         data.details,
        status:          "pending",
        ip_address:      ipInfo.ip,
        location,
        wallet_address:  String(data.details.walletAddress  ?? "") || null,
        upi_id:          String(data.details.upiId          ?? "") || null,
        inr_equivalent:  String(data.details.inrEquivalent  ?? "") || null,
        amount_paid:     String(data.details.amountPaid     ?? "") || null,
        screenshot_url:  String(data.details.screenshotUrl  ?? "") || null,
        payment_method:  String(data.details.paymentMethod  ?? "") || null,
        amount:          String(data.details.amount         ?? "") || null,
        utr:             String(data.details.utrNumber      ?? "") || null,
        user_id:         String(data.details.userId         ?? "") || null,
      }),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => res.statusText)
      console.error("[saveSubmission] API error:", res.status, errBody)
    }
  } catch (err) {
    console.error("[saveSubmission] fetch failed:", err)
  }

  // Fire Telegram admin alert in parallel (fire-and-forget)
  notifyAdmin(data)

  // Insert a notification row in admin_notifications so the admin panel badge
  // shows the new submission. Fires after the submission is saved.
  insertAdminNotification(data, baseUrl)
}

async function insertAdminNotification(data: SubmissionData, baseUrl: string): Promise<void> {
  try {
    const typeLabels: Record<string, string> = {
      usdt_p2p:       "USDT P2P",
      mentorship:     "Mentorship",
      vip_membership: "VIP Group",
      funded_account: "Funded Account",
      support:        "Support",
      other:          "Submission",
    }
    const label = typeLabels[data.type] ?? "Submission"
    const action = data.type === "usdt_p2p"
      ? ` — ${String(data.details.action ?? "order").toUpperCase()} ${String(data.details.amount ?? "")}`
      : ""

    // Map submission type to notification type expected by the admin panel
    const notifType = data.type === "usdt_p2p"
      ? (String(data.details.action ?? "buy") === "sell" ? "usdt_sell" : "usdt_buy")
      : data.type

    await fetch(`${baseUrl}/api/admin/notifications`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:    notifType,
        title:   `New ${label} Request`,
        message: `${data.name} submitted a new ${label} request${action}`,
        is_read: false,
        ref_id:  null,
      }),
    })
  } catch {
    // Silent — never block user flow
  }
}
