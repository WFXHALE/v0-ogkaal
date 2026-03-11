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
      const wallet = details.walletAddress ? `\nWallet: <code>${String(details.walletAddress)}</code>` : ""
      const utr    = details.utrNumber ? `\nUTR: <code>${String(details.utrNumber)}</code>` : ""
      text =
        `<b>⚡ New USDT ${action} Request</b>\n` +
        `User: ${name}\n` +
        `Phone: ${phone ?? "N/A"}\n` +
        `Telegram: ${telegram ?? "N/A"}\n` +
        `Amount: ${amount}${wallet}${utr}\n\n` +
        `<i>— OG KAAL TRADER Admin</i>`
    } else if (type === "mentorship") {
      const program = String(details.program ?? "Mentorship")
      text =
        `<b>📚 New Mentorship Payment</b>\n` +
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
        `<b>💎 New VIP Payment Received</b>\n` +
        `User: ${name}\n` +
        `Phone: ${phone ?? "N/A"}\n` +
        `Telegram: ${telegram ?? "N/A"}\n` +
        `Plan: ${plan}${method}${utr}\n\n` +
        `<i>— OG KAAL TRADER Admin</i>`
    } else if (type === "funded_account") {
      const amount = String(details.accountSize ?? details.amount ?? "N/A")
      text =
        `<b>💰 New Funded Account Request</b>\n` +
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

      // File links
      const fileUrls = details.fileUrls as Record<string, string> | undefined
      let filesSection = ""
      if (fileUrls && Object.keys(fileUrls).length > 0) {
        const labels: Record<string, string> = {
          bankStatement:   "Bank Statement",
          upiScreenshot:   "UPI Screenshot",
          screenRecording: "Screen Recording",
          walletScreenshot:"Wallet Screenshot",
        }
        filesSection = "\n\n<b>Proof Files:</b>\n" +
          Object.entries(fileUrls)
            .map(([k, url]) => `• <a href="${url}">${labels[k] ?? k}</a>`)
            .join("\n")
      } else {
        filesSection = "\n\nProof Files: None uploaded"
      }

      text =
        `<b>🚨 New Support Request</b>\n\n` +
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
        `<b>📬 New Submission</b>\n` +
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

interface IpInfo {
  ip: string
  city?: string
  region?: string
  country?: string
}

async function getIpInfo(): Promise<IpInfo> {
  try {
    const response = await fetch("https://ipapi.co/json/")
    if (response.ok) {
      const data = await response.json()
      return {
        ip: data.ip || "Unknown",
        city: data.city,
        region: data.region,
        country: data.country_name
      }
    }
  } catch {
    // Fallback to another service
    try {
      const response = await fetch("https://api.ipify.org?format=json")
      if (response.ok) {
        const data = await response.json()
        return { ip: data.ip || "Unknown" }
      }
    } catch {
      // Silent fail
    }
  }
  return { ip: "Unknown" }
}

export async function saveSubmission(data: SubmissionData): Promise<void> {
  const ipInfo = await getIpInfo()
  
  const location = [ipInfo.city, ipInfo.region, ipInfo.country]
    .filter(Boolean)
    .join(", ") || "Unknown Location"

  const submission = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...data,
    status: "pending" as const,
    ipAddress: ipInfo.ip,
    location,
    createdAt: new Date().toISOString()
  }

  // Get existing submissions
  const existing = localStorage.getItem("og_admin_submissions")
  const submissions = existing ? JSON.parse(existing) : []
  
  // Add new submission at the beginning
  submissions.unshift(submission)
  
  // Save back to localStorage
  localStorage.setItem("og_admin_submissions", JSON.stringify(submissions))

  // Notify admin via Telegram (fire-and-forget)
  notifyAdmin(data)
}
