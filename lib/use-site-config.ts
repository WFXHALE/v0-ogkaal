"use client"

import { useEffect, useState, useRef } from "react"
import { DEFAULT_PRICING, DEFAULT_SYSTEM, type PricingConfig, type SystemConfig } from "@/lib/admin-settings"

export interface SiteConfig extends SystemConfig, PricingConfig {}

const DEFAULT_CONFIG: SiteConfig = {
  ...DEFAULT_SYSTEM,
  ...DEFAULT_PRICING,
}

/**
 * Returns live site config (system settings + pricing) from the database.
 *
 * Fetch priority:
 *   1. GET /api/pricing  — server-side Supabase read (authoritative, no localStorage)
 *   2. Falls back to hard-coded DEFAULT_CONFIG if the network request fails
 *
 * The admin panel writes pricing to Supabase via savePricing() and then fires
 * "og_site_config_change" so any open frontend tab re-fetches from /api/pricing.
 */
export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const fetchedRef = useRef(false)

  const fetchFromApi = async () => {
    try {
      const res = await fetch("/api/pricing", { cache: "no-store" })
      const json = await res.json()
      if (json?.config) {
        const merged: SiteConfig = { ...DEFAULT_CONFIG, ...json.config }
        setConfig(merged)
      }
    } catch {
      // Network failure — keep current state (defaults or prior fetch)
    }
  }

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchFromApi()
    }

    // Re-fetch when the admin panel saves new pricing (same tab)
    const onCustom = () => fetchFromApi()
    window.addEventListener("og_site_config_change", onCustom)
    return () => window.removeEventListener("og_site_config_change", onCustom)
  }, [])

  return config
}
