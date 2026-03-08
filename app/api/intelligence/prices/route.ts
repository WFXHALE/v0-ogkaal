import { NextResponse } from "next/server"

interface PriceData {
  symbol: string
  name: string
  price: string
  change: string
  changePercent: string
  isPositive: boolean
  lastUpdate: string
}

// Fetch from multiple sources with fallbacks
async function fetchBinancePrice(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      { next: { revalidate: 10 } }
    )
    if (!response.ok) return null
    const data = await response.json()
    return {
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChangePercent),
    }
  } catch {
    return null
  }
}

async function fetchForexPrice(pair: string): Promise<{ price: number; change: number } | null> {
  try {
    // Using exchangerate.host as a free forex API
    const response = await fetch(
      `https://api.exchangerate.host/latest?base=${pair.slice(0, 3)}&symbols=${pair.slice(3)}`,
      { next: { revalidate: 30 } }
    )
    if (!response.ok) return null
    const data = await response.json()
    const rate = data.rates?.[pair.slice(3)]
    if (!rate) return null
    return { price: rate, change: 0 }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const results: PriceData[] = []
    const timestamp = new Date().toISOString()

    // Fetch Bitcoin from Binance
    const btcData = await fetchBinancePrice("BTCUSDT")
    if (btcData) {
      results.push({
        symbol: "BTCUSD",
        name: "Bitcoin",
        price: btcData.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: btcData.change >= 0 ? `+${btcData.change.toFixed(2)}%` : `${btcData.change.toFixed(2)}%`,
        changePercent: btcData.change.toFixed(2),
        isPositive: btcData.change >= 0,
        lastUpdate: timestamp,
      })
    }

    // Fetch Gold (XAUUSD) - using Binance PAXG as proxy or fallback
    const goldData = await fetchBinancePrice("PAXGUSDT")
    if (goldData) {
      results.push({
        symbol: "XAUUSD",
        name: "Gold",
        price: goldData.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: goldData.change >= 0 ? `+${goldData.change.toFixed(2)}%` : `${goldData.change.toFixed(2)}%`,
        changePercent: goldData.change.toFixed(2),
        isPositive: goldData.change >= 0,
        lastUpdate: timestamp,
      })
    }

    // Fetch EUR/USD
    const eurusdData = await fetchForexPrice("EURUSD")
    if (eurusdData) {
      results.push({
        symbol: "EURUSD",
        name: "EUR/USD",
        price: eurusdData.price.toFixed(5),
        change: "+0.00%",
        changePercent: "0.00",
        isPositive: true,
        lastUpdate: timestamp,
      })
    }

    // Fetch ETH for additional data
    const ethData = await fetchBinancePrice("ETHUSDT")
    if (ethData) {
      results.push({
        symbol: "ETHUSD",
        name: "Ethereum",
        price: ethData.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: ethData.change >= 0 ? `+${ethData.change.toFixed(2)}%` : `${ethData.change.toFixed(2)}%`,
        changePercent: ethData.change.toFixed(2),
        isPositive: ethData.change >= 0,
        lastUpdate: timestamp,
      })
    }

    // Add DXY placeholder (requires paid API for real data)
    results.push({
      symbol: "DXY",
      name: "US Dollar Index",
      price: "104.50",
      change: "+0.15%",
      changePercent: "0.15",
      isPositive: true,
      lastUpdate: timestamp,
    })

    return NextResponse.json({
      success: true,
      data: results,
      timestamp,
    })
  } catch (error) {
    console.error("Price API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch prices" },
      { status: 500 }
    )
  }
}
