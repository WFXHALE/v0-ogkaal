// Material access store — auth + purchases persisted in localStorage

const SESSION_KEY   = "og_community_session"
const PURCHASES_KEY = "og_material_purchases"

export type MaterialId = "smc-advanced" | "ict-advanced" | "price-action-advanced"

export interface MaterialMeta {
  id: MaterialId
  title: string
  price: number        // in INR
  description: string
}

export const ADVANCED_MATERIALS: MaterialMeta[] = [
  {
    id: "smc-advanced",
    title: "SMC Advanced",
    price: 1000,
    description: "Deep dive into Smart Money Concepts — institutional order flow, liquidity sweeps, and advanced entry models.",
  },
  {
    id: "ict-advanced",
    title: "ICT Advanced",
    price: 1500,
    description: "Master ICT methodology — power of three, optimal trade entry, PD arrays, and killzone strategies.",
  },
  {
    id: "price-action-advanced",
    title: "Price Action Advanced",
    price: 2000,
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

export function recordPurchase(id: MaterialId): void {
  const list = readPurchases()
  if (!list.includes(id)) writePurchases([...list, id])
}
