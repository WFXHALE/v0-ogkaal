"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

// ── DST-aware New York UTC offset ─────────────────────────────────────────────
function getNyOffsetMinutes(d: Date): number {
  const y = d.getUTCFullYear()
  const march = new Date(Date.UTC(y, 2, 1))
  const dstStart = new Date(Date.UTC(y, 2, (14 - march.getUTCDay()) % 7 + 1, 7))
  const nov = new Date(Date.UTC(y, 10, 1))
  const dstEnd = new Date(Date.UTC(y, 10, (7 - nov.getUTCDay()) % 7 + 1, 6))
  return d >= dstStart && d < dstEnd ? -240 : -300
}

function pad(n: number) { return String(n).padStart(2, "0") }

// UTC minutes → display minutes for a given offset
function toLocalMin(utcMin: number, offsetMin: number): number {
  return ((utcMin + offsetMin + 1440 * 4) % 1440)
}

function fmtHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

function fmt12(d: Date, offsetMin: number): string {
  const min = toLocalMin(d.getUTCHours() * 60 + d.getUTCMinutes(), offsetMin)
  const h = Math.floor(min / 60)
  const m = min % 60
  const s = d.getUTCSeconds()
  return `${pad(h % 12 || 12)}:${pad(m)}:${pad(s)} ${h >= 12 ? "PM" : "AM"}`
}

// All session times are in NY time (UTC offset applied)
// Times stored as NY minutes from midnight
const SESSIONS = [
  { key: "asian",    name: "Asian",    startNY: 17 * 60, endNY: 28 * 60, color: "blue"   as const },
  { key: "london",   name: "London",   startNY:  3 * 60, endNY: 12 * 60, color: "yellow" as const },
  { key: "newyork",  name: "New York", startNY:  8 * 60, endNY: 17 * 60, color: "green"  as const },
  { key: "overlap",  name: "Overlap",  startNY:  8 * 60, endNY: 12 * 60, color: "orange" as const },
] as const

type Color = "blue" | "yellow" | "green" | "orange"

