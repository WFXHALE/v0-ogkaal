"use client"

import { useEffect, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
// Inline types here so this file has ZERO imports from admin-settings.ts.
// admin-settings.ts imports supabase/client which causes HMR module factory
// errors when loaded in the same bundle as this hook.

export interface SiteConfig {
  // Pricing
  mentorship_1:           string
  mentorship_2:           string
  crypto_mentorship:      string
  vip_signal:             string
  funded_account:         string
  vip_signal_xm_existing: string
  vip_signal_xm_new:      string
  // System
  upiEnabled:          boolean
  cryptoEnabled:       boolean
  erupeeEnabled:       boolean
  maintenanceMode:     boolean
  telegramEnabled:     boolean
  notifEnabled:        boolean
  paymentInstructions: string
}

const DEFAULT_CONFIG: SiteConfig = {
  mentorship_1:           "₹6,500",
  mentorship_2:           "₹15,000",
  crypto_mentorship:      "₹20,000",
  vip_signal:             "₹2,999",
  funded_account:         "₹5,000",
  vip_signal_xm_existing: "₹2,000",
  vip_signal_xm_new:      "₹2,500",
  upiEnabled:          true,
  cryptoEnabled:       true,
  erupeeEnabled:       true,
  maintenanceMode:     false,
  telegramEnabled:     true,
  notifEnabled:        true,
  paymentInstructions: "Pay via UPI or Crypto and upload screenshot with UTR number.",
}

/**
 * Returns live site config from /api/pricing (server-side Supabase read).
 *
 * Key guarantee: the hook NEVER reads localStorage synchronously.
 * The initial state on both server and client is always DEFAULT_CONFIG,
 * which prevents hydration mismatches. Live values load after mount via
 * useEffect, so the first paint is always consistent.
 */
export function useSiteConfig(): SiteConfig {
  // Always start with DEFAULT_CONFIG on both server and client.
  // Never use a lazy initialiser that reads localStorage — that causes
  // server/client mismatches because localStorage is browser-only.
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/pricing", { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json()
        if (json?.config) {
          setConfig(prev => ({ ...prev, ...json.config }))
        }
      } catch {
        // Network failure — keep defaults
      }
    }

    fetchConfig()

    // Re-fetch when admin saves new pricing in the same tab
    window.addEventListener("og_site_config_change", fetchConfig)
    return () => window.removeEventListener("og_site_config_change", fetchConfig)
  }, [])

  // Return defaults until mounted to guarantee server/client render parity.
  // After mount, return the fetched live config.
  return mounted ? config : DEFAULT_CONFIG
}
