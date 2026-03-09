import { NextResponse } from "next/server"

const SYMBOLS = [
  { symbol: "BTC", name: "Bitcoin", bin: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", bin: "ETHUSDT" },
  { symbol: "SOL", name: "Solana", bin: "SOLUSDT" },
  { symbol: "XRP", name: "XRP", bin: "XRPUSDT" },
  { symbol: "BNB", name: "BNB", bin: "BNBUSDT" },
  { symbol: "ADA", name: "Cardano", bin: "ADAUSDT" },
  { symbol: "DOGE", name: "Dogecoin", bin: "DOGEUSDT" },
]

function fmt(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${(v / 1e3).toFixed(2)}K`
}

function activity(ratio: number): "Very High" | "High" | "Normal" | "Low" {
  if (ratio > 1.4) return "Very High"
  if (ratio > 1.1) return "High"
  if (ratio > 0.75) return "Normal"
  return "Low"
}

export async function GET() {
  try {
    // Binance 24hr stats for each symbol individually (more reliable than bulk)
    const binSymbols = SYMBOLS.map(s => `"${s.bin}"`).join(",")
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=[${binSymbols}]`,
      { next: { revalidate: 10 } }
    )
    if (!res.ok) throw new Error("Binance 24hr failed")
    const tickers: Array<{
      symbol: string
      quoteVolume: string
      priceChangePercent: string
      weightedAvgPrice: string
      volume: string
    }> = await res.json()

    // Also fetch 7-day klines to compute a real average daily volume
    const avgMap: Record<string, number> = {}
    await Promise.all(
      SYMBOLS.map(async (s) => {
        try {
          const k = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${s.bin}&interval=1d&limit=7`,
            { next: { revalidate: 300 } }
          )
          if (!k.ok) return
          const klines: Array<[string, string, string, string, string, string, string, string]> = await k.json()
          // klines[i][7] is quote asset volume
          const total = klines.reduce((acc, row) => acc + parseFloat(row[7]), 0)
          avgMap[s.bin] = total / klines.length
        } catch {
          // leave undefined — will fall back to 90% of current
        }
      })
    )

    const data = tickers.map((t) => {
      const s = SYMBOLS.find(x => x.bin === t.symbol)!
      const vol24 = parseFloat(t.quoteVolume)
      const avg = avgMap[t.bin] ?? vol24 * 0.9
      const ratio = avg > 0 ? vol24 / avg : 1
      const changePct = parseFloat(t.priceChangePercent)
      return {
        symbol: s.symbol,
        name: s.name,
        volume24h: fmt(vol24),
        volumeChange: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`,
        isIncreasing: changePct >= 0,
        avgVolume: fmt(avg),
        activity: activity(ratio),
      }
    })

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[volume route]", err)
    return NextResponse.json({ success: false, data: [], error: "Volume fetch failed" }, { status: 500 })
  }
}
