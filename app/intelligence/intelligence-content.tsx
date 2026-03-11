"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { 
  TrendingUp, TrendingDown, Minus, RefreshCw, Newspaper, 
  Calendar, BarChart3, Activity, Clock,
  ArrowUpRight, ArrowDownRight, ExternalLink, DollarSign,
  Bitcoin, IndianRupee, ArrowUp, ArrowDown, GitCompare
} from "lucide-react"
import { useState, useEffect } from "react"
import { TradingSessionsPanel } from "./trading-sessions-panel"

const fetcher = (url: string) => fetch(url).then(res => res.json())

type Tab = "forex" | "crypto" | "indian"

// ── Market Status Indicator ────────────────────────────────────────────────

function getMarketStatus(tab: Tab, now: Date): { open: boolean; label: string; countdown?: string } {
  if (tab === "crypto") return { open: true, label: "Market Open" }

  if (tab === "forex") {
    // Forex: open Mon 00:00 UTC → Fri 22:00 UTC
    const day = now.getUTCDay()   // 0=Sun 1=Mon…6=Sat
    const h   = now.getUTCHours()
    const m   = now.getUTCMinutes()
    const s   = now.getUTCSeconds()
    const isOpen = (day > 0 && day < 5) || (day === 5 && (h < 22 || (h === 22 && m === 0 && s === 0)))

    if (isOpen) return { open: true, label: "Market Open" }

    // Calculate seconds until next Mon 00:00 UTC
    const daysUntilMon = (8 - day) % 7 || 7
    const secToMidnight = (23 - h) * 3600 + (59 - m) * 60 + (60 - s)
    const secUntilOpen = (daysUntilMon - 1) * 86400 + secToMidnight
    const hh = String(Math.floor(secUntilOpen / 3600)).padStart(2, "0")
    const mm = String(Math.floor((secUntilOpen % 3600) / 60)).padStart(2, "0")
    return { open: false, label: "Market Closed", countdown: `${hh}:${mm}` }
  }

  if (tab === "indian") {
    // Indian: 9:15 AM – 3:30 PM IST (IST = UTC+5:30)
    const istOffset = 5 * 60 + 30 // minutes
    const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
    const istMin = (utcMin + istOffset) % (24 * 60)
    const istDay = now.getUTCDay() // approximate — close enough for IST

    const openMin  = 9 * 60 + 15   // 9:15 AM
    const closeMin = 15 * 60 + 30  // 3:30 PM

    const isWeekday = istDay >= 1 && istDay <= 5
    const isOpen = isWeekday && istMin >= openMin && istMin < closeMin

    if (isOpen) return { open: true, label: "Market Open" }

    // Countdown to next open
    let secUntilOpen: number
    if (isWeekday && istMin < openMin) {
      secUntilOpen = (openMin - istMin) * 60 - now.getUTCSeconds()
    } else {
      // Next weekday 9:15 AM IST
      const daysAhead = istDay === 5 ? 3 : istDay === 6 ? 2 : 1
      const remainingTodayMin = 24 * 60 - istMin
      secUntilOpen = (remainingTodayMin + (daysAhead - 1) * 24 * 60 + openMin) * 60 - now.getUTCSeconds()
    }
    const hh = String(Math.floor(secUntilOpen / 3600)).padStart(2, "0")
    const mm = String(Math.floor((secUntilOpen % 3600) / 60)).padStart(2, "0")
    return { open: false, label: "Market Closed", countdown: `${hh}:${mm}` }
  }

  return { open: false, label: "Market Closed" }
}

