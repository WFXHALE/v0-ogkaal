"use client"

import { useEffect, useState } from "react"
import { DEFAULT_PRICING, DEFAULT_SYSTEM, type PricingConfig, type SystemConfig } from "@/lib/admin-settings"

export interface SiteConfig extends SystemConfig, PricingConfig {}

const DEFAULT_CONFIG: SiteConfig = {
  ...DEFAULT_SYSTEM,
  ...DEFAULT_PRICING,
}

function readLocalConfig(): SiteConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem("og_site_config")
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

/**
 * Returns live site config from:
 *   1. Supabase admin_settings table (authoritative, DB-backed)
 *   2. Falls back to localStorage og_site_config (written by admin panel on save)
 *   3. Falls back to hard-coded defaults
 *
 * Exposes all system toggles AND all 7 pricing plan keys.
 * Re-syncs on storage events (cross-tab) and custom og_site_config_change events (same-tab).
 */
export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(readLocalConfig)

  useEffect(() => {
    // Fetch authoritative pricing from Supabase
    import("@/lib/supabase/client")
      .then(({ createClient }) => createClient())
      .then(async (sb) => {
        const [sysRes, priceRes] = await Promise.all([
          sb.from("admin_settings").select("value").eq("key", "system_config").maybeSingle(),
          sb.from("admin_settings").select("value").eq("key", "pricing").maybeSingle(),
        ])
        const sysVal   = (sysRes.data?.value   as Partial<SystemConfig>  | null) ?? {}
        const priceVal = (priceRes.data?.value as Partial<PricingConfig> | null) ?? {}
        const merged: SiteConfig = {
          ...DEFAULT_CONFIG,
          ...sysVal,
          ...priceVal,
        }
        // Keep localStorage in sync for offline/same-tab reads
        localStorage.setItem("og_site_config", JSON.stringify(merged))
        window.dispatchEvent(new Event("og_site_config_change"))
        setConfig(merged)
      })
      .catch(() => {
        // If DB unavailable, fall back to localStorage
        setConfig(readLocalConfig())
      })

    const onStorage = (e: StorageEvent) => {
      if (e.key === "og_site_config") setConfig(readLocalConfig())
    }
    const onCustom = () => setConfig(readLocalConfig())

    window.addEventListener("storage", onStorage)
    window.addEventListener("og_site_config_change", onCustom)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("og_site_config_change", onCustom)
    }
  }, [])

  return config
}
