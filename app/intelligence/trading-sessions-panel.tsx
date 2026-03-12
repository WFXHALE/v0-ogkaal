"use client"

import { useState, useEffect } from "react"
import { Globe, Clock } from "lucide-react"

// ── DST-aware New York offset ─────────────────────────────────────────────────
function getNyOffsetMinutes(d: Date): number {
  const year = d.getUTCFullYear()
  const march = new Date(Date.UTC(year, 2, 1))
  const dstStart = new Date(Date.UTC(year, 2, (14 - march.getUTCDay()) % 7 + 1, 7))
  const nov = new Date(Date.UTC(year, 10, 1))
  const dstEnd = new Date(Date.UTC(year, 10, (7 - nov.getUTCDay()) % 7 + 1, 6))
  return d >= dstStart && d < dstEnd ? -240 : -300
}

function getTimeParts(d: Date, offsetMin: number) {
  const totalMin = d.getUTCHours() * 60 + d.getUTCMinutes() + offsetMin
  const corrected = ((totalMin % 1440) + 1440) % 1440
  return { h: Math.floor(corrected / 60), m: corrected % 60, s: d.getUTCSeconds(), totalMin: corrected }
}

function pad(n: number) { return String(n).padStart(2, "0") }
function fmt12(h: number, m: number, s: number) {
  const ampm = h >= 12 ? "PM" : "AM"
  return `${pad(h % 12 || 12)}:${pad(m)}:${pad(s)} ${ampm}`
}
function fmt24(min: number) {
  const m = ((min % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

// ── Session definitions ───────────────────────────────────────────────────────
const SESSIONS = [
  { name: "Asian",    startMin: 17 * 60, endMin: 28 * 60, color: "blue"    },
  { name: "London",   startMin:  3 * 60, endMin: 12 * 60, color: "yellow"  },
  { name: "New York", startMin:  8 * 60, endMin: 17 * 60, color: "green"   },
  { name: "Overlap",  startMin:  8 * 60, endMin: 12 * 60, color: "orange"  },
] as const

type SessionColor = "blue" | "yellow" | "green" | "orange"

const COLOR: Record<SessionColor, { text: string; bg: string; dot: string; border: string; ring: string }> = {
  blue:   { text: "text-blue-400",   bg: "bg-blue-400/10",   dot: "bg-blue-400",   border: "border-blue-400/30",   ring: "ring-blue-400/30"   },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-400/10", dot: "bg-yellow-400", border: "border-yellow-400/30", ring: "ring-yellow-400/30" },
  green:  { text: "text-green-400",  bg: "bg-green-400/10",  dot: "bg-green-400",  border: "border-green-400/30",  ring: "ring-green-400/30"  },
  orange: { text: "text-orange-400", bg: "bg-orange-400/10", dot: "bg-orange-400", border: "border-orange-400/30", ring: "ring-orange-400/30" },
}

function isActive(nyMin: number, start: number, end: number): boolean {
  if (end <= 1440) return nyMin >= start && nyMin < end
  return nyMin >= start || nyMin < (end - 1440)
}

// Convert NY minutes to IST minutes
function nyToIst(nyMin: number, nyOffsetMin: number): number {
  const utcMin = nyMin - nyOffsetMin
  return ((utcMin + 330) % 1440 + 1440) % 1440
}

// Minutes until a session starts (wrapping overnight)
function minsUntilStart(nyMin: number, startMin: number): number {
  const diff = startMin - nyMin
  return diff <= 0 ? diff + 1440 : diff
}

function fmtCountdown(mins: number): string {
  if (mins >= 60) return `in ${Math.floor(mins / 60)}h ${mins % 60}m`
  return `in ${mins}m`
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TradingSessionsPanel() {
  const [mode, setMode] = useState<"IST" | "NY">("IST")
  const [now,  setNow]  = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) {
    return (
      <div className="w-full h-[72px] bg-card border-b border-border animate-pulse" />
    )
  }

  const nyOffsetMin = getNyOffsetMinutes(now)
  const istParts    = getTimeParts(now, 330)
  const nyParts     = getTimeParts(now, nyOffsetMin)
  const nyMin       = nyParts.totalMin

  function fmtTime(startMin: number): string {
    if (mode === "NY") return fmt24(startMin)
    return fmt24(nyToIst(startMin % 1440, nyOffsetMin))
  }

  return (
    <div className="sticky top-16 z-30 w-full bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5 overflow-x-auto scrollbar-hide">

          {/* Label */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap">
              Trading Sessions
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border shrink-0" />

          {/* Live clocks */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setMode(m => m === "IST" ? "NY" : "IST")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/60 hover:bg-secondary transition-colors"
              title="Toggle IST / NY time"
            >
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-[11px] font-bold text-foreground tabular-nums" suppressHydrationWarning>
                {mode === "IST"
                  ? `IST ${fmt12(istParts.h, istParts.m, istParts.s)}`
                  : `NY  ${fmt12(nyParts.h, nyParts.m, nyParts.s)}`}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border shrink-0" />

          {/* Session pills */}
          <div className="flex items-center gap-2 min-w-0">
            {SESSIONS.map((s) => {
              const active = isActive(nyMin, s.startMin, s.endMin)
              const c = COLOR[s.color]
              const startDisplay = fmtTime(s.startMin)
              const endDisplay   = fmtTime(s.endMin % 1440)
              const minsLeft     = active
                ? (() => {
                    const end = s.endMin % 1440
                    const diff = end - nyMin
                    return diff <= 0 ? diff + 1440 : diff
                  })()
                : null
              const minsAway = !active ? minsUntilStart(nyMin, s.startMin % 1440) : null

              return (
                <div
                  key={s.name}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shrink-0 transition-all ${
                    active
                      ? `${c.bg} ${c.border} ring-1 ${c.ring}`
                      : "bg-secondary/30 border-border/40"
                  }`}
                >
                  {/* Color dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${c.dot} ${active ? "animate-pulse" : "opacity-40"}`}
                  />

                  {/* Name */}
                  <span className={`text-xs font-bold whitespace-nowrap ${active ? c.text : "text-muted-foreground"}`}>
                    {s.name}
                  </span>

                  {/* Time range */}
                  <span className={`font-mono text-[10px] whitespace-nowrap hidden sm:inline ${
                    active ? c.text : "text-muted-foreground/60"
                  }`} suppressHydrationWarning>
                    {startDisplay}–{endDisplay}
                  </span>

                  {/* Status chip */}
                  {active && minsLeft !== null && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.bg} ${c.text} whitespace-nowrap`}>
                      LIVE · {Math.floor(minsLeft / 60)}h{pad(minsLeft % 60)}m left
                    </span>
                  )}
                  {!active && minsAway !== null && (
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap hidden md:inline" suppressHydrationWarning>
                      {fmtCountdown(minsAway)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
