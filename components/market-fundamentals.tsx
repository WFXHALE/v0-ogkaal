"use client"

import { useState, useEffect, useCallback } from "react"
import { Newspaper, TrendingUp, TrendingDown, Minus, Clock, RefreshCw, Calendar, AlertCircle, ExternalLink, Bell, BellOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string
  asset: string
  assetType: "forex" | "crypto" | "gold" | "indices"
  headline: string
  impact: "bullish" | "bearish" | "neutral"
  source: string
  time: string
  url?: string
}

interface EconomicEvent {
  id: string
  event: string
  currency: string
  flag: string
  impact: "high" | "medium" | "low"
  time: string
  date: string
  rawDate?: string
  forecast?: string
  previous?: string
}

interface CalendarAlert {
  event_id: string
  minutes_before: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function impactDot(impact: "high" | "medium" | "low") {
  const colors = { high: "bg-red-500", medium: "bg-orange-500", low: "bg-yellow-500" }
  return colors[impact]
}

function impactBadge(impact: "high" | "medium" | "low") {
  const styles = {
    high:   "bg-red-500/10 text-red-400 border border-red-500/25",
    medium: "bg-orange-500/10 text-orange-400 border border-orange-500/25",
    low:    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25",
  }
  return styles[impact]
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-secondary ${className}`} />
}

// ─── Component ───────────────────────────────────────────────────────────────

const MINUTES_OPTIONS = [5, 15, 30, 60]

export function MarketFundamentals() {
  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "forex" | "crypto" | "gold" | "indices">("all")
  const [calFilter, setCalFilter] = useState<"all" | "high">("high")

  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState(false)
  const [newsUpdated, setNewsUpdated] = useState<Date | null>(null)

  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [calLoading, setCalLoading] = useState(true)
  const [calError, setCalError] = useState(false)

  // ── Alerts state ────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState<CalendarAlert[]>([])
  const [alertLoading, setAlertLoading] = useState<string | null>(null) // event_id being toggled
  const [alertPopup, setAlertPopup] = useState<string | null>(null) // event_id popup open
  const [alertMinutes, setAlertMinutes] = useState<Record<string, number>>({}) // event_id → minutes
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // ── Fetch news ──────────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    setNewsError(false)
    try {
      const res = await fetch("/api/market-news")
      if (!res.ok) throw new Error("news_error")
      const data = await res.json()
      if (data.news && data.news.length > 0) {
        setNews(data.news)
        setNewsUpdated(new Date())
      } else {
        setNewsError(true)
      }
    } catch {
      setNewsError(true)
    } finally {
      setNewsLoading(false)
    }
  }, [])

  // ── Fetch calendar ──────────────────────────────────────────────────────
  const fetchCalendar = useCallback(async () => {
    setCalLoading(true)
    setCalError(false)
    try {
      const res = await fetch("/api/economic-calendar?limit=40")
      if (!res.ok) throw new Error("cal_error")
      const data = await res.json()
      if (data.events && data.events.length > 0) {
        setEvents(data.events)
      } else {
        setCalError(true)
      }
    } catch {
      setCalError(true)
    } finally {
      setCalLoading(false)
    }
  }, [])

  // ── Fetch user alerts ───────────────────────────────────────────────────
  const fetchAlerts = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/calendar-alerts?user_id=${uid}`)
      const data = await res.json()
      if (data.alerts) setAlerts(data.alerts)
    } catch { /* silent */ }
  }, [])

  // ── Toggle alert ────────────────────────────────────────────────────────
  const toggleAlert = async (event: EconomicEvent) => {
    if (!userId) { showToast("Sign in to set alerts"); return }
    const existing = alerts.find(a => a.event_id === event.id)
    setAlertLoading(event.id)
    try {
      if (existing) {
        await fetch(`/api/calendar-alerts?user_id=${userId}&event_id=${event.id}`, { method: "DELETE" })
        setAlerts(prev => prev.filter(a => a.event_id !== event.id))
        showToast("Alert removed")
      } else {
        const minutes = alertMinutes[event.id] ?? 15
        const res = await fetch("/api/calendar-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            event_id: event.id,
            event_title: event.event,
            event_date: event.rawDate ?? event.date,
            event_time: event.time,
            currency: event.currency,
            impact: event.impact,
            minutes_before: minutes,
          }),
        })
        if (res.ok) {
          setAlerts(prev => [...prev, { event_id: event.id, minutes_before: minutes }])
          showToast(`Alert set — ${minutes}min before`)
        }
      }
    } catch { showToast("Failed to update alert") }
    finally {
      setAlertLoading(null)
      setAlertPopup(null)
    }
  }

  useEffect(() => {
    setMounted(true)
    // Read session from localStorage (matches existing app pattern)
    try {
      const raw = localStorage.getItem("community_session")
      if (raw) {
        const session = JSON.parse(raw)
        if (session?.id) {
          setUserId(session.id)
          fetchAlerts(session.id)
        }
      }
    } catch { /* no session */ }

    fetchNews()
    fetchCalendar()
    const newsInterval = setInterval(fetchNews, 10 * 60 * 1000)
    const calInterval  = setInterval(fetchCalendar, 30 * 60 * 1000)
    return () => { clearInterval(newsInterval); clearInterval(calInterval) }
  }, [fetchNews, fetchCalendar, fetchAlerts])

  if (!mounted) return null

  const filteredNews = activeFilter === "all"
    ? news
    : news.filter(n => n.assetType === activeFilter)

  const filteredEvents = calFilter === "high"
    ? events.filter(e => e.impact === "high")
    : events

  return (
    <div className="space-y-6">
      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border shadow-xl text-sm font-medium text-foreground pointer-events-none">
          <Check className="w-4 h-4 text-primary shrink-0" />
          {toastMsg}
        </div>
      )}
      {/* ── Market Headlines ───────────────────────────────────────────────── */}
      <div className="p-6 rounded-xl bg-card border border-border">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Market Fundamentals</h3>
              <p className="text-sm text-muted-foreground">Live headlines — Gold, Forex, Crypto & Indices</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {newsUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {newsUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchNews} disabled={newsLoading}>
              <RefreshCw className={`w-4 h-4 ${newsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["all", "forex", "crypto", "gold", "indices"] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {newsLoading ? (
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : newsError ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Could not load live headlines right now.</p>
            <Button variant="outline" size="sm" onClick={fetchNews}>Try Again</Button>
          </div>
        ) : filteredNews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No headlines match this filter.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filteredNews.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-secondary/40 border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-primary">{item.asset}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.impact === "bullish" && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                    {item.impact === "bearish" && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                    {item.impact === "neutral" && <Minus className="w-3.5 h-3.5 text-yellow-500" />}
                    <span className={`text-xs font-medium ${
                      item.impact === "bullish" ? "text-green-500" :
                      item.impact === "bearish" ? "text-red-500" : "text-yellow-500"
                    }`}>
                      {item.impact.charAt(0).toUpperCase() + item.impact.slice(1)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-snug mb-2 line-clamp-2">{item.headline}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>{item.source}</span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Economic Calendar ──────────────────────────────────────────────── */}
      <div className="p-6 rounded-xl bg-card border border-border">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Economic Calendar</h3>
              <p className="text-sm text-muted-foreground">Live events — CPI, NFP, FOMC, Rate Decisions & GDP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={fetchCalendar} disabled={calLoading}>
              <RefreshCw className={`w-4 h-4 ${calLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filter + Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2">
            {(["high", "all"] as const).map(f => (
              <button
                key={f}
                onClick={() => setCalFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  calFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "high" ? "High Impact" : "All Events"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />High</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Low</span>
          </div>
        </div>

        {/* Events */}
        {calLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : calError ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Could not load economic calendar right now.</p>
            <Button variant="outline" size="sm" onClick={fetchCalendar}>Try Again</Button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No events found for this filter.</p>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_auto_auto_auto_2rem] gap-x-3 px-3 text-xs font-medium text-muted-foreground mb-1 hidden sm:grid">
              <span></span>
              <span>Event</span>
              <span className="text-right">Forecast</span>
              <span className="text-right">Previous</span>
              <span className="text-right">Date / Time</span>
              <span></span>
            </div>
            {filteredEvents.map(event => {
              const isAlerting = alerts.some(a => a.event_id === event.id)
              const isLoading  = alertLoading === event.id
              const popupOpen  = alertPopup === event.id
              const minutes    = alertMinutes[event.id] ?? 15

              return (
                <div
                  key={event.id}
                  className="relative grid grid-cols-1 sm:grid-cols-[2rem_1fr_auto_auto_auto_2rem] gap-x-3 gap-y-1 items-center p-3 rounded-lg bg-secondary/40 border border-border hover:border-primary/20 transition-colors"
                >
                  {/* Impact dot */}
                  <div className="flex sm:flex-col items-center gap-2 sm:gap-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${impactDot(event.impact)}`} />
                  </div>

                  {/* Event name + currency + flag */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base leading-none">{event.flag}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${impactBadge(event.impact)}`}>
                        {event.currency}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground truncate block">{event.event}</span>
                  </div>

                  {/* Forecast */}
                  <div className="text-right">
                    {event.forecast ? (
                      <div>
                        <div className="text-xs text-muted-foreground">Forecast</div>
                        <div className="text-sm font-medium text-foreground">{event.forecast}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Previous */}
                  <div className="text-right">
                    {event.previous ? (
                      <div>
                        <div className="text-xs text-muted-foreground">Previous</div>
                        <div className="text-sm text-muted-foreground">{event.previous}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Date + time */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{event.date}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </div>
                  </div>

                  {/* Bell alert button */}
                  <div className="flex justify-end relative">
                    <button
                      onClick={() => {
                        if (isAlerting) { toggleAlert(event); return }
                        setAlertPopup(popupOpen ? null : event.id)
                      }}
                      disabled={isLoading}
                      title={isAlerting ? "Remove alert" : "Set alert"}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isAlerting
                          ? "bg-primary/20 text-primary hover:bg-red-500/20 hover:text-red-400"
                          : "bg-secondary hover:bg-primary/10 hover:text-primary text-muted-foreground"
                      }`}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isAlerting ? (
                        <Bell className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Minutes picker popup */}
                    {popupOpen && (
                      <div className="absolute right-0 top-9 z-20 bg-card border border-border rounded-xl shadow-xl p-3 w-52">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">Alert me before</span>
                          <button onClick={() => setAlertPopup(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 mb-3">
                          {MINUTES_OPTIONS.map(m => (
                            <button
                              key={m}
                              onClick={() => setAlertMinutes(prev => ({ ...prev, [event.id]: m }))}
                              className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                minutes === m
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
                          onClick={() => toggleAlert(event)}
                          disabled={isLoading}
                        >
                          <Bell className="w-3 h-3 mr-1.5" />
                          Set Alert
                        </Button>
                        {/* Dismiss overlay */}
                        <div className="fixed inset-0 z-[-1]" onClick={() => setAlertPopup(null)} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 p-3 rounded-lg bg-secondary/40 border border-border flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Data sourced from ForexFactory. For informational purposes only — verify with official sources before trading.
          </p>
        </div>
      </div>
    </div>
  )
}
