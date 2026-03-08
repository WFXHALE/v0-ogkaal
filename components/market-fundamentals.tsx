"use client"

import { useState, useEffect } from "react"
import { Newspaper, Globe, TrendingUp, TrendingDown, Minus, Clock, RefreshCw, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewsItem {
  id: string
  asset: string
  assetType: "forex" | "crypto" | "gold" | "indices"
  headline: string
  impact: "bullish" | "bearish" | "neutral"
  source: string
  time: string
}

interface EconomicEvent {
  id: string
  event: string
  currency: string
  impact: "high" | "medium" | "low"
  time: string
  date: string
  actual?: string
  forecast?: string
  previous?: string
}

// Simulated news data - in production this would come from an API
const MARKET_NEWS: NewsItem[] = [
  { id: "1", asset: "Gold (XAUUSD)", assetType: "gold", headline: "US inflation concerns rise – Gold may strengthen as safe haven demand increases", impact: "bullish", source: "ForexLive", time: "2h ago" },
  { id: "2", asset: "Bitcoin (BTC)", assetType: "crypto", headline: "ETF inflows increase – bullish momentum continues as institutional adoption grows", impact: "bullish", source: "CoinDesk", time: "3h ago" },
  { id: "3", asset: "EUR/USD", assetType: "forex", headline: "ECB signals potential rate hold – Euro weakness expected in near term", impact: "bearish", source: "ForexFactory", time: "4h ago" },
  { id: "4", asset: "GBP/USD", assetType: "forex", headline: "UK employment data beats expectations – Pound strengthens on positive outlook", impact: "bullish", source: "Investing.com", time: "5h ago" },
  { id: "5", asset: "Ethereum (ETH)", assetType: "crypto", headline: "Network upgrade scheduled – Potential volatility expected around launch", impact: "neutral", source: "CryptoNews", time: "6h ago" },
  { id: "6", asset: "USD/JPY", assetType: "forex", headline: "BOJ maintains ultra-loose policy – Yen remains under pressure against dollar", impact: "bullish", source: "ForexLive", time: "7h ago" },
  { id: "7", asset: "Gold (XAUUSD)", assetType: "gold", headline: "Geopolitical tensions rise in Middle East – Gold demand surges", impact: "bullish", source: "Reuters", time: "8h ago" },
  { id: "8", asset: "S&P 500", assetType: "indices", headline: "Tech earnings beat estimates – Markets rally on strong corporate results", impact: "bullish", source: "Bloomberg", time: "9h ago" },
  { id: "9", asset: "Solana (SOL)", assetType: "crypto", headline: "Network congestion issues reported – Some traders move to alternatives", impact: "bearish", source: "CoinTelegraph", time: "10h ago" },
  { id: "10", asset: "AUD/USD", assetType: "forex", headline: "RBA minutes reveal hawkish stance – Australian dollar gains momentum", impact: "bullish", source: "ForexFactory", time: "12h ago" },
]

// Simulated economic calendar
const ECONOMIC_EVENTS: EconomicEvent[] = [
  { id: "1", event: "FOMC Meeting", currency: "USD", impact: "high", time: "19:00", date: "Today", forecast: "5.25%", previous: "5.25%" },
  { id: "2", event: "CPI Data (YoY)", currency: "USD", impact: "high", time: "13:30", date: "Tomorrow", forecast: "3.2%", previous: "3.4%" },
  { id: "3", event: "Non-Farm Payrolls", currency: "USD", impact: "high", time: "13:30", date: "Fri", forecast: "180K", previous: "175K" },
  { id: "4", event: "Interest Rate Decision", currency: "EUR", impact: "high", time: "12:45", date: "Thu", forecast: "4.50%", previous: "4.50%" },
  { id: "5", event: "PPI Data (MoM)", currency: "USD", impact: "medium", time: "13:30", date: "Wed", forecast: "0.2%", previous: "0.1%" },
  { id: "6", event: "Retail Sales", currency: "GBP", impact: "medium", time: "07:00", date: "Fri", forecast: "0.3%", previous: "-0.2%" },
  { id: "7", event: "Employment Change", currency: "AUD", impact: "medium", time: "00:30", date: "Thu", forecast: "25K", previous: "32K" },
  { id: "8", event: "GDP (QoQ)", currency: "EUR", impact: "high", time: "10:00", date: "Next Week", forecast: "0.2%", previous: "0.1%" },
]

export function MarketFundamentals() {
  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "forex" | "crypto" | "gold" | "indices">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredNews = activeFilter === "all" 
    ? MARKET_NEWS 
    : MARKET_NEWS.filter(item => item.assetType === activeFilter)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdated(new Date())
      setIsRefreshing(false)
    }, 1000)
  }

  const getImpactIcon = (impact: "bullish" | "bearish" | "neutral") => {
    switch (impact) {
      case "bullish": return <TrendingUp className="w-4 h-4 text-green-500" />
      case "bearish": return <TrendingDown className="w-4 h-4 text-red-500" />
      case "neutral": return <Minus className="w-4 h-4 text-yellow-500" />
    }
  }

  const getImpactColor = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high": return "bg-red-500"
      case "medium": return "bg-orange-500"
      case "low": return "bg-yellow-500"
    }
  }

  const getImpactBg = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high": return "bg-red-500/10 border-red-500/30"
      case "medium": return "bg-orange-500/10 border-orange-500/30"
      case "low": return "bg-yellow-500/10 border-yellow-500/30"
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Market Headlines Section */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Market Fundamentals</h3>
              <p className="text-sm text-muted-foreground">Top headlines affecting forex, crypto & commodities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: "all", label: "All" },
            { value: "forex", label: "Forex" },
            { value: "crypto", label: "Crypto" },
            { value: "gold", label: "Gold" },
            { value: "indices", label: "Indices" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value as typeof activeFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 gap-3">
          {filteredNews.map((news) => (
            <div 
              key={news.id} 
              className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-primary">{news.asset}</span>
                <div className="flex items-center gap-2">
                  {getImpactIcon(news.impact)}
                  <span className={`text-xs font-medium ${
                    news.impact === "bullish" ? "text-green-500" : 
                    news.impact === "bearish" ? "text-red-500" : "text-yellow-500"
                  }`}>
                    {news.impact.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-foreground mb-2 line-clamp-2">{news.headline}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{news.source}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {news.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Calendar Section */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Economic Calendar</h3>
            <p className="text-sm text-muted-foreground">Upcoming high-impact economic events</p>
          </div>
        </div>

        {/* Impact Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">High Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Medium Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Low Impact</span>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ECONOMIC_EVENTS.map((event) => (
            <div 
              key={event.id} 
              className={`p-4 rounded-lg border ${getImpactBg(event.impact)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-1 rounded">
                  {event.currency}
                </span>
                <div className={`w-2 h-2 rounded-full ${getImpactColor(event.impact)}`} />
              </div>
              <h4 className="font-semibold text-foreground text-sm mb-2">{event.event}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{event.date}</span>
                <span>{event.time} UTC</span>
              </div>
              {(event.forecast || event.previous) && (
                <div className="flex items-center gap-3 text-xs pt-2 border-t border-border/50">
                  {event.forecast && (
                    <div>
                      <span className="text-muted-foreground">Forecast: </span>
                      <span className="text-foreground font-medium">{event.forecast}</span>
                    </div>
                  )}
                  {event.previous && (
                    <div>
                      <span className="text-muted-foreground">Prev: </span>
                      <span className="text-foreground font-medium">{event.previous}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Economic data is for informational purposes only. Always verify with official sources before making trading decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
