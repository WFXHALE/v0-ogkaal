"use client"

// Material access store — auth + purchases persisted in localStorage

const SESSION_KEY    = "og_community_session"
const PURCHASES_KEY  = "og_material_purchases"
const PENDING_KEY    = "og_material_pending"

export type MaterialId = "smc-advanced" | "ict-advanced" | "price-action-advanced"

export interface MaterialMeta {
  id: MaterialId
  title: string
  priceINR: number   // INR price (UPI / IMPS)
  priceUSD: number   // USD price (Crypto / USDT)
  description: string
}

export const ADVANCED_MATERIALS: MaterialMeta[] = [
  {
    id: "smc-advanced",
    title: "SMC Advanced",
    priceINR: 1000,
    priceUSD: 10,
    description: "Deep dive into Smart Money Concepts — institutional order flow, liquidity sweeps, and advanced entry models.",
  },
  {
    id: "ict-advanced",
    title: "ICT Advanced",
    priceINR: 1500,
    priceUSD: 17,
    description: "Master ICT methodology — power of three, optimal trade entry, PD arrays, and killzone strategies.",
  },
  {
    id: "price-action-advanced",
    title: "Price Action Advanced",
    priceINR: 2000,
    priceUSD: 22,
    description: "Advanced price action — multi-timeframe confluence, supply/demand mastery, and high-probability setups.",
  },
]

// ---- helpers ----------------------------------------------------------------

function readPurchases(): MaterialId[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(PURCHASES_KEY) || "[]") } catch { return [] }
}
function writePurchases(p: MaterialId[]) {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(p))
}

function readPending(): MaterialId[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]") } catch { return [] }
}
function writePending(p: MaterialId[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(p))
}

// ---- public API -------------------------------------------------------------

export function getSession(): { id: string; fullName: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function hasPurchased(id: MaterialId): boolean {
  return readPurchases().includes(id)
}

export function isPending(id: MaterialId): boolean {
  return readPending().includes(id)
}

export function recordPurchase(id: MaterialId): void {
  const list = readPurchases()
  if (!list.includes(id)) writePurchases([...list, id])
  // Remove from pending if it was there
  writePending(readPending().filter((x) => x !== id))
}

export function recordPending(id: MaterialId): void {
  const list = readPending()
  if (!list.includes(id)) writePending([...list, id])
}
