import { NextResponse } from "next/server"

interface YFMeta {
  regularMarketPrice?: number
  previousClose?: number
  chartPreviousClose?: number
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

function isForexWeekend(): boolean {
  const now = new Date()
  const day = now.getUTCDay()
  const h   = now.getUTCHours()
  return day === 6 || (day === 0 && h < 21) || (day === 5 && h >= 21)
}

export const dynamic = "force-dynamic"

export async function GET() {
  const isClosed = isForexWeekend()

  const [goldMeta, dxyMeta] = await Promise.all([
    fetchYFChart("GC=F"),
    fetchYFChart("DX-Y.NYB"),
  ])

  function buildAsset(
    symbol: string,
    name: string,
    meta: YFMeta | null,
    decimals: number,
  ) {
    const price      = meta?.regularMarketPrice ?? 0
    const prevClose  = meta?.previousClose ?? meta?.chartPreviousClose ?? price
    const changeAbs  = price - prevClose
    const changePct  = prevClose > 0 ? (changeAbs / prevClose) * 100 : 0
    const isPositive = changePct >= 0

    return {
      symbol,
      name,
      price:     price > 0
        ? price.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : "—",
      change:    isClosed
        ? "Market Closed"
        : `${isPositive ? "+" : ""}${changePct.toFixed(2)}%`,
      changeAbs: isClosed
        ? ""
        : `${isPositive ? "+" : ""}${changeAbs.toFixed(decimals)}`,
      isPositive,
      isWeekend: isClosed,
      rawPrice:  price,
    }
  }

  const assets = [
    buildAsset("XAUUSD", "Gold / US Dollar",  goldMeta, 2),
    buildAsset("DXY",    "US Dollar Index",    dxyMeta,  3),
  ]

  return NextResponse.json(
    { data: assets, isMarketClosed: isClosed },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  )
}
