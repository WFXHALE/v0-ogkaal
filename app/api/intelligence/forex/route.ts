import { NextResponse } from "next/server"

// TwelveData batch quote — one API call for all symbols, conserves free tier credits
const SYMBOLS = [
  { td: "XAU/USD", symbol: "XAUUSD", name: "Gold",            metal: true  },
  { td: "XAG/USD", symbol: "XAGUSD", name: "Silver",          metal: true  },
  { td: "EUR/USD", symbol: "EURUSD", name: "EUR/USD",         metal: false },
  { td: "GBP/USD", symbol: "GBPUSD", name: "GBP/USD",         metal: false },
  { td: "USD/JPY", symbol: "USDJPY", name: "USD/JPY",         metal: false },
  { td: "USD/INR", symbol: "USDINR", name: "USD/INR",         metal: false },
  { td: "DXY",     symbol: "DXY",    name: "US Dollar Index", metal: false },
]

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function formatPrice(symbol: string, price: number, metal: boolean): string {
  if (metal) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (symbol === "EURUSD" || symbol === "GBPUSD") return price.toFixed(5)
  if (symbol === "USDJPY") return price.toFixed(3)
  return price.toFixed(2)
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, data: [], error: "TWELVE_DATA_API_KEY not set" }, { status: 500 })
  }

  try {
    // /quote returns price, open, percent_change — one credit per symbol in batch
    const tickers = SYMBOLS.map(s => s.td).join(",")
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tickers)}&apikey=${apiKey}`

    const res = await fetch(url, { next: { revalidate: 30 } })
    if (!res.ok) throw new Error(`TwelveData responded ${res.status}`)

    const json = await res.json()

    // Single symbol returns the object directly; multiple symbols returns a keyed map
    const isSingle = SYMBOLS.length === 1
    const map: Record<string, { close?: string; open?: string; percent_change?: string; status?: string }> =
      isSingle ? { [SYMBOLS[0].td]: json } : json

    const data = SYMBOLS.map(s => {
      const q = map[s.td] ?? {}
      if (q.status === "error") return null

      const price     = parseFloat(q.close ?? "0")
      const open      = parseFloat(q.open  ?? "0")
      const changePct = q.percent_change != null
        ? parseFloat(q.percent_change)
        : open > 0 ? ((price - open) / open) * 100 : 0

      return {
        symbol: s.symbol,
        name:   s.name,
        price:  price > 0 ? formatPrice(s.symbol, price, s.metal) : "-",
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changePercent: `${Math.abs(changePct).toFixed(2)}%`,
        isPositive: changePct >= 0,
        bias: bias(changePct),
      }
    }).filter(Boolean)

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[forex route]", err)
    return NextResponse.json({ success: false, data: [], error: String(err) }, { status: 500 })
  }
}
