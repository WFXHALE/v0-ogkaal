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
    // Fetch each symbol individually — the batch `?symbols=[...]` endpoint is
    // blocked by Binance when called from a server (no browser CORS headers).
    const results = await Promise.all(
      SYMBOLS.map(async (s) => {
        const [tickerRes, klinesRes] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s.bin}`, {
            next: { revalidate: 10 },
          }),
          fetch(
            `https://api.binance.com/api/v3/klines?symbol=${s.bin}&interval=1d&limit=7`,
            { next: { revalidate: 300 } }
          ),
        ])

        if (!tickerRes.ok) throw new Error(`Binance ticker failed for ${s.bin}`)
        const t: {
          quoteVolume: string
          priceChangePercent: string
        } = await tickerRes.json()

        const vol24 = parseFloat(t.quoteVolume)
        const changePct = parseFloat(t.priceChangePercent)

        let avg = vol24 * 0.9
        if (klinesRes.ok) {
          const klines: string[][] = await klinesRes.json()
          const total = klines.reduce((acc, row) => acc + parseFloat(row[7]), 0)
          avg = total / klines.length
        }

        const ratio = avg > 0 ? vol24 / avg : 1
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
    )

    return NextResponse.json({ success: true, data: results, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[volume route]", err)
    return NextResponse.json({ success: false, data: [], error: "Volume fetch failed" }, { status: 500 })
  }
}
