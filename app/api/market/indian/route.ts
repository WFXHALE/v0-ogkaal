import { NextResponse } from "next/server"

const INDICES = [
  { symbol: "NIFTY50",    name: "NIFTY 50",    yahoo: "%5ENSEI"     },
  { symbol: "BANKNIFTY",  name: "Bank NIFTY",  yahoo: "%5ENSEBANK"  },
  { symbol: "SENSEX",     name: "BSE SENSEX",  yahoo: "%5EBSESN"    },
  { symbol: "FINNIFTY",   name: "Fin NIFTY",   yahoo: "%5ENSEFIN15" },
  { symbol: "USDINR",     name: "USD/INR",     yahoo: "USDINR%3DX"  },
  { symbol: "MIDCPNIFTY", name: "Midcap NIFTY",yahoo: "%5ENSEMID50" },
]

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.3) return "Bullish"
  if (pct < -0.3) return "Bearish"
  return "Neutral"
}

export async function GET() {
  try {
    const symbols = INDICES.map(i => i.yahoo).join("%2C")
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange`

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      next: { revalidate: 30 },
    })

    if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`)
    const json = await res.json()
    const quotes: Array<{
      regularMarketPrice?: number
      regularMarketChangePercent?: number
    }> = json?.quoteResponse?.result ?? []

    const data = INDICES.map((idx, i) => {
      const q = quotes[i]
      const price = q?.regularMarketPrice ?? 0
      const changePct = q?.regularMarketChangePercent ?? 0

      const priceStr = !price
        ? "-"
        : idx.symbol === "USDINR"
        ? `₹${price.toFixed(4)}`
        : `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

      return {
        symbol: idx.symbol,
        name: idx.name,
        price: priceStr,
        change: price ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "-",
        changePercent: price ? `${Math.abs(changePct).toFixed(2)}%` : "-",
        isPositive: changePct >= 0,
        bias: bias(changePct),
      }
    }).filter(d => d.price !== "-")

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[indian market route]", err)
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch Indian market data" },
      { status: 500 }
    )
  }
}
