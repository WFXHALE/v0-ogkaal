import { NextResponse } from "next/server"

function fmt(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${(v / 1e3).toFixed(2)}K`
}

function strength(usd: number): "Strong" | "Medium" | "Weak" {
  if (usd >= 500e6) return "Strong"
  if (usd >= 100e6) return "Medium"
  return "Weak"
}

async function getOrderbookLiquidity(symbol: string, currentPrice: number) {
  // Binance order book depth — free, no key
  const res = await fetch(
    `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=500`,
    { next: { revalidate: 15 } }
  )
  if (!res.ok) return []
  const book: { bids: [string, string][]; asks: [string, string][] } = await res.json()

  // Cluster bids (buy liquidity) in 2% bands below current price
  const buyBands: Record<number, number> = {}
  for (const [p, q] of book.bids) {
    const price = parseFloat(p)
    const qty = parseFloat(q)
    const band = Math.floor((price / currentPrice) * 50) / 50 // round to nearest 2%
    buyBands[band] = (buyBands[band] ?? 0) + price * qty
  }

  const sellBands: Record<number, number> = {}
  for (const [p, q] of book.asks) {
    const price = parseFloat(p)
    const qty = parseFloat(q)
    const band = Math.ceil((price / currentPrice) * 50) / 50
    sellBands[band] = (sellBands[band] ?? 0) + price * qty
  }

  const pair = symbol.replace("USDT", "USD")
  const zones = []

  // Top 2 buy zones
  const topBuys = Object.entries(buyBands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
  for (const [band, vol] of topBuys) {
    const lvl = parseFloat(band) * currentPrice
    zones.push({
      id: `${symbol}-buy-${band}`,
      pair,
      type: "buy" as const,
      priceLevel: `$${lvl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      strength: strength(vol),
      volume: fmt(vol),
    })
  }

  // Top 2 sell zones
  const topSells = Object.entries(sellBands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
  for (const [band, vol] of topSells) {
    const lvl = parseFloat(band) * currentPrice
    zones.push({
      id: `${symbol}-sell-${band}`,
      pair,
      type: "sell" as const,
      priceLevel: `$${lvl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      strength: strength(vol),
      volume: fmt(vol),
    })
  }

  return zones
}

export async function GET() {
  try {
    // Get current prices first
    const priceRes = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT"]`,
      { next: { revalidate: 10 } }
    )
    if (!priceRes.ok) throw new Error("Price fetch failed")
    const prices: Array<{ symbol: string; price: string }> = await priceRes.json()
    const priceMap = Object.fromEntries(prices.map(p => [p.symbol, parseFloat(p.price)]))

    const [btcZones, ethZones] = await Promise.all([
      getOrderbookLiquidity("BTCUSDT", priceMap["BTCUSDT"]),
      getOrderbookLiquidity("ETHUSDT", priceMap["ETHUSDT"]),
    ])

    const data = [...btcZones, ...ethZones]
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[liquidity route]", err)
    return NextResponse.json({ success: false, data: [], error: "Liquidity fetch failed" }, { status: 500 })
  }
}
