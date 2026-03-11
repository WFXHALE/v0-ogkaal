// Library for reading/writing admin settings to Supabase admin_settings table
// Uses the browser Supabase client since this is called from the admin panel (client-side).

import { createClient } from "@/lib/supabase/client"

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
  mentorship_1:           "₹6,500",
  mentorship_2:           "₹15,000",
  crypto_mentorship:      "₹20,000",
  vip_signal:             "₹2,999",
  funded_account:         "₹5,000",
  vip_signal_xm_existing: "₹2,000",
  vip_signal_xm_new:      "₹2,500",
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

// ── Generic helpers ─────────────────────────────────────────────────────────

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
    if (data?.value) return data.value as T
  } catch { /* silent */ }
  return fallback
}

async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const supabase = createClient()
    await supabase
      .from("admin_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
  } catch { /* silent */ }
}

// ── Public API ───────────────────────────────────────────────────────────────

export const loadSystemConfig  = () => getSetting<SystemConfig>("system_config", DEFAULT_SYSTEM)
export const saveSystemConfig  = (v: SystemConfig)  => setSetting("system_config", v)

export const loadPricing       = () => getSetting<PricingConfig>("pricing", DEFAULT_PRICING)
export const savePricing       = (v: PricingConfig) => setSetting("pricing", v)

export const loadAdminProfile  = () => getSetting<{ name: string; phone: string }>("admin_profile", { name: "", phone: "" })
export const saveAdminProfile  = (v: { name: string; phone: string }) => setSetting("admin_profile", v)
