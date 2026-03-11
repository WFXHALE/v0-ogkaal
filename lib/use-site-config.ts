"use client"

import { useEffect, useState } from "react"

export interface SiteConfig {
  upiEnabled: boolean
  cryptoEnabled: boolean
  erupeeEnabled: boolean
  vipPrice: string
  mentorshipPrice: string
  maintenanceMode: boolean
  paymentInstructions: string
  telegramEnabled: boolean
  notifEnabled: boolean
}

const DEFAULT_CONFIG: SiteConfig = {
  upiEnabled: true,
  cryptoEnabled: true,
  erupeeEnabled: true,
  vipPrice: "₹2,999",
  mentorshipPrice: "₹4,999",
  maintenanceMode: false,
  paymentInstructions: "Pay via UPI or Crypto and upload screenshot with UTR number.",
  telegramEnabled: true,
  notifEnabled: true,
}

function readConfig(): SiteConfig {
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
 * Reads og_site_config from localStorage (written by admin-panel)
 * and re-syncs whenever the storage event fires (cross-tab) or
 * whenever the component mounts.
 */
export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    setConfig(readConfig())

    const onStorage = (e: StorageEvent) => {
      if (e.key === "og_site_config") {
        setConfig(readConfig())
      }
    }

    // Also handle same-tab updates via a custom event
    const onSiteConfigChange = () => setConfig(readConfig())

    window.addEventListener("storage", onStorage)
    window.addEventListener("og_site_config_change", onSiteConfigChange)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("og_site_config_change", onSiteConfigChange)
    }
  }, [])

  return config
}
