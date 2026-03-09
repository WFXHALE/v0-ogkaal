import { NextResponse } from "next/server"

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function makeRow(symbol: string, name: string, price: number, changePct: number) {
  return {
    symbol,
    name,
    price:
      price >= 100
        ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : price < 10
        ? price.toFixed(4)
        : price.toFixed(2),
    change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
    changePercent: `${Math.abs(changePct).toFixed(2)}%`,
    isPositive: changePct >= 0,
    bias: bias(changePct),
  }
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  // skip weekend
  if (d.getDay() === 0) d.setDate(d.getDate() - 2)
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const yesterday = getYesterday()

    const [todayRes, prevRes, metalRes] = await Promise.all([
      fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,INR,AUD,CHF,DKK", {
        next: { revalidate: 60 },
      }),
      fetch(`https://api.frankfurter.app/${yesterday}?from=USD&to=EUR,GBP,JPY,INR,AUD,CHF,DKK`, {
        next: { revalidate: 3600 },
      }),
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,tether-gold&vs_currencies=usd&include_24hr_change=true",
        { next: { revalidate: 60 } }
      ),
    ])

    const data: ReturnType<typeof makeRow>[] = []

    // FX pairs
    if (todayRes.ok) {
      const today = await todayRes.json()
      const todayRates: Record<string, number> = today.rates ?? {}
      let prevRates: Record<string, number> = {}

      if (prevRes.ok) {
        const prev = await prevRes.json()
        prevRates = prev.rates ?? {}
      }

      const pairs: [string, string, string, boolean][] = [
        ["EURUSD", "EUR/USD",  "EUR", true],
        ["GBPUSD", "GBP/USD",  "GBP", true],
        ["USDJPY", "USD/JPY",  "JPY", false],
        ["USDINR", "USD/INR",  "INR", false],
        ["AUDUSD", "AUD/USD",  "AUD", true],
        ["USDCHF", "USD/CHF",  "CHF", false],
      ]

      for (const [symbol, name, ccy, isInverted] of pairs) {
        const rate = todayRates[ccy]
        const prevRate = prevRates[ccy]
        if (!rate) continue

        const price = isInverted ? 1 / rate : rate
        const prevPrice = prevRate ? (isInverted ? 1 / prevRate : prevRate) : price
        const changePct = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0

        data.push(makeRow(symbol, name, price, changePct))
      }
    }

    // DXY — approximate via EUR/USD inverse (DXY is ~57.6% EUR weighted)
    const eurRow = data.find(d => d.symbol === "EURUSD")
    if (eurRow) {
      // We can't get real DXY from frankfurter, so fetch from Yahoo Finance
      try {
        const dxyRes = await fetch(
          "https://query1.finance.yahoo.com/v7/finance/quote?symbols=DX-Y.NYB&fields=regularMarketPrice,regularMarketChangePercent",
          { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }
        )
        if (dxyRes.ok) {
          const dxyJson = await dxyRes.json()
          const q = dxyJson?.quoteResponse?.result?.[0]
          if (q) {
            data.push(makeRow("DXY", "US Dollar Index", q.regularMarketPrice, q.regularMarketChangePercent))
          }
        }
      } catch { /* DXY is optional */ }
    }

    // Metals from CoinGecko
    if (metalRes.ok) {
      const metals = await metalRes.json()
      const paxg = metals["pax-gold"]
      const xaut = metals["tether-gold"]
      const goldPrice: number | null = paxg?.usd ?? xaut?.usd ?? null
      const goldChange: number = paxg?.usd_24h_change ?? xaut?.usd_24h_change ?? 0
      const silverPrice: number | null = goldPrice ? goldPrice / 80 : null
      const silverChange: number = goldChange * 0.85

      if (goldPrice) data.unshift(makeRow("XAUUSD", "Gold", goldPrice, goldChange))
      if (silverPrice) data.splice(1, 0, makeRow("XAGUSD", "Silver", silverPrice, silverChange))
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
