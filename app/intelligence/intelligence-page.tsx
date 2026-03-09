"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { 
  TrendingUp, TrendingDown, Minus, RefreshCw, Newspaper, 
  Calendar, BarChart3, Activity, Clock,
  ArrowUpRight, ArrowDownRight, ExternalLink, DollarSign,
  Bitcoin, IndianRupee
} from "lucide-react"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

type Tab = "forex" | "crypto" | "indian"

interface MarketAsset {
  symbol: string
  name: string
  price: string
  change: string
  changePercent: string
  isPositive: boolean
  bias?: "Bullish" | "Bearish" | "Neutral"
  volume?: string
}

interface NewsItem {
  id: string
  headline: string
  source: string
  time: string
  impact: "bullish" | "bearish" | "neutral"
  category: string
  url?: string
}

interface EconomicEvent {
  id: string
  event: string
  country: string
  date: string
  time: string
  impact: "high" | "medium" | "low"
  forecast: string
  previous: string
}

// Forex assets
const FOREX_ASSETS = [
  { symbol: "XAUUSD", name: "Gold", tvSymbol: "TVC:GOLD" },
  { symbol: "DXY", name: "US Dollar Index", tvSymbol: "TVC:DXY" },
  { symbol: "EURUSD", name: "EUR/USD", tvSymbol: "FX:EURUSD" },
  { symbol: "GBPUSD", name: "GBP/USD", tvSymbol: "FX:GBPUSD" },
  { symbol: "XAGUSD", name: "Silver", tvSymbol: "TVC:SILVER" },
]

