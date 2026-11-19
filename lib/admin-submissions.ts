// Utility functions for admin submissions

export interface SubmissionData {
  type: "usdt_p2p" | "funded_account" | "mentorship" | "vip_membership" | "support" | "other"
  name: string
  email?: string
  telegram?: string
  phone?: string
  details: Record<string, unknown>
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

  // Insert a notification row in admin_notifications so the admin panel badge
  // shows the new submission. Fires after the submission is saved.
}
