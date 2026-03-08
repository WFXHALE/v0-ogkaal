import { NextResponse } from "next/server"

interface ForexAsset {
  symbol: string
  name: string
  price: string
  change: string
  isPositive: boolean
  tradingViewSymbol: string
  rawPrice: number
  isWeekend: boolean
  nextOpenTime?: string
}

const FOREX_SYMBOLS = [
  { symbol: "EURUSD", name: "Euro / US Dollar", tradingView: "FX:EURUSD" },
  { symbol: "XAUUSD", name: "Gold / US Dollar", tradingView: "OANDA:XAUUSD" },
  { symbol: "XAGUSD", name: "Silver / US Dollar", tradingView: "OANDA:XAGUSD" },
]

function isForexMarketClosed(): { isClosed: boolean; nextOpenTime: Date | null } {
  const now = new Date()
  const utcDay = now.getUTCDay()
  const utcHour = now.getUTCHours()
  const utcMinute = now.getUTCMinutes()

  // Forex market closes Friday 21:00 UTC and opens Sunday 21:00 UTC
  // Closed: Friday 21:00 UTC to Sunday 21:00 UTC
  
  let isClosed = false
  let nextOpenTime: Date | null = null

  if (utcDay === 6) {
    // Saturday - market is closed
    isClosed = true
    // Next open is Sunday 21:00 UTC
    nextOpenTime = new Date(now)
    nextOpenTime.setUTCDate(now.getUTCDate() + 1)
    nextOpenTime.setUTCHours(21, 0, 0, 0)
  } else if (utcDay === 0) {
    // Sunday
    if (utcHour < 21) {
      // Before 21:00 UTC - still closed
      isClosed = true
      nextOpenTime = new Date(now)
      nextOpenTime.setUTCHours(21, 0, 0, 0)
    }
  } else if (utcDay === 5 && utcHour >= 21) {
    // Friday after 21:00 UTC - closed
    isClosed = true
    // Next open is Sunday 21:00 UTC
    nextOpenTime = new Date(now)
    nextOpenTime.setUTCDate(now.getUTCDate() + 2)
    nextOpenTime.setUTCHours(21, 0, 0, 0)
  }

  return { isClosed, nextOpenTime }
}

function getTimeUntilOpen(nextOpenTime: Date): string {
  const now = new Date()
  const diff = nextOpenTime.getTime() - now.getTime()

  if (diff <= 0) return ""

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.join(" ")
}

async function fetchForexData(): Promise<ForexAsset[]> {
  const { isClosed, nextOpenTime } = isForexMarketClosed()
  const nextOpenStr = nextOpenTime ? getTimeUntilOpen(nextOpenTime) : ""

  // Using fallback values - in production you'd use a paid forex API
  const priceData: Record<string, { price: number; change: number }> = {
    EURUSD: { price: 1.0852, change: 0.08 },
    XAUUSD: { price: 2648.50, change: 0.32 },
    XAGUSD: { price: 31.18, change: -0.15 },
  }

  return FOREX_SYMBOLS.map((asset) => {
    const data = priceData[asset.symbol] || { price: 0, change: 0 }
    
    // Add slight random variation to simulate price movement when market is open
    let price = data.price
    let change = data.change
    
    if (!isClosed) {
      // Small random variation (-0.05% to +0.05%)
      const variation = (Math.random() - 0.5) * 0.001
      price = price * (1 + variation)
      change = data.change + (Math.random() - 0.5) * 0.1
    }

    const formattedPrice = asset.symbol === "EURUSD" 
      ? price.toFixed(4) 
      : price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return {
      symbol: asset.symbol,
      name: asset.name,
      price: formattedPrice,
      change: isClosed ? "Market Closed" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
      isPositive: change >= 0,
      tradingViewSymbol: asset.tradingView,
      rawPrice: price,
      isWeekend: isClosed,
      nextOpenTime: isClosed && nextOpenStr ? nextOpenStr : undefined,
    }
  })
}

export async function GET() {
  const data = await fetchForexData()
  const { isClosed, nextOpenTime } = isForexMarketClosed()
  
  return NextResponse.json({ 
    data,
    isMarketClosed: isClosed,
    nextOpenTime: nextOpenTime ? getTimeUntilOpen(nextOpenTime) : null,
  })
}
