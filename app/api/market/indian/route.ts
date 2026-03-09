import { NextResponse } from "next/server"

// Stooq: free, no API key, no rate-limit issues, covers Indian indices
const STOOQ_INDICES = [
  { symbol: "NIFTY50",   name: "NIFTY 50",   stooq: "^nf50.in"    },
  { symbol: "BANKNIFTY", name: "Bank NIFTY", stooq: "^nsebank.in" },
]

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.3) return "Bullish"
  if (pct < -0.3) return "Bearish"
  return "Neutral"
}


async function fetchStooq(stooqSymbol: string): Promise<{ price: number; open: number } | null> {
  try {
    // Stooq CSV endpoint: returns date,open,high,low,close,volume
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&e=csv`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.trim().split("\n")
    if (lines.length < 2) return null
    // Header: Symbol,Date,Time,Open,High,Low,Close,Volume
    const cols = lines[1].split(",")
    const open  = parseFloat(cols[3])
    const close = parseFloat(cols[6])
    if (!close || isNaN(close)) return null
    return { price: close, open: isNaN(open) ? close : open }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const stooqResults = await Promise.all(STOOQ_INDICES.map(i => fetchStooq(i.stooq)))

    const data = STOOQ_INDICES.map((idx, i) => {
      const q = stooqResults[i]
      if (!q) return null
      const { price, open } = q
      const changePct = open !== 0 ? ((price - open) / open) * 100 : 0
      return {
        symbol: idx.symbol,
        name: idx.name,
        price: `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changePercent: `${Math.abs(changePct).toFixed(2)}%`,
        isPositive: changePct >= 0,
        bias: bias(changePct),
      }
    }).filter(Boolean)

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[indian market route]", err)
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch Indian market data" },
      { status: 500 }
    )
  }
}
