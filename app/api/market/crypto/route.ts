import { NextResponse } from "next/server"

interface BinanceTickerResponse {
  symbol: string
  lastPrice: string
  priceChangePercent: string
}

interface CoinGeckoResponse {
  [key: string]: {
    usd: number
    usd_24h_change: number
  }
}

const CRYPTO_SYMBOLS = [
  { id: "bitcoin", binanceSymbol: "BTCUSDT", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", binanceSymbol: "ETHUSDT", symbol: "ETH", name: "Ethereum" },
  { id: "solana", binanceSymbol: "SOLUSDT", symbol: "SOL", name: "Solana" },
]

async function fetchBinanceData() {
  try {
    const symbols = CRYPTO_SYMBOLS.map((c) => c.binanceSymbol)
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`,
      { next: { revalidate: 10 } }
    )

    if (!response.ok) throw new Error("Binance API failed")

    const data: BinanceTickerResponse[] = await response.json()

    return CRYPTO_SYMBOLS.map((crypto) => {
      const ticker = data.find((t) => t.symbol === crypto.binanceSymbol)
      if (!ticker) throw new Error(`No data for ${crypto.symbol}`)

      const price = parseFloat(ticker.lastPrice)
      const change = parseFloat(ticker.priceChangePercent)

      return {
        symbol: crypto.symbol,
        name: crypto.name,
        price: formatPrice(price),
        change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        isPositive: change >= 0,
        tradingViewSymbol: `BINANCE:${crypto.binanceSymbol}`,
      }
    })
  } catch {
    return null
  }
}

async function fetchCoinGeckoData() {
  try {
    const ids = CRYPTO_SYMBOLS.map((c) => c.id).join(",")
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }
    )

    if (!response.ok) throw new Error("CoinGecko API failed")

    const data: CoinGeckoResponse = await response.json()

    return CRYPTO_SYMBOLS.map((crypto) => {
      const coinData = data[crypto.id]
      if (!coinData) throw new Error(`No data for ${crypto.symbol}`)

      const price = coinData.usd
      const change = coinData.usd_24h_change || 0

      return {
        symbol: crypto.symbol,
        name: crypto.name,
        price: formatPrice(price),
        change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        isPositive: change >= 0,
        tradingViewSymbol: `BINANCE:${crypto.binanceSymbol}`,
      }
    })
  } catch {
    return null
  }
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return price.toFixed(2)
}

export async function GET() {
  // Try Binance first
  let data = await fetchBinanceData()

  // Fallback to CoinGecko
  if (!data) {
    data = await fetchCoinGeckoData()
  }

  if (!data) {
    return NextResponse.json(
      { error: "Failed to fetch crypto data" },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, source: data ? "binance" : "coingecko" })
}
