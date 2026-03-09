import { NextResponse } from "next/server"

// All 7 symbols fetched from Stooq — free, no API key, matches TradingView/interbank
// Stooq CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
const SYMBOLS = [
  { stooq: "xauusd",   symbol: "XAUUSD", name: "Gold",            metal: true  },
  { stooq: "xagusd",   symbol: "XAGUSD", name: "Silver",          metal: true  },
  { stooq: "eurusd",   symbol: "EURUSD", name: "EUR/USD",         metal: false },
  { stooq: "gbpusd",   symbol: "GBPUSD", name: "GBP/USD",         metal: false },
  { stooq: "usdjpy",   symbol: "USDJPY", name: "USD/JPY",         metal: false },
  { stooq: "usdinr",   symbol: "USDINR", name: "USD/INR",         metal: false },
  { stooq: "dx-y.nyb", symbol: "DXY",   name: "US Dollar Index", metal: false },
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

async function fetchStooq(stooq: string): Promise<{ price: number; open: number } | null> {
  try {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooq)}&f=sd2t2ohlcv&e=csv`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.trim().split("\n")
    if (lines.length < 2) return null
    const cols  = lines[1].split(",")
    // cols: Symbol, Date, Time, Open, High, Low, Close, Volume
    const open  = parseFloat(cols[3])
    const close = parseFloat(cols[6])
    if (!close || isNaN(close) || close === 0) return null
    return { price: close, open: isNaN(open) || open === 0 ? close : open }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const results = await Promise.all(SYMBOLS.map(s => fetchStooq(s.stooq)))

    const data = SYMBOLS.map((s, i) => {
      const q = results[i]
      const price     = q?.price ?? 0
      const open      = q?.open  ?? price
      const changePct = open > 0 ? ((price - open) / open) * 100 : 0

      return {
        symbol: s.symbol,
        name:   s.name,
        price:  price > 0 ? formatPrice(s.symbol, price, s.metal) : "-",
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changePercent: `${Math.abs(changePct).toFixed(2)}%`,
        isPositive: changePct >= 0,
        bias: bias(changePct),
      }
    })

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[forex route]", err)
    return NextResponse.json(
      { success: false, data: [], error: String(err) },
      { status: 500 }
    )
  }
}
