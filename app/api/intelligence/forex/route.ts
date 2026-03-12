import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface YFMeta {
  regularMarketPrice?: number
  previousClose?: number
  chartPreviousClose?: number
  regularMarketChangePercent?: number
}

async function fetchYFChart(ticker: string): Promise<YFMeta | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      cache: "no-store",
    })
    if (!res.ok) return null
    const json = await res.json()
    const meta: YFMeta = json?.chart?.result?.[0]?.meta
    return meta ?? null
  } catch {
    return null
  }
}

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function isForexWeekend(): boolean {
  const now = new Date()
  const day = now.getUTCDay()
  const h   = now.getUTCHours()
  return day === 6 || (day === 0 && h < 21) || (day === 5 && h >= 21)
}

export async function GET() {
  const isClosed = isForexWeekend()

  const [goldMeta, dxyMeta] = await Promise.all([
    fetchYFChart("GC=F"),      // Gold futures — XAUUSD proxy
    fetchYFChart("DX-Y.NYB"),  // US Dollar Index
  ])

  function buildAsset(
    symbol: string,
    name: string,
    meta: YFMeta | null,
    decimals: number,
    formatFn?: (price: number) => string,
  ) {
    const price     = meta?.regularMarketPrice ?? 0
    const prevClose = meta?.previousClose ?? meta?.chartPreviousClose ?? price
    const changeAbs = price - prevClose
    const changePct = prevClose > 0 ? (changeAbs / prevClose) * 100 : 0
    const isPositive = changePct >= 0

    const formattedPrice = price > 0
      ? (formatFn ? formatFn(price) : price.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))
      : "—"

    return {
      symbol,
      name,
      price:         formattedPrice,
      change:        isClosed ? "Market Closed" : `${isPositive ? "+" : ""}${changePct.toFixed(2)}%`,
      changePercent: `${Math.abs(changePct).toFixed(2)}%`,
      changeAbs:     isClosed ? "" : `${isPositive ? "+" : ""}${changeAbs.toFixed(decimals)}`,
      isPositive,
      bias:          bias(changePct),
      isWeekend:     isClosed,
      rawPrice:      price,
    }
  }

  const data = [
    buildAsset("XAUUSD", "Gold / US Dollar", goldMeta, 2,
      p => `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ),
    buildAsset("DXY", "US Dollar Index", dxyMeta, 3),
  ]

  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  )
}
