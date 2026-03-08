"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import useSWR from "swr"

interface MarketAsset {
  symbol: string
  name: string
  price: string
  change: string
  isPositive: boolean
  tradingViewSymbol: string
  isMarketOpen?: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function AssetCard({
  asset,
  isSelected,
  onClick,
  isLoading,
}: {
  asset: MarketAsset
  isSelected: boolean
  onClick: () => void
  isLoading?: boolean
}) {
  const isMarketClosed = asset.change === "Market Closed"

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
        {isLoading ? (
          <div className="w-16 h-5 bg-muted/50 rounded animate-pulse" />
        ) : (
          <span className="text-base font-bold text-foreground">{asset.price}</span>
        )}
        {isLoading ? (
          <div className="w-12 h-4 bg-muted/50 rounded animate-pulse mt-1" />
        ) : isMarketClosed ? (
          <span className="text-xs text-muted-foreground">{asset.change}</span>
        ) : (
          <div className={`flex items-center gap-1 ${asset.isPositive ? "text-green-500" : "text-red-500"}`}>
            {asset.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-medium">{asset.change}</span>
          </div>
        )}
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

function MarketSection({
  title,
  assets,
  selectedAsset,
  onSelectAsset,
  isLoading,
  isLive,
  onRefresh,
}: {
  title: string
  assets: MarketAsset[]
  selectedAsset: MarketAsset
  onSelectAsset: (asset: MarketAsset) => void
  isLoading: boolean
  isLive: boolean
  onRefresh?: () => void
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg hover:bg-secondary/70 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
            <span className="text-sm text-muted-foreground">{isLive ? "Live" : "Delayed"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <AssetCard
            key={asset.symbol}
            asset={asset}
            isSelected={selectedAsset.tradingViewSymbol === asset.tradingViewSymbol}
            onClick={() => onSelectAsset(asset)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}

// Default fallback data
const defaultForexData: MarketAsset[] = [
  { symbol: "EURUSD", name: "Euro / US Dollar", price: "1.0850", change: "+0.08%", isPositive: true, tradingViewSymbol: "FX:EURUSD" },
  { symbol: "XAUUSD", name: "Gold / US Dollar", price: "2,650.00", change: "+0.32%", isPositive: true, tradingViewSymbol: "OANDA:XAUUSD" },
  { symbol: "XAGUSD", name: "Silver / US Dollar", price: "31.25", change: "-0.15%", isPositive: false, tradingViewSymbol: "OANDA:XAGUSD" },
]

const defaultCryptoData: MarketAsset[] = [
  { symbol: "BTC", name: "Bitcoin", price: "97,500.00", change: "+2.34%", isPositive: true, tradingViewSymbol: "BINANCE:BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", price: "3,650.00", change: "+1.87%", isPositive: true, tradingViewSymbol: "BINANCE:ETHUSDT" },
  { symbol: "SOL", name: "Solana", price: "195.50", change: "+3.25%", isPositive: true, tradingViewSymbol: "BINANCE:SOLUSDT" },
]

const defaultIndianData: MarketAsset[] = [
  { symbol: "NIFTY50", name: "NIFTY 50", price: "24,850.00", change: "+0.45%", isPositive: true, tradingViewSymbol: "NSE:NIFTY" },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", price: "53,200.00", change: "+0.62%", isPositive: true, tradingViewSymbol: "NSE:BANKNIFTY" },
]

export function MarketOverview() {
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(defaultCryptoData[0])

  // Fetch real-time crypto data
  const { data: cryptoResponse, isLoading: cryptoLoading, mutate: refreshCrypto } = useSWR(
    "/api/market/crypto",
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: true }
  )

  // Fetch forex data
  const { data: forexResponse, isLoading: forexLoading, mutate: refreshForex } = useSWR(
    "/api/market/forex",
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: true }
  )

  // Fetch Indian market data
  const { data: indianResponse, isLoading: indianLoading, mutate: refreshIndian } = useSWR(
    "/api/market/indian",
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  )

  const cryptoData = cryptoResponse?.data || defaultCryptoData
  const forexData = forexResponse?.data || defaultForexData
  const indianData = indianResponse?.data || defaultIndianData

  const handleRefreshAll = useCallback(() => {
    refreshCrypto()
    refreshForex()
    refreshIndian()
  }, [refreshCrypto, refreshForex, refreshIndian])

  return (
    <section className="py-12 px-4 border-y border-border/50 bg-card/50">
      <div className="max-w-6xl mx-auto">
        {/* Crypto Section */}
        <MarketSection
          title="Crypto Market"
          assets={cryptoData}
          selectedAsset={selectedAsset}
          onSelectAsset={setSelectedAsset}
          isLoading={cryptoLoading}
          isLive={!cryptoLoading && !!cryptoResponse?.data}
          onRefresh={refreshCrypto}
        />

        {/* Forex & Commodities Section */}
        <MarketSection
          title="Forex & Commodities"
          assets={forexData}
          selectedAsset={selectedAsset}
          onSelectAsset={setSelectedAsset}
          isLoading={forexLoading}
          isLive={!forexLoading && !!forexResponse?.data}
          onRefresh={refreshForex}
        />

        {/* Indian Market Section */}
        <MarketSection
          title="Indian Market"
          assets={indianData}
          selectedAsset={selectedAsset}
          onSelectAsset={setSelectedAsset}
          isLoading={indianLoading}
          isLive={!indianLoading && indianResponse?.isMarketOpen}
          onRefresh={refreshIndian}
        />

        {/* TradingView Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Chart</h2>
              <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                {selectedAsset.symbol}
              </span>
            </div>
            <button
              onClick={handleRefreshAll}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh All
            </button>
          </div>
          <TradingViewChart symbol={selectedAsset.tradingViewSymbol} />
        </div>
      </div>
    </section>
  )
}
