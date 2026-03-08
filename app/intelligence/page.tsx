"use client"

import { Header } from "@/components/header"
import { useState, useEffect } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3, 
  Activity, 
  Droplets, 
  Calendar,
  Newspaper,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Types
interface FundamentalNews {
  id: string
  headline: string
  asset: string
  impact: "bullish" | "bearish" | "neutral"
  source: string
  time: string
}

interface TechnicalBias {
  pair: string
  bias: "bullish" | "bearish" | "neutral"
  timeframe: string
  strength: number
  keyLevels: { support: number; resistance: number }
}

interface VolumeData {
  pair: string
  currentVolume: number
  averageVolume: number
  volumeChange: number
  activity: "high" | "medium" | "low"
}

interface LiquidityZone {
  pair: string
  type: "buy" | "sell"
  priceLevel: number
  strength: "strong" | "moderate" | "weak"
  distance: string
}

interface EconomicEvent {
  id: string
  time: string
  currency: string
  event: string
  impact: "high" | "medium" | "low"
  forecast: string
  previous: string
}

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<"fundamentals" | "technical" | "volume" | "liquidity" | "calendar">("fundamentals")
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    setLastUpdated(new Date())
  }, [])

  const formatTime = () => {
    if (!mounted || !lastUpdated) return ""
    return lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  // Sample data
  const fundamentalNews: FundamentalNews[] = [
    { id: "1", headline: "Fed signals potential rate pause in upcoming meeting", asset: "USD", impact: "bearish", source: "Reuters", time: "2h ago" },
    { id: "2", headline: "ECB officials hint at continued tightening stance", asset: "EUR", impact: "bullish", source: "Bloomberg", time: "3h ago" },
    { id: "3", headline: "Gold rallies as inflation concerns persist", asset: "XAU", impact: "bullish", source: "CNBC", time: "4h ago" },
    { id: "4", headline: "UK GDP growth exceeds expectations", asset: "GBP", impact: "bullish", source: "FT", time: "5h ago" },
    { id: "5", headline: "Oil prices stable amid OPEC+ supply decisions", asset: "OIL", impact: "neutral", source: "Reuters", time: "6h ago" },
    { id: "6", headline: "Japanese Yen weakens on BOJ policy outlook", asset: "JPY", impact: "bearish", source: "Nikkei", time: "7h ago" },
  ]

  const technicalBias: TechnicalBias[] = [
    { pair: "EUR/USD", bias: "bullish", timeframe: "4H", strength: 75, keyLevels: { support: 1.0820, resistance: 1.0950 } },
    { pair: "GBP/USD", bias: "bearish", timeframe: "4H", strength: 60, keyLevels: { support: 1.2650, resistance: 1.2780 } },
    { pair: "XAU/USD", bias: "bullish", timeframe: "Daily", strength: 85, keyLevels: { support: 2620, resistance: 2700 } },
    { pair: "USD/JPY", bias: "bullish", timeframe: "4H", strength: 65, keyLevels: { support: 149.50, resistance: 151.20 } },
    { pair: "AUD/USD", bias: "neutral", timeframe: "4H", strength: 50, keyLevels: { support: 0.6520, resistance: 0.6620 } },
    { pair: "USD/CAD", bias: "bearish", timeframe: "Daily", strength: 55, keyLevels: { support: 1.3580, resistance: 1.3720 } },
  ]

  const volumeData: VolumeData[] = [
    { pair: "EUR/USD", currentVolume: 125000, averageVolume: 98000, volumeChange: 27.5, activity: "high" },
    { pair: "GBP/USD", currentVolume: 85000, averageVolume: 82000, volumeChange: 3.6, activity: "medium" },
    { pair: "XAU/USD", currentVolume: 210000, averageVolume: 150000, volumeChange: 40, activity: "high" },
    { pair: "USD/JPY", currentVolume: 95000, averageVolume: 110000, volumeChange: -13.6, activity: "low" },
    { pair: "BTC/USD", currentVolume: 450000, averageVolume: 380000, volumeChange: 18.4, activity: "high" },
    { pair: "ETH/USD", currentVolume: 180000, averageVolume: 175000, volumeChange: 2.8, activity: "medium" },
  ]

  const liquidityZones: LiquidityZone[] = [
    { pair: "EUR/USD", type: "buy", priceLevel: 1.0800, strength: "strong", distance: "50 pips" },
    { pair: "EUR/USD", type: "sell", priceLevel: 1.0980, strength: "moderate", distance: "130 pips" },
    { pair: "GBP/USD", type: "buy", priceLevel: 1.2620, strength: "strong", distance: "80 pips" },
    { pair: "GBP/USD", type: "sell", priceLevel: 1.2850, strength: "weak", distance: "150 pips" },
    { pair: "XAU/USD", type: "buy", priceLevel: 2600, strength: "strong", distance: "50 points" },
    { pair: "XAU/USD", type: "sell", priceLevel: 2720, strength: "moderate", distance: "70 points" },
    { pair: "USD/JPY", type: "buy", priceLevel: 148.80, strength: "moderate", distance: "120 pips" },
    { pair: "USD/JPY", type: "sell", priceLevel: 152.00, strength: "strong", distance: "80 pips" },
  ]

  const economicEvents: EconomicEvent[] = [
    { id: "1", time: "08:30", currency: "USD", event: "Non-Farm Payrolls", impact: "high", forecast: "180K", previous: "175K" },
    { id: "2", time: "10:00", currency: "USD", event: "ISM Manufacturing PMI", impact: "high", forecast: "49.5", previous: "48.7" },
    { id: "3", time: "12:00", currency: "EUR", event: "ECB President Lagarde Speaks", impact: "high", forecast: "-", previous: "-" },
    { id: "4", time: "14:00", currency: "GBP", event: "BOE Interest Rate Decision", impact: "high", forecast: "5.25%", previous: "5.25%" },
    { id: "5", time: "15:30", currency: "CAD", event: "Employment Change", impact: "medium", forecast: "25K", previous: "22K" },
    { id: "6", time: "19:00", currency: "USD", event: "FOMC Meeting Minutes", impact: "high", forecast: "-", previous: "-" },
  ]

  const tabs = [
    { id: "fundamentals" as const, label: "Fundamentals", icon: Newspaper },
    { id: "technical" as const, label: "Technical Overview", icon: BarChart3 },
    { id: "volume" as const, label: "Volume Activity", icon: Activity },
    { id: "liquidity" as const, label: "Liquidity Zones", icon: Droplets },
    { id: "calendar" as const, label: "Economic Calendar", icon: Calendar },
  ]

  const handleRefresh = () => {
    setLastUpdated(new Date())
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "bullish": return "text-green-500"
      case "bearish": return "text-red-500"
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30"
      default: return "text-muted-foreground"
    }
  }

  const getBiasIcon = (bias: string) => {
    switch (bias) {
      case "bullish": return <TrendingUp className="w-5 h-5 text-green-500" />
      case "bearish": return <TrendingDown className="w-5 h-5 text-red-500" />
      default: return <Minus className="w-5 h-5 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Market Intelligence</h1>
                <p className="text-muted-foreground mt-1">Quick market insights for informed trading decisions</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {formatTime()}</span>
                </div>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="border-border hover:bg-secondary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 p-1 bg-secondary/50 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Fundamentals */}
            {activeTab === "fundamentals" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-primary" />
                  Fundamental News
                </h2>
                <div className="grid gap-4">
                  {fundamentalNews.map((news) => (
                    <div
                      key={news.id}
                      className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{news.headline}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="px-2 py-0.5 rounded bg-secondary text-xs font-medium text-foreground">
                              {news.asset}
                            </span>
                            <span className={`text-sm font-medium ${getImpactColor(news.impact)}`}>
                              {news.impact === "bullish" && <TrendingUp className="w-4 h-4 inline mr-1" />}
                              {news.impact === "bearish" && <TrendingDown className="w-4 h-4 inline mr-1" />}
                              {news.impact === "neutral" && <Minus className="w-4 h-4 inline mr-1" />}
                              {news.impact.charAt(0).toUpperCase() + news.impact.slice(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">{news.source}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{news.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Overview */}
            {activeTab === "technical" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Technical Overview
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {technicalBias.map((item) => (
                    <div
                      key={item.pair}
                      className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground">{item.pair}</span>
                        <div className="flex items-center gap-2">
                          {getBiasIcon(item.bias)}
                          <span className={`text-sm font-medium ${
                            item.bias === "bullish" ? "text-green-500" : 
                            item.bias === "bearish" ? "text-red-500" : "text-yellow-500"
                          }`}>
                            {item.bias.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Timeframe</span>
                          <span className="text-foreground">{item.timeframe}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Strength</span>
                          <span className="text-foreground">{item.strength}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.bias === "bullish" ? "bg-green-500" : 
                              item.bias === "bearish" ? "bg-red-500" : "bg-yellow-500"
                            }`}
                            style={{ width: `${item.strength}%` }}
                          />
                        </div>
                        <div className="pt-2 border-t border-border mt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-green-500">S: {item.keyLevels.support}</span>
                            <span className="text-red-500">R: {item.keyLevels.resistance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Volume Activity */}
            {activeTab === "volume" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Volume Activity
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pair</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Current Volume</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Volume</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Change</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volumeData.map((item) => (
                        <tr key={item.pair} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 font-medium text-foreground">{item.pair}</td>
                          <td className="py-3 px-4 text-right text-foreground">{item.currentVolume.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{item.averageVolume.toLocaleString()}</td>
                          <td className={`py-3 px-4 text-right font-medium ${item.volumeChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {item.volumeChange >= 0 ? <ArrowUp className="w-4 h-4 inline mr-1" /> : <ArrowDown className="w-4 h-4 inline mr-1" />}
                            {Math.abs(item.volumeChange).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.activity === "high" ? "bg-green-500/20 text-green-400" :
                              item.activity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {item.activity.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Liquidity Zones */}
            {activeTab === "liquidity" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-primary" />
                  Liquidity Zones
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {liquidityZones.map((zone, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground">{zone.pair}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          zone.type === "buy" 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                          {zone.type.toUpperCase()} ZONE
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price Level</span>
                          <span className="font-mono text-foreground">{zone.priceLevel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Strength</span>
                          <span className={`font-medium ${
                            zone.strength === "strong" ? "text-green-500" :
                            zone.strength === "moderate" ? "text-yellow-500" : "text-red-500"
                          }`}>
                            {zone.strength.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Distance</span>
                          <span className="text-foreground">{zone.distance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Economic Calendar */}
            {activeTab === "calendar" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Economic News Calendar
                </h2>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-sm text-yellow-400">
                    High impact events can cause significant market volatility. Trade with caution.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Currency</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Event</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Impact</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Forecast</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Previous</th>
                      </tr>
                    </thead>
                    <tbody>
                      {economicEvents.map((event) => (
                        <tr key={event.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 font-mono text-foreground">{event.time}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-secondary text-xs font-medium text-foreground">
                              {event.currency}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">{event.event}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(event.impact)}`}>
                              {event.impact.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-foreground">{event.forecast}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{event.previous}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
