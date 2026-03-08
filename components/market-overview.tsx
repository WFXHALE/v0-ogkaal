"use client"

import { useState, useEffect, useRef } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MarketAsset {
  symbol: string
  name: string
  price: string
  change: string
  isPositive: boolean
  tradingViewSymbol: string
}

const forexData: MarketAsset[] = [
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    price: "1.0847",
    change: "+0.12%",
    isPositive: true,
    tradingViewSymbol: "FX:EURUSD",
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    price: "1.2654",
    change: "-0.08%",
    isPositive: false,
    tradingViewSymbol: "FX:GBPUSD",
  },
  {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    price: "2,342.50",
    change: "+0.45%",
    isPositive: true,
    tradingViewSymbol: "OANDA:XAUUSD",
  },
]

const cryptoData: MarketAsset[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "67,245.00",
    change: "+2.34%",
    isPositive: true,
    tradingViewSymbol: "BINANCE:BTCUSDT",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: "3,456.78",
    change: "+1.87%",
    isPositive: true,
    tradingViewSymbol: "BINANCE:ETHUSDT",
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: "142.35",
    change: "-0.54%",
    isPositive: false,
    tradingViewSymbol: "BINANCE:SOLUSDT",
  },
]

function AssetCard({
  asset,
  isSelected,
  onClick,
}: {
  asset: MarketAsset
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all duration-300 text-left ${
        isSelected
          ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
          : "bg-secondary/50 border-border/50 hover:border-primary/30 hover:bg-secondary/70"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-base font-semibold text-foreground">{asset.symbol}</span>
        <span className="text-xs text-muted-foreground">{asset.name}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-base font-bold text-foreground">{asset.price}</span>
        <div className={`flex items-center gap-1 ${asset.isPositive ? "text-green-500" : "text-red-500"}`}>
          {asset.isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span className="text-xs font-medium">{asset.change}</span>
        </div>
      </div>
    </button>
  )
}

function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    setIsLoading(true)
    
    // Clear existing content
    containerRef.current.innerHTML = ""

    // Create widget container
    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widgetInner = document.createElement("div")
    widgetInner.className = "tradingview-widget-container__widget"
    widgetInner.style.height = "100%"
    widgetInner.style.width = "100%"
    widgetContainer.appendChild(widgetInner)

    containerRef.current.appendChild(widgetContainer)

    // Create and load script
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(17, 17, 17, 1)",
      gridColor: "rgba(255, 255, 255, 0.06)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    })

    script.onload = () => {
      setTimeout(() => setIsLoading(false), 500)
    }

    widgetContainer.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [symbol])

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-border/50 bg-[#111]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading chart...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

export function MarketOverview() {
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(forexData[0])

  return (
    <section className="py-12 px-4 border-y border-border/50 bg-card/50">
      <div className="max-w-6xl mx-auto">
        {/* Forex & Commodities Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Forex & Commodities</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forexData.map((asset) => (
              <AssetCard
                key={asset.symbol}
                asset={asset}
                isSelected={selectedAsset.tradingViewSymbol === asset.tradingViewSymbol}
                onClick={() => setSelectedAsset(asset)}
              />
            ))}
          </div>
        </div>

        {/* Crypto Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Crypto Market</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cryptoData.map((asset) => (
              <AssetCard
                key={asset.symbol}
                asset={asset}
                isSelected={selectedAsset.tradingViewSymbol === asset.tradingViewSymbol}
                onClick={() => setSelectedAsset(asset)}
              />
            ))}
          </div>
        </div>

        {/* TradingView Chart */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Chart</h2>
            <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
              {selectedAsset.symbol}
            </span>
          </div>
          <TradingViewChart symbol={selectedAsset.tradingViewSymbol} />
        </div>
      </div>
    </section>
  )
}
