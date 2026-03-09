import { NextResponse } from "next/server"

// Source: Stooq.com — free, no API key, interbank/CME quotes that match TradingView
// Symbols: xauusd (Gold spot), xagusd (Silver spot), eurusd, gbpusd, usdjpy, usdinr, dx-y.nyb (DXY)

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function fmtFx(symbol: string, price: number): string {
  if (["EURUSD", "GBPUSD"].includes(symbol)) return price.toFixed(5)
  if (symbol === "USDJPY") return price.toFixed(3)
  if (symbol === "USDINR") return price.toFixed(2)
  if (symbol === "DXY") return price.toFixed(2)
  return price.toFixed(2)
}

function fmtMetal(price: number): string {
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function makeRow(symbol: string, name: string, price: number, changePct: number, isMetal = false) {
  return {
    symbol,
    name,
    price: price > 0 ? (isMetal ? fmtMetal(price) : fmtFx(symbol, price)) : "-",
    change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
    changePercent: `${Math.abs(changePct).toFixed(2)}%`,
    isPositive: changePct >= 0,
    bias: bias(changePct),
  }
}

// Stooq symbol → our symbol + display name + is metal
const SYMBOLS = [
  { stooq: "xauusd", symbol: "XAUUSD", name: "Gold",            metal: true },
  { stooq: "xagusd", symbol: "XAGUSD", name: "Silver",          metal: true },
  { stooq: "eurusd", symbol: "EURUSD", name: "EUR/USD",         metal: false },
  { stooq: "gbpusd", symbol: "GBPUSD", name: "GBP/USD",         metal: false },
  { stooq: "usdjpy", symbol: "USDJPY", name: "USD/JPY",         metal: false },
  { stooq: "usdinr", symbol: "USDINR", name: "USD/INR",         metal: false },
  { stooq: "dx-y.nyb", symbol: "DXY",  name: "US Dollar Index", metal: false },
]

// Fetch one Stooq CSV quote: https://stooq.com/q/l/?s=SYMBOL&f=sd2t2ohlcv&h&e=csv
async function fetchStooq(stooq: string): Promise<{ price: number; open: number } | null> {
  try {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooq)}&f=sd2t2ohlcv&h&e=csv`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const text = await res.text()
    // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
    const lines = text.trim().split("\n")
    if (lines.length < 2) return null
    const cols = lines[1].split(",")
    const open  = parseFloat(cols[3] ?? "0")
    const close = parseFloat(cols[6] ?? "0")
    if (!close || close === 0) return null
    return { price: close, open }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const results = await Promise.all(SYMBOLS.map(s => fetchStooq(s.stooq)))

    const data = SYMBOLS.map((s, i) => {
      const q = results[i]
      const price = q?.price ?? 0
      const open  = q?.open  ?? price
      const changePct = open > 0 ? ((price - open) / open) * 100 : 0

      let priceStr = "-"
      if (price > 0) {
        if (s.metal) {
          priceStr = `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        } else if (["EURUSD", "GBPUSD"].includes(s.symbol)) {
          priceStr = price.toFixed(5)
        } else if (s.symbol === "USDJPY") {
          priceStr = price.toFixed(3)
        } else {
          priceStr = price.toFixed(2)
        }
      }

      return {
        symbol: s.symbol,
        name: s.name,
        price: priceStr,
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changePercent: `${Math.abs(changePct).toFixed(2)}%`,
        isPositive: changePct >= 0,
        bias: changePct > 0.1 ? "Bullish" : changePct < -0.1 ? "Bearish" : "Neutral",
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
