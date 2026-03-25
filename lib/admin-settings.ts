/**
 * Admin settings — reads and writes via /api/admin/settings (service-role).
 *
 * The anon Supabase client cannot read or write the admin_settings table
 * because the RLS policy only allows admin access. All reads/writes now go
 * through the /api/admin/settings API route which uses the service-role key
 * on the server, bypassing RLS correctly.
 */

export type SystemConfig = {
  upiEnabled: boolean
  cryptoEnabled: boolean
  erupeeEnabled: boolean
  maintenanceMode: boolean
  telegramEnabled: boolean
  notifEnabled: boolean
  paymentInstructions: string
}

export type PricingConfig = {
  mentorship_1: string
  mentorship_2: string
  crypto_mentorship: string
  vip_signal: string
  funded_account: string
  vip_signal_xm_existing: string
  vip_signal_xm_new: string
}

export const DEFAULT_PRICING: PricingConfig = {
  mentorship_1:            "₹6,500",
  mentorship_2:            "₹15,000",
  crypto_mentorship:       "₹20,000",
  vip_signal:              "₹2,999",
  funded_account:          "₹5,000",
  vip_signal_xm_existing:  "₹2,000",
  vip_signal_xm_new:       "₹2,500",
}

export const DEFAULT_SYSTEM: SystemConfig = {
  upiEnabled:          true,
  cryptoEnabled:       true,
  erupeeEnabled:       true,
  maintenanceMode:     false,
  telegramEnabled:     true,
  notifEnabled:        true,
  paymentInstructions: "Pay via UPI or Crypto and upload screenshot with UTR number.",
}

// ── Generic helpers — call the server-side API route ─────────────────────────

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const res = await fetch("/api/admin/settings", { cache: "no-store" })
    if (!res.ok) return fallback
    const json = await res.json()
    if (json?.data?.[key]) return json.data[key] as T
  } catch { /* network failure — return defaults */ }
  return fallback
}

async function setSetting<T extends object>(key: string, value: T): Promise<void> {
  try {
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ key, value }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error("[admin-settings] setSetting failed:", err)
    }
  } catch (err) {
    console.error("[admin-settings] setSetting network error:", err)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const loadSystemConfig = () => getSetting<SystemConfig>("system_config", DEFAULT_SYSTEM)
export const saveSystemConfig = (v: SystemConfig)  => setSetting("system_config", v)

export const loadPricing      = () => getSetting<PricingConfig>("pricing", DEFAULT_PRICING)
export const savePricing      = (v: PricingConfig) => setSetting("pricing", v)

export const loadAdminProfile = () =>
  getSetting<{ name: string; phone: string }>("admin_profile", { name: "", phone: "" })
export const saveAdminProfile = (v: { name: string; phone: string }) =>
  setSetting("admin_profile", v)

/**
 * Load all settings in a single request — more efficient than 3 separate calls.
 */
export async function loadAllSettings(): Promise<{
  system:  SystemConfig
  pricing: PricingConfig
  profile: { name: string; phone: string }
}> {
  try {
    const res = await fetch("/api/admin/settings", { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const d = json?.data ?? {}
    return {
      system:  { ...DEFAULT_SYSTEM,  ...(d.system_config  ?? {}) },
      pricing: { ...DEFAULT_PRICING, ...(d.pricing        ?? {}) },
      profile: { name: "", phone: "", ...(d.admin_profile ?? {}) },
    }
  } catch {
    return { system: DEFAULT_SYSTEM, pricing: DEFAULT_PRICING, profile: { name: "", phone: "" } }
  }
}
