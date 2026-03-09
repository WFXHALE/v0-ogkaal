import { NextResponse } from "next/server"

// All symbols to fetch from Yahoo Finance in one request
const YAHOO_SYMBOLS = [
  { symbol: "XAUUSD", name: "Gold",            yahoo: "GC=F" },
  { symbol: "XAGUSD", name: "Silver",          yahoo: "SI=F" },
  { symbol: "EURUSD", name: "EUR/USD",         yahoo: "EURUSD=X" },
  { symbol: "GBPUSD", name: "GBP/USD",         yahoo: "GBPUSD=X" },
  { symbol: "USDJPY", name: "USD/JPY",         yahoo: "JPY=X" },
  { symbol: "USDINR", name: "USD/INR",         yahoo: "INR=X" },
  { symbol: "DXY",    name: "US Dollar Index", yahoo: "DX-Y.NYB" },
]

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function formatPrice(symbol: string, price: number): string {
  // Forex pairs — show 4–5 decimal places; metals/DXY — 2 decimals
  if (["EURUSD", "GBPUSD"].includes(symbol)) return price.toFixed(5)
  if (["USDJPY"].includes(symbol)) return price.toFixed(3)
  if (["USDINR"].includes(symbol)) return price.toFixed(2)
  // Metals and DXY
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function GET() {
  try {
    const tickers = YAHOO_SYMBOLS.map(s => s.yahoo).join(",")
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${tickers}&range=1d&interval=1d`

    // Use v7/finance/quote for real-time price + change percent
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers)}`

    const res = await fetch(quoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 30 },
    })

    if (!res.ok) throw new Error(`Yahoo Finance responded ${res.status}`)

    const json = await res.json()
    const results: Record<string, {
      regularMarketPrice?: number
      regularMarketChangePercent?: number
    }> = {}

    for (const q of json?.quoteResponse?.result ?? []) {
      results[q.symbol] = {
        regularMarketPrice: q.regularMarketPrice,
        regularMarketChangePercent: q.regularMarketChangePercent,
      }
    }

    const data = YAHOO_SYMBOLS.map(({ symbol, name, yahoo }) => {
      const q = results[yahoo]
      const price = q?.regularMarketPrice ?? 0
      const changePct = q?.regularMarketChangePercent ?? 0
      return {
        symbol,
        name,
        price: price > 0 ? formatPrice(symbol, price) : "-",
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
