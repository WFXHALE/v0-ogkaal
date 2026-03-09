import { NextResponse } from "next/server"

// Sources:
//  - FX pairs:  Frankfurter (ECB data, no key, reliable TLS) + yesterday for change%
//  - Metals:    Binance XAUUSDT / XAGUSDT perpetual (no key, no rate limit)
//  - DXY:       Derived from EUR/USD weight (~57.6% EUR) as a close approximation

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function fmtFx(symbol: string, price: number): string {
  if (["EURUSD", "GBPUSD"].includes(symbol)) return price.toFixed(5)
  if (symbol === "USDJPY") return price.toFixed(3)
  if (symbol === "USDINR") return price.toFixed(2)
  if (symbol === "DXY") return price.toFixed(2)
  return price.toFixed(2)
}

function fmtMetal(price: number): string {
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function makeRow(symbol: string, name: string, price: number, changePct: number, isMetal = false) {
  return {
    symbol,
    name,
    price: price > 0 ? (isMetal ? fmtMetal(price) : fmtFx(symbol, price)) : "-",
    change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
    changePercent: `${Math.abs(changePct).toFixed(2)}%`,
    isPositive: changePct >= 0,
    bias: bias(changePct),
  }
}

function prevWorkday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  if (d.getUTCDay() === 0) d.setDate(d.getDate() - 2)
  if (d.getUTCDay() === 6) d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const yesterday = prevWorkday()

    // 1. Frankfurter: today + yesterday for change%
    const [todayRes, prevRes, xauRes, xagRes] = await Promise.all([
      fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,INR", {
        next: { revalidate: 60 },
      }),
      fetch(`https://api.frankfurter.app/${yesterday}?from=USD&to=EUR,GBP,JPY,INR`, {
        next: { revalidate: 3600 },
      }),
      // 2. Binance: Gold / Silver perpetual futures — no key, no rate limit
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=XAUUSDT", {
        next: { revalidate: 30 },
      }),
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=XAGUSDT", {
        next: { revalidate: 30 },
      }),
    ])

    const data: ReturnType<typeof makeRow>[] = []

    // ── Metals ──────────────────────────────────────────────────────────────
    if (xauRes.ok) {
      const t = await xauRes.json()
      const price = parseFloat(t.lastPrice ?? "0")
      const changePct = parseFloat(t.priceChangePercent ?? "0")
      if (price > 0) data.push(makeRow("XAUUSD", "Gold", price, changePct, true))
    }

    if (xagRes.ok) {
      const t = await xagRes.json()
      const price = parseFloat(t.lastPrice ?? "0")
      const changePct = parseFloat(t.priceChangePercent ?? "0")
      if (price > 0) data.push(makeRow("XAGUSD", "Silver", price, changePct, true))
    }

    // ── FX pairs ─────────────────────────────────────────────────────────────
    if (todayRes.ok) {
      const today = await todayRes.json()
      const todayRates: Record<string, number> = today.rates ?? {}
      let prevRates: Record<string, number> = {}
      if (prevRes.ok) {
        const prev = await prevRes.json()
        prevRates = prev.rates ?? {}
      }

      const pairs: [string, string, string, boolean][] = [
        ["EURUSD", "EUR/USD", "EUR", true],   // inverted: EUR per USD → USD per EUR
        ["GBPUSD", "GBP/USD", "GBP", true],
        ["USDJPY", "USD/JPY", "JPY", false],  // direct: JPY per USD
        ["USDINR", "USD/INR", "INR", false],
      ]

      for (const [symbol, name, ccy, invert] of pairs) {
        const rate = todayRates[ccy]
        if (!rate) continue
        const price = invert ? 1 / rate : rate
        const prevRate = prevRates[ccy]
        const prevPrice = prevRate ? (invert ? 1 / prevRate : prevRate) : price
        const changePct = prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0
        data.push(makeRow(symbol, name, price, changePct))
      }

      // DXY approximation: inverse of EUR/USD weighted (EUR = 57.6% of DXY)
      // Real DXY = 50.14 * EURUSD^-0.576 * USDJPY^0.136 * GBPUSD^-0.119 * ...
      // Simplified: base 100 relative move from EUR/USD inverse
      const eurUsd = todayRates["EUR"] ? 1 / todayRates["EUR"] : null
      const prevEurUsd = prevRates["EUR"] ? 1 / prevRates["EUR"] : null
      if (eurUsd && prevEurUsd) {
        // Approximate current DXY from EUR/USD (inverse relationship, ~0.576 weight)
        const dxyChangePct = -((eurUsd - prevEurUsd) / prevEurUsd) * 100 * 0.576
        // Estimate DXY level: historical avg ~103, use EUR/USD to scale
        const dxyPrice = 103.82 * Math.pow(0.9 / eurUsd, 0.576)
        data.push(makeRow("DXY", "US Dollar Index", dxyPrice, dxyChangePct))
      }
    }

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[forex route]", err)
    return NextResponse.json(
      { success: false, data: [], error: String(err) },
      { status: 500 }
    )
  }
}
