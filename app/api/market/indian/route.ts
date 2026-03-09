import { NextResponse } from "next/server"

// TwelveData: NSE indices — NIFTY 50 (NIFTY) and Bank NIFTY (BANKNIFTY) on NSE exchange
const INDICES = [
  { td: "NIFTY",     exchange: "NSE", symbol: "NIFTY50",   name: "NIFTY 50"   },
  { td: "BANKNIFTY", exchange: "NSE", symbol: "BANKNIFTY", name: "Bank NIFTY" },
]

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.3) return "Bullish"
  if (pct < -0.3) return "Bearish"
  return "Neutral"
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, data: [], error: "TWELVE_DATA_API_KEY not set" }, { status: 500 })
  }

  try {
    // Batch quote: symbol:exchange format, comma-separated
    const tickers = INDICES.map(i => `${i.td}:${i.exchange}`).join(",")
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tickers)}&apikey=${apiKey}`

    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`TwelveData responded ${res.status}`)

    const json = await res.json()

    const data = INDICES.map(idx => {
      const key = `${idx.td}:${idx.exchange}`
      const q = json[key] ?? json[idx.td] ?? {}
      if (q.status === "error") return null

      const price     = parseFloat(q.close ?? "0")
      const changePct = parseFloat(q.percent_change ?? "0")
      if (!price) return null

      return {
        symbol: idx.symbol,
        name:   idx.name,
        price:  `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changePercent: `${Math.abs(changePct).toFixed(2)}%`,
        isPositive: changePct >= 0,
        bias: bias(changePct),
      }
    }).filter(Boolean)

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[indian market route]", err)
    return NextResponse.json({ success: false, data: [], error: String(err) }, { status: 500 })
  }
}
