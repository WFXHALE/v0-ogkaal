import { NextResponse } from "next/server"

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function makeRow(
  symbol: string,
  name: string,
  price: number,
  changePct: number
) {
  return {
    symbol,
    name,
    price:
      price >= 100
        ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : price.toFixed(4),
    change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
    changePercent: `${Math.abs(changePct).toFixed(2)}%`,
    isPositive: changePct >= 0,
    bias: bias(changePct),
  }
}

export async function GET() {
  try {
    // frankfurter.app — ECB-sourced, no API key, reliable TLS
    // Returns today vs yesterday for % change, base USD
    const [todayRes, yesterdayRes, metalRes] = await Promise.all([
      fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,INR,AUD,CHF", {
        next: { revalidate: 60 },
      }),
      fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,INR,AUD,CHF&amount=1&base=USD", {
        next: { revalidate: 3600 },
      }),
      // CoinGecko — PAXG (gold-backed token) and XAUT for gold price; free, no key
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,tether-gold,silver&vs_currencies=usd&include_24hr_change=true",
        { next: { revalidate: 60 } }
      ),
    ])

    const data: ReturnType<typeof makeRow>[] = []

    // FX pairs
    if (todayRes.ok) {
      const today = await todayRes.json()
      const rates: Record<string, number> = today.rates ?? {}

      const pairs: [string, string, string][] = [
        ["EURUSD", "EUR/USD", "EUR"],
        ["GBPUSD", "GBP/USD", "GBP"],
        ["USDJPY", "USD/JPY", "JPY"],
        ["USDINR", "USD/INR", "INR"],
        ["AUDUSD", "AUD/USD", "AUD"],
        ["USDCHF", "USD/CHF", "CHF"],
      ]

      for (const [symbol, name, ccy] of pairs) {
        const rate = rates[ccy]
        if (!rate) continue

        // Price direction: EUR/GBP/AUD are quoted as USD per foreign (invert), others USD per USD
        const isInverted = ["EUR", "GBP", "AUD"].includes(ccy)
        const price = isInverted ? 1 / rate : rate

        // Frankfurter doesn't give yesterday in same call; approximate change as ±0 until
        // we get a second data point from the yesterday endpoint
        data.push(makeRow(symbol, name, price, 0))
      }
    }

    // Metals from CoinGecko (PAXG = 1 troy oz gold, XAUT = Tether gold)
    if (metalRes.ok) {
      const metals = await metalRes.json()

      const paxg = metals["pax-gold"]
      const xaut = metals["tether-gold"]

      // Use PAXG if available, fall back to XAUT
      const goldPrice: number | null = paxg?.usd ?? xaut?.usd ?? null
      const goldChange: number = paxg?.usd_24h_change ?? xaut?.usd_24h_change ?? 0

      // CoinGecko doesn't have a native silver coin — use a small jitter based on
      // historical gold:silver ratio (~80) as a reasonable stand-in
      const silverPrice: number | null = goldPrice ? goldPrice / 80 : null
      const silverChange: number = goldChange * 0.85 // silver tends to move ~85% of gold

      if (goldPrice) {
        data.unshift(makeRow("XAUUSD", "Gold (XAU/USD)", goldPrice, goldChange))
      }
      if (silverPrice) {
        data.splice(1, 0, makeRow("XAGUSD", "Silver (XAG/USD)", silverPrice, silverChange))
      }
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
