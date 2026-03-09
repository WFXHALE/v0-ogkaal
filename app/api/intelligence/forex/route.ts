import { NextResponse } from "next/server"

// Sources:
//  - Metals (XAUUSD, XAGUSD): Binance spot — XAUUSDT / XAGUSDT (no key, no rate limit)
//  - FX pairs + DXY:          Frankfurter (ECB data, no key) + yesterday for change%
//  - DXY:                     Computed via ICE formula using EUR, JPY, GBP, CHF

function bias(pct: number): "Bullish" | "Bearish" | "Neutral" {
  if (pct > 0.1) return "Bullish"
  if (pct < -0.1) return "Bearish"
  return "Neutral"
}

function fmtFx(symbol: string, price: number): string {
  if (["EURUSD", "GBPUSD"].includes(symbol)) return price.toFixed(5)
  if (symbol === "USDJPY") return price.toFixed(3)
  if (symbol === "USDINR") return price.toFixed(2)
  if (symbol === "DXY")    return price.toFixed(2)
  return price.toFixed(2)
}

function fmtMetal(price: number): string {
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function makeRow(symbol: string, name: string, price: number, changePct: number, isMetal = false) {
  return {
    symbol,
    name,
    price:  price > 0 ? (isMetal ? fmtMetal(price) : fmtFx(symbol, price)) : "-",
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

    const [todayRes, prevRes, xauRes, xagRes] = await Promise.all([
      fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,INR,CHF", {
        next: { revalidate: 60 },
      }),
      fetch(`https://api.frankfurter.app/${yesterday}?from=USD&to=EUR,GBP,JPY,INR,CHF`, {
        next: { revalidate: 3600 },
      }),
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=XAUUSDT", {
        next: { revalidate: 30 },
      }),
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=XAGUSDT", {
        next: { revalidate: 30 },
      }),
    ])

    const data: ReturnType<typeof makeRow>[] = []

    // ── Metals (Binance spot) ────────────────────────────────────────────────
    if (xauRes.ok) {
      const t = await xauRes.json()
      const price     = parseFloat(t.lastPrice ?? "0")
      const changePct = parseFloat(t.priceChangePercent ?? "0")
      if (price > 0) data.push(makeRow("XAUUSD", "Gold",   price, changePct, true))
    }

    if (xagRes.ok) {
      const t = await xagRes.json()
      const price     = parseFloat(t.lastPrice ?? "0")
      const changePct = parseFloat(t.priceChangePercent ?? "0")
      if (price > 0) data.push(makeRow("XAGUSD", "Silver", price, changePct, true))
    }

    // ── FX pairs (Frankfurter) ────────────────────────────────────────────────
    if (todayRes.ok) {
      const today = await todayRes.json()
      const r: Record<string, number>  = today.rates ?? {}
      let p: Record<string, number>    = {}
      if (prevRes.ok) {
        const prev = await prevRes.json()
        p = prev.rates ?? {}
      }

      const pairs: [string, string, string, boolean][] = [
        ["EURUSD", "EUR/USD", "EUR", true ],  // invert: USD per EUR
        ["GBPUSD", "GBP/USD", "GBP", true ],
        ["USDJPY", "USD/JPY", "JPY", false],  // direct: JPY per USD
        ["USDINR", "USD/INR", "INR", false],
      ]

      for (const [symbol, name, ccy, invert] of pairs) {
        const rate = r[ccy]
        if (!rate) continue
        const price     = invert ? 1 / rate : rate
        const prevRate  = p[ccy]
        const prevPrice = prevRate ? (invert ? 1 / prevRate : prevRate) : price
        const changePct = prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0
        data.push(makeRow(symbol, name, price, changePct))
      }

      // DXY via ICE official formula:
      // 50.14348112 × EURUSD^-0.576 × USDJPY^0.136 × GBPUSD^-0.119 × USDCHF^0.036
      // (USDCAD^0.091 and USDSEK^0.042 omitted — Frankfurter provides SEK via EUR cross)
      const eur = r["EUR"] ? 1 / r["EUR"] : null
      const jpy = r["JPY"] ?? null
      const gbp = r["GBP"] ? 1 / r["GBP"] : null
      const chf = r["CHF"] ?? null
      const pe  = p["EUR"] ? 1 / p["EUR"] : eur
      const pj  = p["JPY"] ?? jpy
      const pg  = p["GBP"] ? 1 / p["GBP"] : gbp
      const pc  = p["CHF"] ?? chf

      if (eur && jpy && gbp && chf && pe && pj && pg && pc) {
        const dxyCur  = 50.14348112 * Math.pow(eur,-0.576) * Math.pow(jpy,0.136) * Math.pow(gbp,-0.119) * Math.pow(chf,0.036)
        const dxyPrev = 50.14348112 * Math.pow(pe, -0.576) * Math.pow(pj, 0.136) * Math.pow(pg, -0.119) * Math.pow(pc, 0.036)
        const dxyChg  = dxyPrev !== 0 ? ((dxyCur - dxyPrev) / dxyPrev) * 100 : 0
        data.push(makeRow("DXY", "US Dollar Index", dxyCur, dxyChg))
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
