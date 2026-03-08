import { NextResponse } from "next/server"

interface ForexAsset {
  symbol: string
  name: string
  price: string
  change: string
  isPositive: boolean
  tradingViewSymbol: string
  rawPrice: number
  isMarketClosed?: boolean
}

const FOREX_SYMBOLS = [
  { symbol: "EURUSD", name: "Euro / US Dollar", tradingView: "FX:EURUSD" },
  { symbol: "XAUUSD", name: "Gold / US Dollar", tradingView: "OANDA:XAUUSD" },
  { symbol: "XAGUSD", name: "Silver / US Dollar", tradingView: "OANDA:XAGUSD" },
]

function isForexMarketClosed(): { isClosed: boolean; opensAt: Date | null } {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const hour = now.getUTCHours()

  // Forex market closes Friday 21:00 UTC and opens Sunday 21:00 UTC
  // Saturday (6) - closed all day
  // Sunday (0) - closed until 21:00 UTC
  // Friday (5) - open until 21:00 UTC

  if (dayOfWeek === 6) {
    // Saturday - market closed, opens Sunday 21:00 UTC
    const opensAt = new Date(now)
    opensAt.setUTCDate(opensAt.getUTCDate() + 1) // Move to Sunday
    opensAt.setUTCHours(21, 0, 0, 0)
    return { isClosed: true, opensAt }
  }

  if (dayOfWeek === 0 && hour < 21) {
    // Sunday before 21:00 UTC - market closed
    const opensAt = new Date(now)
    opensAt.setUTCHours(21, 0, 0, 0)
    return { isClosed: true, opensAt }
  }

  if (dayOfWeek === 5 && hour >= 21) {
    // Friday after 21:00 UTC - market closed, opens Sunday 21:00 UTC
    const opensAt = new Date(now)
    opensAt.setUTCDate(opensAt.getUTCDate() + 2) // Move to Sunday
    opensAt.setUTCHours(21, 0, 0, 0)
    return { isClosed: true, opensAt }
  }

  return { isClosed: false, opensAt: null }
}

function getCountdownString(opensAt: Date): string {
  const now = new Date()
  const diff = opensAt.getTime() - now.getTime()

  if (diff <= 0) return "Opening soon..."

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }
  return `${hours}h ${minutes}m`
}

async function fetchExchangeRateData(): Promise<ForexAsset[] | null> {
  try {
    const pairs = ["EURUSD"]
    const results: ForexAsset[] = []

    for (const pair of pairs) {
      const base = pair.slice(0, 3)
      const quote = pair.slice(3)

      const response = await fetch(
        `https://api.exchangerate.host/latest?base=${base}&symbols=${quote}`,
        { next: { revalidate: 60 } }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.rates && data.rates[quote]) {
          const price = data.rates[quote]
          const asset = FOREX_SYMBOLS.find((f) => f.symbol === pair)
          if (asset) {
            results.push({
              symbol: asset.symbol,
              name: asset.name,
              price: price.toFixed(4),
              change: "+0.00%",
              isPositive: true,
              tradingViewSymbol: asset.tradingView,
              rawPrice: price,
            })
          }
        }
      }
    }

    if (results.length > 0) return results
    return null
  } catch {
    return null
  }
}

function getFallbackForexData(): ForexAsset[] {
  return FOREX_SYMBOLS.map((asset) => {
    let price: string
    let rawPrice: number
    let change: string
    let isPositive: boolean

    switch (asset.symbol) {
      case "EURUSD":
        price = "1.0850"
        rawPrice = 1.085
        change = "+0.08%"
        isPositive = true
        break
      case "XAUUSD":
        price = "2,650.00"
        rawPrice = 2650.0
        change = "+0.32%"
        isPositive = true
        break
      case "XAGUSD":
        price = "31.25"
        rawPrice = 31.25
        change = "-0.15%"
        isPositive = false
        break
      default:
        price = "0.00"
        rawPrice = 0
        change = "N/A"
        isPositive = true
    }

    return {
      symbol: asset.symbol,
      name: asset.name,
      price,
      change,
      isPositive,
      tradingViewSymbol: asset.tradingView,
      rawPrice,
    }
  })
}

export async function GET() {
  const { isClosed, opensAt } = isForexMarketClosed()

  // Try to fetch real forex data
  let data = await fetchExchangeRateData()

  // Use fallback data if API fails
  if (!data || data.length === 0) {
    data = getFallbackForexData()
  }

  // Add market closed status to each asset
  const dataWithStatus = data.map((asset) => ({
    ...asset,
    isMarketClosed: isClosed,
  }))

  return NextResponse.json({
    data: dataWithStatus,
    isMarketClosed: isClosed,
    opensAt: opensAt?.toISOString() || null,
    opensIn: opensAt ? getCountdownString(opensAt) : null,
  })
}