// Crypto assets (Top 10 by market cap)
const CRYPTO_ASSETS = [
  { symbol: "BTC", name: "Bitcoin", binanceSymbol: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", binanceSymbol: "ETHUSDT" },
  { symbol: "BNB", name: "BNB", binanceSymbol: "BNBUSDT" },
  { symbol: "SOL", name: "Solana", binanceSymbol: "SOLUSDT" },
  { symbol: "XRP", name: "XRP", binanceSymbol: "XRPUSDT" },
  { symbol: "ADA", name: "Cardano", binanceSymbol: "ADAUSDT" },
  { symbol: "DOGE", name: "Dogecoin", binanceSymbol: "DOGEUSDT" },
  { symbol: "AVAX", name: "Avalanche", binanceSymbol: "AVAXUSDT" },
  { symbol: "TON", name: "Toncoin", binanceSymbol: "TONUSDT" },
  { symbol: "LINK", name: "Chainlink", binanceSymbol: "LINKUSDT" },
]

// Indian indices
const INDIAN_INDICES = [
  { symbol: "NIFTY", name: "NIFTY 50", tvSymbol: "NSE:NIFTY" },
  { symbol: "BANKNIFTY", name: "Bank NIFTY", tvSymbol: "NSE:BANKNIFTY" },
  { symbol: "SENSEX", name: "BSE SENSEX", tvSymbol: "BSE:SENSEX" },
  { symbol: "FINNIFTY", name: "Fin NIFTY", tvSymbol: "NSE:FINNIFTY" },
]

export function IntelligencePageContent() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("forex")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    setLastRefresh(new Date())
  }, [])

  // Fetch crypto prices from Binance — 3s refresh
  const { data: cryptoData, mutate: mutateCrypto, isValidating: cryptoLoading } = useSWR(
    activeTab === "crypto" ? "https://api.binance.com/api/v3/ticker/24hr" : null,
    fetcher,
    { refreshInterval: 3000 }
  )

  // Fetch forex data — 60s (exchangerate.host + metals.live rate-limit friendly)
  const { data: forexData, mutate: mutateForex, isValidating: forexLoading } = useSWR(
    activeTab === "forex" ? "/api/intelligence/forex" : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  // Fetch Indian market data — 30s
  const { data: indianData, mutate: mutateIndian, isValidating: indianLoading } = useSWR(
    activeTab === "indian" ? "/api/market/indian" : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  // Fetch news — 3 min
  const { data: newsData, mutate: mutateNews, isValidating: newsLoading } = useSWR(
    `/api/intelligence/news?category=${activeTab}`,
    fetcher,
    { refreshInterval: 180000 }
  )

  // Fetch calendar — 10 min
  const { data: calendarData, mutate: mutateCalendar, isValidating: calendarLoading } = useSWR(
    "/api/intelligence/calendar",
    fetcher,
    { refreshInterval: 600000 }
  )



  // Process crypto data
  const cryptoAssets: MarketAsset[] = cryptoData ? CRYPTO_ASSETS.map(asset => {
    const ticker = cryptoData.find((t: { symbol: string }) => t.symbol === asset.binanceSymbol)
    if (!ticker) return null
    const price = parseFloat(ticker.lastPrice)
    const change = parseFloat(ticker.priceChangePercent)
    const volume = parseFloat(ticker.quoteVolume)
    return {
      symbol: asset.symbol,
      name: asset.name,
      price: price < 1 ? `$${price.toFixed(4)}` : price < 100 ? `$${price.toFixed(2)}` : `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
      changePercent: `${change.toFixed(2)}%`,
      isPositive: change >= 0,
      bias: change > 2 ? "Bullish" : change < -2 ? "Bearish" : "Neutral",
      volume: volume > 1e9 ? `$${(volume / 1e9).toFixed(2)}B` : `$${(volume / 1e6).toFixed(2)}M`,
    }
  }).filter(Boolean) as MarketAsset[] : []

  // Process forex data
  const forexAssets: MarketAsset[] = forexData?.data || FOREX_ASSETS.map(asset => ({
    symbol: asset.symbol,
    name: asset.name,
    price: "-",
    change: "-",
    changePercent: "-",
    isPositive: true,
    bias: "Neutral" as const,
  }))

  // Process Indian data
  const indianAssets: MarketAsset[] = indianData?.data || INDIAN_INDICES.map(idx => ({
    symbol: idx.symbol,
    name: idx.name,
    price: "-",
    change: "-",
    changePercent: "-",
    isPositive: true,
    bias: "Neutral" as const,
  }))

  const news: NewsItem[] = newsData?.data || []
  const calendar: EconomicEvent[] = calendarData?.data || []

  const handleRefreshAll = () => {
    if (activeTab === "crypto") mutateCrypto()
    if (activeTab === "forex") mutateForex()
    if (activeTab === "indian") mutateIndian()
    mutateNews()
    mutateCalendar()
    setLastRefresh(new Date())
  }

  const formatLastRefresh = () => {
    if (!mounted || !lastRefresh) return ""
    return lastRefresh.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const isAnyLoading = cryptoLoading || forexLoading || indianLoading || newsLoading || calendarLoading

  const getCurrentAssets = () => {
    switch (activeTab) {
      case "forex": return forexAssets
      case "crypto": return cryptoAssets
      case "indian": return indianAssets
      default: return []
    }
  }

  const getTradingViewSymbol = () => {
    switch (activeTab) {
      case "forex": return "TVC:GOLD"
      case "crypto": return "BINANCE:BTCUSDT"
      case "indian": return "NSE:NIFTY"
      default: return "BINANCE:BTCUSDT"
    }
  }

  const getWatchlist = () => {
    switch (activeTab) {
      case "forex":
        return FOREX_ASSETS.map(a => a.tvSymbol).join("%22%2C%22")
      case "crypto":
        return "BINANCE%3ABTCUSDT%22%2C%22BINANCE%3AETHUSDT%22%2C%22BINANCE%3ABNBUSDT%22%2C%22BINANCE%3ASOLUSDT"
      case "indian":
        return INDIAN_INDICES.map(i => i.tvSymbol).join("%22%2C%22")
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Market Intelligence</h1>
              <p className="text-muted-foreground mt-1">
                Real-time market data and analysis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last updated: {formatLastRefresh()}</span>
              </div>
              <Button
                onClick={handleRefreshAll}
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="border-primary/50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isAnyLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-secondary p-1 mb-8">
            <button
              onClick={() => setActiveTab("forex")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === "forex"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Forex
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === "crypto"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bitcoin className="w-4 h-4" />
              Crypto
            </button>
            <button
              onClick={() => setActiveTab("indian")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === "indian"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              Indian Markets
            </button>
          </div>

          {/* Live Prices Grid */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {activeTab === "forex" ? "Forex & Commodities" : activeTab === "crypto" ? "Top 10 Cryptocurrencies" : "Indian Indices"}
              </h2>
              {(cryptoLoading || forexLoading || indianLoading) && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* Forex & Commodities — TradingView Market Overview widget (live prices) */}
            {activeTab === "forex" && mounted && (
              <div className="rounded-xl overflow-hidden border border-border">
                <iframe
                  key="forex-market-overview"
                  src={`https://s.tradingview.com/embed-widget/market-overview/?locale=en#${encodeURIComponent(JSON.stringify({
                    colorTheme: "dark",
                    dateRange: "1D",
                    showChart: false,
                    locale: "en",
                    largeChartUrl: "",
                    isTransparent: false,
                    showSymbolLogo: true,
                    showFloatingTooltip: false,
                    width: "100%",
                    height: 460,
                    tabs: [
                      {
                        title: "Forex & Metals",
                        symbols: [
                          { s: "TVC:GOLD", d: "Gold" },
                          { s: "TVC:SILVER", d: "Silver" },
                          { s: "FX:EURUSD", d: "EUR/USD" },
                          { s: "FX:GBPUSD", d: "GBP/USD" },
                          { s: "FX:USDJPY", d: "USD/JPY" },
                          { s: "FX:GBPJPY", d: "GBP/JPY" },
                          { s: "FX:USDINR", d: "USD/INR" },
                          { s: "TVC:DXY", d: "DXY" },
                          { s: "TVC:USOIL", d: "Crude Oil" },
                        ],
                        originalTitle: "Forex",
                      },
                    ],
                    utm_source: "",
                    utm_medium: "widget",
                    utm_campaign: "market-overview",
                  }))}`}
                  style={{ width: "100%", height: "460px", border: "none" }}
                  allowFullScreen
                />
              </div>
            )}

            {/* Crypto — Binance cards */}
            {activeTab === "crypto" && (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {getCurrentAssets().length > 0 ? getCurrentAssets().map((item) => (
                  <div
                    key={item.symbol}
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-primary">{item.symbol}</span>
                      {item.isPositive ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{item.name}</p>
                    <p className="text-xl font-bold text-foreground">{item.price}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-sm font-medium ${item.isPositive ? "text-green-500" : "text-red-500"}`}>
                        {item.change}
                      </p>
                      {item.bias && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.bias === "Bullish" ? "bg-green-500/20 text-green-400" :
                          item.bias === "Bearish" ? "bg-red-500/20 text-red-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {item.bias}
                        </span>
                      )}
                    </div>
                    {item.volume && (
                      <p className="text-xs text-muted-foreground mt-1">Vol: {item.volume}</p>
                    )}
                  </div>
                )) : (
                  Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl bg-card border border-border animate-pulse">
                      <div className="h-4 w-12 bg-muted rounded mb-2" />
                      <div className="h-3 w-20 bg-muted rounded mb-2" />
                      <div className="h-6 w-24 bg-muted rounded mb-1" />
                      <div className="h-4 w-16 bg-muted rounded" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Indian Markets — TradingView Market Overview widget */}
            {activeTab === "indian" && mounted && (
              <div className="rounded-xl overflow-hidden border border-border">
                <iframe
                  key="indian-market-overview"
                  src={`https://s.tradingview.com/embed-widget/market-overview/?locale=en#${encodeURIComponent(JSON.stringify({
                    colorTheme: "dark",
                    dateRange: "1D",
                    showChart: false,
                    locale: "en",
                    isTransparent: false,
                    showSymbolLogo: true,
                    showFloatingTooltip: false,
                    width: "100%",
                    height: 340,
                    tabs: [
                      {
                        title: "Indian Markets",
                        symbols: [
                          { s: "NSE:NIFTY", d: "NIFTY 50" },
                          { s: "BSE:SENSEX", d: "SENSEX" },
                          { s: "NSE:BANKNIFTY", d: "Bank NIFTY" },
                          { s: "NSE:FINNIFTY", d: "Fin NIFTY" },
                        ],
                        originalTitle: "Indian",
                      },
                    ],
                    utm_source: "",
                    utm_medium: "widget",
                    utm_campaign: "market-overview",
                  }))}`}
                  style={{ width: "100%", height: "340px", border: "none" }}
                  allowFullScreen
                />
              </div>
            )}
          </section>

          {/* TradingView Chart */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Technical Analysis</h2>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <iframe
                key={activeTab}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${getTradingViewSymbol()}&interval=60&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=1a1a2e&studies=%5B%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&allow_symbol_change=1&watchlist=%5B%22${getWatchlist()}%22%5D&details=1&hotlist=1&calendar=1`}
                style={{ width: "100%", height: "500px" }}
                allowFullScreen
              />
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Market News */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  {activeTab === "forex" ? "Forex News" : activeTab === "crypto" ? "Crypto News" : "Indian Market News"}
                </h2>
                {newsLoading && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <div className="p-4 rounded-xl bg-card border border-border max-h-[400px] overflow-y-auto">
                {news.length > 0 ? (
                  <div className="space-y-4">
                    {news.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className={`p-1.5 rounded-full shrink-0 ${
                          item.impact === "bullish" 
                            ? "bg-green-500/20" 
                            : item.impact === "bearish"
                            ? "bg-red-500/20"
                            : "bg-muted"
                        }`}>
                          {item.impact === "bullish" ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : item.impact === "bearish" ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : (
                            <Minus className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium line-clamp-2">
                            {item.headline}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{item.source}</span>
                            <span className="text-xs text-muted-foreground">-</span>
                            <span className="text-xs text-muted-foreground">{item.time}</span>
                          </div>
                        </div>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-muted" />
                        <div className="flex-1">
                          <div className="h-4 w-full bg-muted rounded mb-2" />
                          <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Economic Calendar - only for Forex */}
            {activeTab === "forex" && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Economic Calendar</h2>
                  {calendarLoading && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div className="p-4 rounded-xl bg-card border border-border max-h-[400px] overflow-y-auto">
                  {calendar.length > 0 ? (
                    <div className="space-y-3">
                      {calendar.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full ${
                              event.impact === "high"
                                ? "bg-red-500"
                                : event.impact === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`} />
                            <div>
                              <p className="text-sm font-medium text-foreground">{event.event}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold">{event.country}</span>
                                <span>-</span>
                                <span>{event.date}</span>
                                <span>{event.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              F: <span className="text-foreground">{event.forecast}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              P: <span className="text-foreground">{event.previous}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Technical Overview - for Crypto and Indian */}
            {(activeTab === "crypto" || activeTab === "indian") && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Technical Overview</h2>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border max-h-[400px] overflow-y-auto">
                  <div className="space-y-3">
                    {getCurrentAssets().slice(0, 5).map((asset) => (
                      <div
                        key={asset.symbol}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{asset.symbol}</p>
                          <p className="text-sm text-muted-foreground">{asset.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-foreground">{asset.price}</p>
                            <p className={`text-sm ${asset.isPositive ? "text-green-500" : "text-red-500"}`}>
                              {asset.change}
                            </p>
                          </div>
                          {asset.bias && (
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              asset.bias === "Bullish" ? "bg-green-500/20 text-green-400" :
                              asset.bias === "Bearish" ? "bg-red-500/20 text-red-400" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {asset.bias}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>


        </div>
      </main>
      <Footer />
    </div>
  )
}