function MarketStatusBadge({ tab }: { tab: Tab }) {
  const [status, setStatus] = useState<ReturnType<typeof getMarketStatus> | null>(null)

  useEffect(() => {
    const tick = () => setStatus(getMarketStatus(tab, new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tab])

  if (!status) return null

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          status.open
            ? "bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.6)] animate-pulse"
            : "bg-red-400 shadow-[0_0_6px_2px_rgba(248,113,113,0.6)] animate-pulse"
        }`}
      />
      <span className={status.open ? "text-green-400" : "text-red-400"}>
        {status.label}
      </span>
      {!status.open && status.countdown && (
        <span className="text-muted-foreground font-mono text-xs ml-1">
          Opens in: {status.countdown}
        </span>
      )}
    </div>
  )
}

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

// ── Market Correlations ────────────────────────────────────────────────────────

type CorrelationType = "positive" | "inverse"

interface Correlation {
  pair: [string, string]
  pairLabel: [string, string]  // human-readable names
  type: CorrelationType
  explanation: string
  // Two direction rules shown as arrow lines
  rules: [string, string]
}

const CORRELATIONS: Correlation[] = [
  {
    pair: ["XAUUSD", "DXY"],
    pairLabel: ["Gold (XAUUSD)", "DXY"],
    type: "inverse",
    explanation: "When the US Dollar strengthens, Gold moves bearish. A weakening Dollar pushes Gold bullish as it becomes cheaper for holders of other currencies.",
    rules: ["Gold ↑  →  DXY ↓", "DXY ↑  →  Gold ↓"],
  },
  {
    pair: ["XAUUSD", "XAGUSD"],
    pairLabel: ["Gold (XAUUSD)", "Silver (XAGUSD)"],
    type: "positive",
    explanation: "Both precious metals react similarly to inflation, economic uncertainty, and risk-off sentiment. They move in the same direction.",
    rules: ["Gold ↑  →  Silver ↑", "Gold ↓  →  Silver ↓"],
  },
  {
    pair: ["BTC", "ETH"],
    pairLabel: ["Bitcoin (BTC)", "Ethereum (ETH)"],
    type: "positive",
    explanation: "As the two dominant cryptocurrencies they share the same investor sentiment cycle. Bitcoin typically leads and Ethereum follows closely.",
    rules: ["Bitcoin ↑  →  Ethereum ↑", "Bitcoin ↓  →  Ethereum ↓"],
  },
  {
    pair: ["EURUSD", "GBPUSD"],
    pairLabel: ["EURUSD", "GBPUSD"],
    type: "positive",
    explanation: "Both pairs share the US Dollar as their quote currency. Dollar strength or weakness drives both pairs in the same direction simultaneously.",
    rules: ["EURUSD ↑  →  GBPUSD ↑", "EURUSD ↓  →  GBPUSD ↓"],
  },
  {
    pair: ["USDJPY", "XAUUSD"],
    pairLabel: ["USDJPY", "Gold (XAUUSD)"],
    type: "inverse",
    explanation: "A rising USDJPY signals broad USD strength, which typically weighs on Gold. Both react inversely to safe-haven demand shifts.",
    rules: ["USDJPY ↑  →  Gold ↓", "USDJPY ↓  →  Gold ↑"],
  },
  {
    pair: ["AUDUSD", "XAUUSD"],
    pairLabel: ["AUDUSD", "Gold (XAUUSD)"],
    type: "positive",
    explanation: "Australia is a major Gold exporter, so rising Gold prices support the AUD. Both assets also respond positively to risk-on environments.",
    rules: ["AUDUSD ↑  →  Gold ↑", "AUDUSD ↓  →  Gold ↓"],
  },
  {
    pair: ["EURJPY", "GBPJPY"],
    pairLabel: ["EURJPY", "GBPJPY"],
    type: "positive",
    explanation: "Both are Yen cross pairs. Yen weakness or strength moves both in tandem since the JPY is the shared quote currency.",
    rules: ["EURJPY ↑  →  GBPJPY ↑", "EURJPY ↓  →  GBPJPY ↓"],
  },
  {
    pair: ["USDJPY", "DXY"],
    pairLabel: ["USDJPY", "DXY"],
    type: "positive",
    explanation: "The Yen is a safe-haven currency that weakens when the Dollar strengthens broadly. USDJPY rises alongside DXY in most Dollar-driven moves.",
    rules: ["DXY ↑  →  USDJPY ↑", "DXY ↓  →  USDJPY ↓"],
  },
  {
    pair: ["BTC", "NDX"],
    pairLabel: ["Bitcoin (BTC)", "Nasdaq (NDX)"],
    type: "positive",
    explanation: "Bitcoin has developed a strong correlation with tech equities. Risk-on flows into Nasdaq often coincide with Bitcoin rallies.",
    rules: ["Nasdaq ↑  →  Bitcoin ↑", "Nasdaq ↓  →  Bitcoin ↓"],
  },
]

function MarketCorrelations() {
  return (
    <section className="space-y-3">
      {CORRELATIONS.map(c => {
        const isInverse = c.type === "inverse"
        const accentColor = isInverse ? "red" : "green"
        return (
          <div
            key={c.pair.join("-")}
            className={`rounded-2xl border bg-card hover:border-primary/30 transition-colors overflow-hidden ${
              isInverse ? "border-red-500/20" : "border-green-500/20"
            }`}
          >
            {/* Horizontal layout — all content in one row on desktop */}
            <div className="flex flex-col sm:flex-row sm:items-stretch">

              {/* LEFT — Asset pair identifiers */}
              <div className={`flex items-center gap-3 px-5 py-4 sm:min-w-[240px] sm:border-r ${
                isInverse
                  ? "bg-red-500/5 border-red-500/15"
                  : "bg-green-500/5 border-green-500/15"
              }`}>
                {/* Asset A */}
                <div className="text-center">
                  <span className="block font-mono text-sm font-bold text-primary">{c.pair[0]}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight max-w-[80px]">{c.pairLabel[0]}</span>
                </div>

                {/* Arrow connector */}
                <div className={`flex flex-col items-center gap-0.5 px-1 shrink-0`}>
                  <span className={`text-lg font-black leading-none ${isInverse ? "text-red-400" : "text-green-400"}`}>⇄</span>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isInverse
                      ? "bg-red-500/10 border-red-500/25 text-red-400"
                      : "bg-green-500/10 border-green-500/25 text-green-400"
                  }`}>
                    {isInverse ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />}
                    {isInverse ? "Inverse" : "Positive"}
                  </div>
                </div>

                {/* Asset B */}
                <div className="text-center">
                  <span className="block font-mono text-sm font-bold text-primary">{c.pair[1]}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight max-w-[80px]">{c.pairLabel[1]}</span>
                </div>
              </div>

              {/* MIDDLE — Direction rules */}
              <div className="flex flex-col justify-center gap-2 px-5 py-4 sm:w-[220px] sm:border-r border-border/40 shrink-0">
                {c.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isInverse ? "bg-red-400" : "bg-green-400"}`} />
                    <span className={`text-xs font-mono font-semibold tracking-tight ${
                      isInverse ? "text-red-300" : "text-green-300"
                    }`}>
                      {rule}
                    </span>
                  </div>
                ))}
              </div>

              {/* RIGHT — Explanation */}
              <div className="flex items-center px-5 py-4 flex-1">
                <p className="text-xs text-muted-foreground leading-relaxed">{c.explanation}</p>
              </div>

            </div>
          </div>
        )
      })}

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground italic px-1 pt-1">
        Correlations are dynamic and may weaken or break during major macro events. Always confirm with current price action and your own analysis.
      </p>
    </section>
  )
}

// Forex assets — Gold and DXY only
const FOREX_ASSETS = [
  { symbol: "XAUUSD", name: "Gold",            tvSymbol: "TVC:GOLD" },
  { symbol: "DXY",    name: "US Dollar Index", tvSymbol: "TVC:DXY"  },
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

// Indian indices — only NIFTY 50 and Bank NIFTY
const INDIAN_INDICES = [
  { symbol: "NIFTY50",   name: "NIFTY 50",   tvSymbol: "NSE:NIFTY"     },
  { symbol: "BANKNIFTY", name: "Bank NIFTY", tvSymbol: "NSE:BANKNIFTY" },
]

export function IntelligenceContent() {
  const [activeTab, setActiveTab] = useState<Tab>("forex")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

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

  // Fetch forex data — 15s refresh
  const { data: forexData, mutate: mutateForex, isValidating: forexLoading } = useSWR(
    activeTab === "forex" ? "/api/intelligence/forex" : null,
    fetcher,
    { refreshInterval: 15000 }
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
      price: price < 1 ? `$${price.toFixed(4)}` : price < 100 ? `$${price.toFixed(2)}` : `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
      changePercent: `${change.toFixed(2)}%`,
      isPositive: change >= 0,
      bias: change > 2 ? "Bullish" : change < -2 ? "Bearish" : "Neutral",
      volume: volume > 1e9 ? `$${(volume / 1e9).toFixed(2)}B` : `$${(volume / 1e6).toFixed(2)}M`,
    }
  }).filter(Boolean) as MarketAsset[] : []

  // Process forex data — empty until mounted to prevent SSR/client order mismatch
  const forexAssets: MarketAsset[] = mounted ? (forexData?.data || []) : []

  // Process Indian data — empty until mounted to prevent SSR/client order mismatch
  const indianAssets: MarketAsset[] = mounted ? (indianData?.data || []) : []

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
    if (!lastRefresh) return ""
    // Use explicit options to produce identical output on server and client
    return lastRefresh.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
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
      <main className="pt-16 sm:pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Market Intelligence</h1>
                <MarketStatusBadge tab={activeTab} />
              </div>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Real-time market data and analysis
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground min-w-0 flex-1 sm:flex-none">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span suppressHydrationWarning className="truncate">Updated: {formatLastRefresh()}</span>
              </div>
              <Button
                onClick={handleRefreshAll}
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="border-primary/50 shrink-0"
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
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-6 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                activeTab === "forex"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Forex</span>
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-6 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                activeTab === "crypto"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bitcoin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Crypto</span>
            </button>
            <button
              onClick={() => setActiveTab("indian")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-6 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                activeTab === "indian"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline">Indian </span><span>Markets</span>
            </button>
          </div>

          {/* Live Prices Grid */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4" suppressHydrationWarning>
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground" suppressHydrationWarning>
                {mounted ? (activeTab === "forex" ? "Forex & Commodities" : activeTab === "crypto" ? "Top 10 Cryptocurrencies" : "Indian Indices") : "Forex & Commodities"}
              </h2>
              {mounted && (cryptoLoading || forexLoading || indianLoading) && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* Always render the same skeleton on SSR; swap to real grid after mount */}
            <div suppressHydrationWarning>
              {!mounted ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="p-8 rounded-xl bg-card border border-border animate-pulse">
                    <div className="h-5 w-20 bg-muted rounded mb-2" />
                    <div className="h-4 w-32 bg-muted rounded mb-3" />
                    <div className="h-10 w-48 bg-muted rounded mb-2" />
                    <div className="h-6 w-24 bg-muted rounded" />
                  </div>
                  <div className="p-8 rounded-xl bg-card border border-border animate-pulse">
                    <div className="h-5 w-20 bg-muted rounded mb-2" />
                    <div className="h-4 w-32 bg-muted rounded mb-3" />
                    <div className="h-10 w-48 bg-muted rounded mb-2" />
                    <div className="h-6 w-24 bg-muted rounded" />
                  </div>
                </div>
              ) : (
                <div className={`grid gap-4 ${
                  activeTab === "forex"
                    ? "grid-cols-1 sm:grid-cols-2"
                    : activeTab === "crypto"
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                }`}>
                  {getCurrentAssets().length > 0 ? getCurrentAssets().map((item) => (
                    <div
                      key={item.symbol}
                      className={`rounded-xl bg-card border border-border hover:border-primary/50 transition-all ${
                        activeTab === "forex" ? "p-8" : "p-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-semibold text-primary ${activeTab === "forex" ? "text-base" : "text-xs"}`}>
                          {item.symbol}
                        </span>
                        {item.isPositive ? (
                          <ArrowUpRight className={activeTab === "forex" ? "w-6 h-6 text-green-500" : "w-4 h-4 text-green-500"} />
                        ) : (
                          <ArrowDownRight className={activeTab === "forex" ? "w-6 h-6 text-red-500" : "w-4 h-4 text-red-500"} />
                        )}
                      </div>
                      <p className={`text-muted-foreground mb-2 ${activeTab === "forex" ? "text-base" : "text-sm"}`}>
                        {item.name}
                      </p>
                      <p className={`font-bold text-foreground ${activeTab === "forex" ? "text-4xl mb-4" : "text-xl"}`}>
                        {item.price}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`font-medium ${item.isPositive ? "text-green-500" : "text-red-500"} ${
                          activeTab === "forex" ? "text-xl" : "text-sm"
                        }`}>
                          {item.change}
                        </p>
                        {item.bias && (
                          <span className={`px-2 py-0.5 rounded ${activeTab === "forex" ? "text-sm" : "text-xs"} ${
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
                    Array.from({ length: activeTab === "forex" ? 2 : activeTab === "crypto" ? 10 : 2 }).map((_, i) => (
                      <div key={i} className={`rounded-xl bg-card border border-border animate-pulse ${
                        activeTab === "forex" ? "p-8" : "p-4"
                      }`}>
                        <div className={`bg-muted rounded mb-2 ${activeTab === "forex" ? "h-5 w-20" : "h-4 w-12"}`} />
                        <div className={`bg-muted rounded mb-3 ${activeTab === "forex" ? "h-4 w-32" : "h-3 w-20"}`} />
                        <div className={`bg-muted rounded mb-2 ${activeTab === "forex" ? "h-10 w-48" : "h-6 w-24"}`} />
                        <div className={`bg-muted rounded ${activeTab === "forex" ? "h-6 w-24" : "h-4 w-16"}`} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
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
                className="w-full h-[320px] sm:h-[500px]"
                allowFullScreen
              />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
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
            {/* Trading Sessions Panel — always visible, all tabs */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Trading Sessions</h2>
              </div>
              <TradingSessionsPanel />
            </section>

            {/* Market Correlations — always visible */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <GitCompare className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Market Correlations</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5 max-w-2xl leading-relaxed">
                Understanding how assets move relative to each other helps traders confirm directional bias before entering a trade. Use these relationships as confluence, not as standalone signals.
              </p>
              <MarketCorrelations />
            </section>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
