"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { 
  TrendingUp, TrendingDown, Minus, RefreshCw, Newspaper, 
  Calendar, BarChart3, Activity, AlertTriangle, Clock,
  ArrowUpRight, ArrowDownRight, ExternalLink
} from "lucide-react"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface PriceData {
  symbol: string
  name: string
  price: string
  change: string
  changePercent: string
  isPositive: boolean
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

interface VolumeData {
  symbol: string
  name: string
  volume24h: string
  volumeChange: string
  isIncreasing: boolean
  avgVolume: string
  activity: "Very High" | "High" | "Normal" | "Low"
}

interface LiquidityZone {
  id: string
  pair: string
  type: "buy" | "sell"
  priceLevel: string
  strength: "Strong" | "Medium" | "Weak"
  volume: string
}

export default function IntelligencePage() {
  const [mounted, setMounted] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    setLastRefresh(new Date())
  }, [])

  // Fetch data with auto-refresh intervals
  const { data: pricesData, mutate: mutatePrices, isValidating: pricesLoading } = useSWR(
    "/api/intelligence/prices",
    fetcher,
    { refreshInterval: 15000 }
  )

  const { data: newsData, mutate: mutateNews, isValidating: newsLoading } = useSWR(
    "/api/intelligence/news",
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: calendarData, mutate: mutateCalendar, isValidating: calendarLoading } = useSWR(
    "/api/intelligence/calendar",
    fetcher,
    { refreshInterval: 300000 }
  )

  const { data: volumeData, mutate: mutateVolume, isValidating: volumeLoading } = useSWR(
    "/api/intelligence/volume",
    fetcher,
    { refreshInterval: 20000 }
  )

  const { data: liquidityData, mutate: mutateLiquidity, isValidating: liquidityLoading } = useSWR(
    "/api/intelligence/liquidity",
    fetcher,
    { refreshInterval: 30000 }
  )

  const prices: PriceData[] = pricesData?.data || []
  const news: NewsItem[] = newsData?.data || []
  const calendar: EconomicEvent[] = calendarData?.data || []
  const volume: VolumeData[] = volumeData?.data || []
  const liquidity: LiquidityZone[] = liquidityData?.data || []

  const handleRefreshAll = () => {
    mutatePrices()
    mutateNews()
    mutateCalendar()
    mutateVolume()
    mutateLiquidity()
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

  const isAnyLoading = pricesLoading || newsLoading || calendarLoading || volumeLoading || liquidityLoading

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
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
                Refresh All
              </Button>
            </div>
          </div>

          {/* Live Prices Grid */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Live Prices</h2>
              {pricesLoading && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {prices.length > 0 ? prices.map((item) => (
                <div
                  key={item.symbol}
                  className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    {item.isPositive ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-xl font-bold text-foreground">{item.price}</p>
                  <p className={`text-sm font-medium ${item.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {item.change}
                  </p>
                </div>
              )) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border animate-pulse">
                    <div className="h-4 w-16 bg-muted rounded mb-2" />
                    <div className="h-6 w-24 bg-muted rounded mb-1" />
                    <div className="h-4 w-12 bg-muted rounded" />
                  </div>
                ))
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
                src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE%3ABTCUSDT&interval=60&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=1a1a2e&studies=%5B%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&allow_symbol_change=1&watchlist=%5B%22BINANCE%3ABTCUSDT%22%2C%22BINANCE%3AETHUSDT%22%2C%22FX%3AEURUSD%22%2C%22TVC%3AGOLD%22%5D&details=1&hotlist=1&calendar=1"
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
                <h2 className="text-xl font-semibold text-foreground">Market News</h2>
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
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              item.category === "Crypto" ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"
                            }`}>
                              {item.category}
                            </span>
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

            {/* Economic Calendar */}
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
          </div>

          {/* Volume Activity */}
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Volume Activity</h2>
              {volumeLoading && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Asset</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">24h Volume</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Avg Volume</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Change</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {volume.length > 0 ? volume.map((item) => (
                      <tr key={item.symbol} className="hover:bg-secondary/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{item.symbol}</span>
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{item.volume24h}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.avgVolume}</td>
                        <td className={`px-4 py-3 font-medium ${item.isIncreasing ? "text-green-500" : "text-red-500"}`}>
                          {item.volumeChange}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.activity === "Very High"
                              ? "bg-red-500/20 text-red-400"
                              : item.activity === "High"
                              ? "bg-primary/20 text-primary"
                              : item.activity === "Normal"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {item.activity}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="px-4 py-3">
                            <div className="h-6 bg-muted rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Liquidity Zones */}
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Liquidity Zones</h2>
              {liquidityLoading && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Buy Zones */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-green-500 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Buy Zones (Support)
                </h3>
                {liquidity.filter(z => z.type === "buy").length > 0 ? (
                  <div className="space-y-3">
                    {liquidity.filter(z => z.type === "buy").map((zone) => (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{zone.pair}</p>
                          <p className="text-lg font-bold text-green-500">{zone.priceLevel}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            zone.strength === "Strong"
                              ? "bg-green-500/30 text-green-400"
                              : zone.strength === "Medium"
                              ? "bg-yellow-500/30 text-yellow-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {zone.strength}
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">{zone.volume}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                )}
              </div>

              {/* Sell Zones */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Sell Zones (Resistance)
                </h3>
                {liquidity.filter(z => z.type === "sell").length > 0 ? (
                  <div className="space-y-3">
                    {liquidity.filter(z => z.type === "sell").map((zone) => (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{zone.pair}</p>
                          <p className="text-lg font-bold text-red-500">{zone.priceLevel}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            zone.strength === "Strong"
                              ? "bg-red-500/30 text-red-400"
                              : zone.strength === "Medium"
                              ? "bg-yellow-500/30 text-yellow-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {zone.strength}
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">{zone.volume}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Auto-refresh indicator */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Data auto-refreshes every 15-60 seconds depending on the section</p>
          </div>
        </div>
      </main>
    </div>
  )
}
