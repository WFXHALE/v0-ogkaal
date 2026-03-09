import { NextResponse } from "next/server"

// Stooq: free, no API key, no rate-limit issues, covers Indian indices
// Symbols: ^NF50.IN=NIFTY50, ^BSESN=SENSEX, ^NSEBANK=BankNIFTY, ^NSEFIN15=FinNIFTY
// USD/INR: fetched from Frankfurter (same source as forex route)
const STOOQ_INDICES = [
  { symbol: "NIFTY50",    name: "NIFTY 50",    stooq: "^nf50.in"   },
  { symbol: "BANKNIFTY",  name: "Bank NIFTY",  stooq: "^nsebank.in"},
  { symbol: "SENSEX",     name: "BSE SENSEX",  stooq: "^bsesn.in"  },
  { symbol: "MIDCPNIFTY", name: "Midcap NIFTY",stooq: "^nf150.in"  },
]

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.3) return "Bullish"
  if (pct < -0.3) return "Bearish"
  return "Neutral"
}

function prevWorkday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  if (d.getUTCDay() === 0) d.setDate(d.getDate() - 2)
  if (d.getUTCDay() === 6) d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

async function fetchStooq(stooqSymbol: string): Promise<{ price: number; open: number } | null> {
  try {
    // Stooq CSV endpoint: returns date,open,high,low,close,volume
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&e=csv`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.trim().split("\n")
    if (lines.length < 2) return null
    // Header: Symbol,Date,Time,Open,High,Low,Close,Volume
    const cols = lines[1].split(",")
    const open  = parseFloat(cols[3])
    const close = parseFloat(cols[6])
    if (!close || isNaN(close)) return null
    return { price: close, open: isNaN(open) ? close : open }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const yesterday = prevWorkday()

    const [stooqResults, fxToday, fxPrev] = await Promise.all([
      Promise.all(STOOQ_INDICES.map(i => fetchStooq(i.stooq))),
      fetch(`https://api.frankfurter.app/latest?from=USD&to=INR`, { next: { revalidate: 60 } }),
      fetch(`https://api.frankfurter.app/${yesterday}?from=USD&to=INR`, { next: { revalidate: 3600 } }),
    ])

    const data = []

    // Indian indices
    for (let i = 0; i < STOOQ_INDICES.length; i++) {
      const idx = STOOQ_INDICES[i]
      const q = stooqResults[i]
      if (!q) continue
      const { price, open } = q
      const changePct = open !== 0 ? ((price - open) / open) * 100 : 0
      data.push({
        symbol: idx.symbol,
        name: idx.name,
        price: `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changePercent: `${Math.abs(changePct).toFixed(2)}%`,
        isPositive: changePct >= 0,
        bias: bias(changePct),
      })
    }

    // USD/INR from Frankfurter
    if (fxToday.ok) {
      const today = await fxToday.json()
      const inrRate: number = today.rates?.INR ?? 0
      let changePct = 0
      if (fxPrev.ok) {
        const prev = await fxPrev.json()
        const prevRate: number = prev.rates?.INR ?? inrRate
        changePct = prevRate !== 0 ? ((inrRate - prevRate) / prevRate) * 100 : 0
      }
      if (inrRate > 0) {
        data.push({
          symbol: "USDINR",
          name: "USD/INR",
          price: `₹${inrRate.toFixed(4)}`,
          change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
          changePercent: `${Math.abs(changePct).toFixed(2)}%`,
          isPositive: changePct >= 0,
          bias: bias(changePct),
        })
      }
    }

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[indian market route]", err)
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch Indian market data" },
      { status: 500 }
    )
  }
}
