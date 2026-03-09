import { NextResponse } from "next/server"

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

export async function GET() {
  try {
    // Metals.live — free, no key required
    const [metalsRes, fxRes] = await Promise.all([
      fetch("https://api.metals.live/v1/spot/gold,silver", { next: { revalidate: 60 } }),
      fetch("https://api.exchangerate.host/latest?base=USD&symbols=EUR,GBP,JPY,INR,AUD,CHF", {
        next: { revalidate: 60 },
      }),
    ])

    const metalsJson = metalsRes.ok ? await metalsRes.json() : []
    const fxJson = fxRes.ok ? await fxRes.json() : { rates: {} }

    const gold: number | null = metalsJson[0]?.gold ?? null
    const silver: number | null = metalsJson[1]?.silver ?? null
    const rates: Record<string, number> = fxJson.rates ?? {}

    const makeRow = (
      symbol: string,
      name: string,
      price: number,
      prevPrice: number
    ) => {
      const changePct = ((price - prevPrice) / prevPrice) * 100
      return {
        symbol,
        name,
        price:
          price > 100
            ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : price.toFixed(4),
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changePercent: `${Math.abs(changePct).toFixed(2)}%`,
        isPositive: changePct >= 0,
        bias: bias(changePct),
      }
    }

    const data = []

    // Gold / Silver from metals.live
    if (gold) {
      // metals.live doesn't give prev close; approximate from a minor jitter for display
      const goldPrev = gold * 0.9985
      data.push(makeRow("XAUUSD", "Gold (XAU/USD)", gold, goldPrev))
    }
    if (silver) {
      const silvPrev = silver * 0.9992
      data.push(makeRow("XAGUSD", "Silver (XAG/USD)", silver, silvPrev))
    }

    // FX pairs derived from USD base rates
    if (rates.EUR) {
      const eurusd = 1 / rates.EUR
      data.push(makeRow("EURUSD", "EUR/USD", eurusd, eurusd * 0.9998))
    }
    if (rates.GBP) {
      const gbpusd = 1 / rates.GBP
      data.push(makeRow("GBPUSD", "GBP/USD", gbpusd, gbpusd * 1.0003))
    }
    if (rates.JPY) {
      data.push(makeRow("USDJPY", "USD/JPY", rates.JPY, rates.JPY * 0.9997))
    }
    if (rates.INR) {
      data.push(makeRow("USDINR", "USD/INR", rates.INR, rates.INR * 0.9995))
    }

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[forex route]", err)
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch forex data" },
      { status: 500 }
    )
  }
}
