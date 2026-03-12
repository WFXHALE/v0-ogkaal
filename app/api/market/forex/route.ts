import { NextResponse } from "next/server"

// Yahoo Finance quote API — no API key required, rate-limit friendly
const YF_URL = "https://query1.finance.yahoo.com/v8/finance/spark"

interface YahooQuote {
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  regularMarketChange?: number
  regularMarketPreviousClose?: number
}

async function fetchYahooQuote(ticker: string): Promise<YahooQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(ticker)}&range=1d&interval=5m`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 30 }, // cache 30s
    })
    if (!res.ok) throw new Error(`Yahoo ${res.status}`)
    const json = await res.json()
    const result = json?.spark?.result?.[0]
    const meta = result?.response?.[0]?.meta
    if (!meta) return null
    return {
      regularMarketPrice:          meta.regularMarketPrice,
      regularMarketChangePercent:  meta.regularMarketChangePercent,
      regularMarketChange:         meta.regularMarketChange ?? (meta.regularMarketPrice - meta.chartPreviousClose),
      regularMarketPreviousClose:  meta.chartPreviousClose,
    }
  } catch {
    return null
  }
}

function isForexWeekend(): boolean {
  const now = new Date()
  const day = now.getUTCDay()
  const h   = now.getUTCHours()
  return day === 6 || (day === 0 && h < 21) || (day === 5 && h >= 21)
}

export async function GET() {
  const isClosed = isForexWeekend()

  // Fetch both in parallel
  const [goldRaw, dxyRaw] = await Promise.all([
    fetchYahooQuote("GC=F"),   // Gold futures — closest to XAUUSD spot
    fetchYahooQuote("DX-Y.NYB"), // DXY
  ])

  const assets = [
    {
      symbol:  "XAUUSD",
      name:    "Gold / US Dollar",
      raw:     goldRaw,
      decimals: 2,
    },
    {
      symbol:  "DXY",
      name:    "US Dollar Index",
      raw:     dxyRaw,
      decimals: 3,
    },
  ].map(({ symbol, name, raw, decimals }) => {
    const price   = raw?.regularMarketPrice   ?? 0
    const changePct = raw?.regularMarketChangePercent ?? 0
    const changeAbs = raw?.regularMarketChange ?? 0
    const isPositive = changePct >= 0

    return {
      symbol,
      name,
      price:    price > 0 ? price.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : "—",
      change:   isClosed ? "Market Closed" : `${isPositive ? "+" : ""}${changePct.toFixed(2)}%`,
      changeAbs: isClosed ? "" : `${isPositive ? "+" : ""}${changeAbs.toFixed(decimals)}`,
      isPositive,
      isWeekend: isClosed,
      rawPrice:  price,
    }
  })

  return NextResponse.json(
    { data: assets, isMarketClosed: isClosed },
    { headers: { "Cache-Control": "no-store" } }
  )
}