const C: Record<Color, {
  dot: string; dotActive: string
  text: string; textMuted: string
  bg: string; border: string; card: string
  badge: string
}> = {
  blue: {
    dot:       "bg-blue-500/40",
    dotActive: "bg-blue-500",
    text:      "text-blue-600 dark:text-blue-400",
    textMuted: "text-blue-500 dark:text-blue-400/70",
    bg:        "bg-blue-500/10",
    border:    "border-blue-500/40",
    card:      "bg-blue-500/10 dark:bg-blue-950/30",
    badge:     "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  yellow: {
    dot:       "bg-yellow-500/40",
    dotActive: "bg-yellow-500",
    text:      "text-yellow-600 dark:text-yellow-400",
    textMuted: "text-yellow-600 dark:text-yellow-400/70",
    bg:        "bg-yellow-500/10",
    border:    "border-yellow-500/40",
    card:      "bg-yellow-500/10 dark:bg-yellow-950/30",
    badge:     "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  },
  green: {
    dot:       "bg-green-500/40",
    dotActive: "bg-green-500",
    text:      "text-green-700 dark:text-green-400",
    textMuted: "text-green-600 dark:text-green-400/70",
    bg:        "bg-green-500/10",
    border:    "border-green-500/40",
    card:      "bg-green-500/10 dark:bg-green-950/30",
    badge:     "bg-green-500/15 text-green-700 dark:text-green-300",
  },
  orange: {
    dot:       "bg-orange-500/40",
    dotActive: "bg-orange-500",
    text:      "text-orange-600 dark:text-orange-400",
    textMuted: "text-orange-600 dark:text-orange-400/70",
    bg:        "bg-orange-500/10",
    border:    "border-orange-500/40",
    card:      "bg-orange-500/10 dark:bg-orange-950/30",
    badge:     "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
}

function isSessionActive(nyMin: number, startNY: number, endNY: number): boolean {
  if (endNY <= 1440) return nyMin >= startNY && nyMin < endNY
  // Overnight session (e.g. Asian 17:00–04:00 next day)
  return nyMin >= startNY || nyMin < endNY - 1440
}

function minsLeft(nyMin: number, endNY: number): number {
  const end = endNY % 1440
  const diff = end - nyMin
  return diff <= 0 ? diff + 1440 : diff
}

function minsUntil(nyMin: number, startNY: number): number {
  const start = startNY % 1440
  const diff = start - nyMin
  return diff <= 0 ? diff + 1440 : diff
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

// Convert NY startMin → display string in either NY or IST
function sessionTime(nyMin: number, offsetMin: number, mode: "NY" | "IST"): string {
  if (mode === "NY") return fmtHHMM(nyMin)
  // NY → UTC → IST (+330)
  const utcMin = nyMin - offsetMin
  return fmtHHMM(utcMin + 330)
}

// ── Upcoming sessions for the next 3 days ────────────────────────────────────
interface UpcomingSession {
  key: string
  name: string
  color: Color
  dayLabel: string   // "Today", "Tomorrow", "Wed 12"
  startDisplay: string
  endDisplay: string
  minsAway: number
}

function getUpcomingSessions(nyMin: number, nyOffsetMin: number, now: Date, mode: "NY" | "IST"): UpcomingSession[] {
  const results: UpcomingSession[] = []
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
    for (const s of SESSIONS) {
      if (dayOffset === 0 && isSessionActive(nyMin, s.startNY, s.endNY)) continue
      if (s.key === "overlap") continue  // overlap is derivative

      const startInThisDay = s.startNY % 1440
      const endInThisDay = s.endNY % 1440

      // Minutes until this session starts
      let minsAway: number
      if (dayOffset === 0) {
        const diff = startInThisDay - nyMin
        if (diff <= 0) continue  // already started today (but not active? → skip)
        minsAway = diff
      } else {
        const remainingToday = 1440 - nyMin
        minsAway = remainingToday + (dayOffset - 1) * 1440 + startInThisDay
      }

      const futureDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dow = futureDate.getUTCDay()
      const dom = futureDate.getUTCDate()
      const mon = futureDate.getUTCMonth()

      const dayLabel =
        dayOffset === 0 ? "Today" :
        dayOffset === 1 ? "Tomorrow" :
        `${days[dow]} ${dom} ${months[mon]}`

      results.push({
        key: `${s.key}-day${dayOffset}`,
        name: s.name,
        color: s.color,
        dayLabel,
        startDisplay: sessionTime(s.startNY % 1440, nyOffsetMin, mode),
        endDisplay:   sessionTime(s.endNY % 1440,   nyOffsetMin, mode),
        minsAway,
      })
    }
  }

  return results.sort((a, b) => a.minsAway - b.minsAway).slice(0, 8)
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

  // Skeleton while hydrating
  if (!now) {
    return (
      <div className="sticky top-16 z-30 w-full bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <div className="h-5 w-36 bg-muted rounded animate-pulse" />
            <div className="flex gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 w-40 bg-muted rounded-xl animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const nyOffsetMin = getNyOffsetMinutes(now)
  const nyMin = toLocalMin(now.getUTCHours() * 60 + now.getUTCMinutes(), nyOffsetMin)
  const upcoming = getUpcomingSessions(nyMin, nyOffsetMin, now, mode)

  return (
    <div className="sticky top-16 z-30 w-full bg-card/95 backdrop-blur-md border-b border-border shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

        {/* Top row: title + clock toggle + active sessions */}
        <div className="flex items-start gap-4">

          {/* Title + clock */}
          <div className="shrink-0 flex flex-col gap-1 pt-0.5">
            <span className="text-sm font-bold text-foreground tracking-wide uppercase">
              Trading Sessions
            </span>
            <button
              onClick={() => setMode(m => m === "IST" ? "NY" : "IST")}
              className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors"
              title="Toggle IST / NY"
              suppressHydrationWarning
            >
              <Clock className="w-3 h-3" />
              <span suppressHydrationWarning>
                {mode === "IST"
                  ? `IST ${fmt12(now, 330)}`
                  : `NY  ${fmt12(now, nyOffsetMin)}`}
              </span>
            </button>
          </div>

          {/* Scrollable session cards */}
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-0.5">

              {/* Active sessions first */}
              {SESSIONS.map((s) => {
                const active = isSessionActive(nyMin, s.startNY, s.endNY)
                const left   = active ? minsLeft(nyMin, s.endNY) : null
                const away   = !active ? minsUntil(nyMin, s.startNY) : null
                const c = C[s.color]

                const startStr = sessionTime(s.startNY % 1440, nyOffsetMin, mode)
                const endStr   = sessionTime(s.endNY   % 1440, nyOffsetMin, mode)

                return (
                  <div
                    key={s.key}
                    className={`flex flex-col gap-1 px-3.5 py-2.5 rounded-xl border shrink-0 min-w-[140px] transition-all duration-300 ${
                      active
                        ? `${c.card} ${c.border} shadow-sm`
                        : "bg-secondary/20 border-border/30 opacity-60"
                    }`}
                  >
                    {/* Session name + live dot */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          active ? `${c.dotActive} shadow-[0_0_6px_2px] shadow-current animate-pulse` : c.dot
                        }`}
                      />
                      <span className={`text-xs font-bold ${active ? c.text : "text-muted-foreground"}`}>
                        {s.name}
                      </span>
                      {active && (
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded uppercase tracking-wide ${c.badge}`}>
                          LIVE
                        </span>
                      )}
                    </div>

                    {/* Time range */}
                    <div className={`font-mono text-[11px] ${active ? c.textMuted : "text-muted-foreground"}`} suppressHydrationWarning>
                      {startStr} – {endStr}
                    </div>

                    {/* Status */}
                    <div className="text-[10px]" suppressHydrationWarning>
                      {active && left !== null ? (
                        <span className={c.text}>
                          {fmtDuration(left)} remaining
                        </span>
                      ) : away !== null ? (
                        <span className="text-muted-foreground">
                          Opens in {fmtDuration(away)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}

              {/* Divider */}
              <div className="w-px bg-border/50 self-stretch shrink-0 mx-1" />

              {/* Upcoming sessions */}
              {upcoming.slice(0, 4).map((u) => {
                const c = C[u.color]
                return (
                  <div
                    key={u.key}
                    className="flex flex-col gap-1 px-3 py-2.5 rounded-xl border border-border/20 bg-secondary/10 shrink-0 min-w-[130px] opacity-70 hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                      <span className="text-[11px] font-semibold text-muted-foreground">{u.name}</span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground" suppressHydrationWarning>
                      {u.startDisplay} – {u.endDisplay}
                    </div>
                    <div className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                      {u.dayLabel} · in {fmtDuration(u.minsAway)}
                    </div>
                  </div>
                )
              })}

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
