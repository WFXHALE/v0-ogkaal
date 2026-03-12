"use client"

import { useState, useEffect } from "react"
import { Globe, Clock, ChevronDown, ChevronUp } from "lucide-react"

// ── DST-aware New York offset ──────────────────────────────────────────────
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
  return {
    h: Math.floor(corrected / 60),
    m: corrected % 60,
    s: d.getUTCSeconds(),
    totalMin: corrected,
  }
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

// ── Session definitions (NY minutes from midnight) ─────────────────────────
const SESSIONS = [
  { name: "Sydney",   startMin: 17 * 60, endMin: 26 * 60, color: "sky",     label: "Asian" },
  { name: "Tokyo",    startMin: 19 * 60, endMin: 28 * 60, color: "violet",  label: "Asian" },
  { name: "London",   startMin:  3 * 60, endMin: 12 * 60, color: "amber",   label: "London" },
  { name: "New York", startMin:  8 * 60, endMin: 17 * 60, color: "emerald", label: "New York" },
]

const GROUPED = [
  { name: "Asian (Sydney + Tokyo)", startMin: 17 * 60, endMin: 28 * 60, color: "sky" },
  { name: "London",                  startMin:  3 * 60, endMin: 12 * 60, color: "amber" },
  { name: "New York",                startMin:  8 * 60, endMin: 17 * 60, color: "emerald" },
]

const COLOR_MAP: Record<string, { text: string; bg: string; dot: string; border: string }> = {
  sky:     { text: "text-sky-400",     bg: "bg-sky-400/10",     dot: "bg-sky-400",     border: "border-sky-400/25"     },
  violet:  { text: "text-violet-400",  bg: "bg-violet-400/10",  dot: "bg-violet-400",  border: "border-violet-400/25"  },
  amber:   { text: "text-amber-400",   bg: "bg-amber-400/10",   dot: "bg-amber-400",   border: "border-amber-400/25"   },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400", border: "border-emerald-400/25" },
}

function isActive(nyMin: number, start: number, end: number): boolean {
  if (end <= 1440) return nyMin >= start && nyMin < end
  return nyMin >= start || nyMin < (end - 1440)
}

// IST offset from NY: IST is UTC+5:30, NY EST is UTC-5 → diff = 10:30; EDT → 9:30
// We use dynamic calculation based on actual offset
function nyToIst(nyMin: number, nyOffsetMin: number): number {
  // IST = UTC+5:30 = UTC+330min; NY = UTC+nyOffsetMin (negative)
  const utcMin = nyMin - nyOffsetMin
  return ((utcMin + 330) % 1440 + 1440) % 1440
}

// ── Next N session occurrences from now ──────────────────────────────────────
interface UpcomingSession {
  session: typeof GROUPED[number]
  date: Date      // the calendar date it starts (local to NY)
  startNyMin: number
  startUtc: Date
  daysFromNow: number
}

function getUpcomingSessions(now: Date, nyOffsetMin: number, count = 8): UpcomingSession[] {
  const nyParts = getTimeParts(now, nyOffsetMin)
  const nyMin = nyParts.totalMin

  const results: UpcomingSession[] = []
  let dayOffset = 0

  while (results.length < count && dayOffset < 7) {
    for (const session of GROUPED) {
      if (results.length >= count) break
      let sessionNyMin = session.startMin % 1440

      // For overnight sessions (start >= 1440 wrap), they start in the evening
      const startMin = session.startMin

      // Minutes from current moment until this session starts on dayOffset
      const totalStartMin = dayOffset * 1440 + startMin

      // How many minutes from now
      const currentNyAbsMin = nyMin  // current NY minute of day
      const absoluteNow = 0          // reference point is "right now" = 0 offset
      const minutesFromNow = totalStartMin - currentNyAbsMin

      if (minutesFromNow <= 0) continue // already started or passed today

      // Build a display date: today + dayOffset in NY timezone
      const sessionDate = new Date(now)
      sessionDate.setUTCMinutes(sessionDate.getUTCMinutes() - nyOffsetMin)  // to NY midnight
      sessionDate.setUTCHours(0, 0, 0, 0)
      sessionDate.setUTCDate(sessionDate.getUTCDate() + dayOffset)

      results.push({
        session,
        date: sessionDate,
        startNyMin: startMin % 1440,
        startUtc: new Date(sessionDate.getTime() + (startMin % 1440) * 60000 - nyOffsetMin * 60000),
        daysFromNow: dayOffset,
      })
    }
    dayOffset++
  }

  return results.slice(0, count)
}

function dayLabel(daysFromNow: number, date: Date): string {
  if (daysFromNow === 0) return "Today"
  if (daysFromNow === 1) return "Tomorrow"
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

// ── Component ────────────────────────────────────────────────────────────────
export function TradingSessionsPanel() {
  const [mode, setMode]   = useState<"IST" | "NY">("IST")
  const [now,  setNow]    = useState<Date | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) {
    return <div className="rounded-xl bg-card border border-border p-5 animate-pulse h-64" />
  }

  const IST_MIN = 330
  const nyOffsetMin = getNyOffsetMinutes(now)
  const istParts = getTimeParts(now, IST_MIN)
  const nyParts  = getTimeParts(now, nyOffsetMin)
  const nyMin    = nyParts.totalMin

  // Active session
  const activeGroup = GROUPED.find(g => isActive(nyMin, g.startMin, g.endMin)) ?? null

  // Upcoming sessions — next 3 days
  const upcoming = getUpcomingSessions(now, nyOffsetMin, 9)

  // Group upcoming by day
  const byDay: Record<number, UpcomingSession[]> = {}
  for (const u of upcoming) {
    if (!byDay[u.daysFromNow]) byDay[u.daysFromNow] = []
    byDay[u.daysFromNow].push(u)
  }
  const dayKeys = Object.keys(byDay).map(Number).sort().slice(0, 3)

  function fmtSessionTime(startMin: number): string {
    if (mode === "NY") return fmt24(startMin)
    const istMin = nyToIst(startMin % 1440, nyOffsetMin)
    return fmt24(istMin)
  }

  return (
    <div className="rounded-xl bg-card border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Trading Sessions</h3>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 gap-0.5">
          {(["IST", "NY"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Live clocks */}
      <div className="grid grid-cols-2 gap-2.5 px-5 pb-4 shrink-0">
        <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">India (IST)</p>
          <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt12(istParts.h, istParts.m, istParts.s)}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">New York</p>
          <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt12(nyParts.h, nyParts.m, nyParts.s)}</p>
        </div>
      </div>

      {/* Current session */}
      <div className="px-5 pb-4 shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Now Active</p>
        {activeGroup ? (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${COLOR_MAP[activeGroup.color].bg} ${COLOR_MAP[activeGroup.color].border}`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${COLOR_MAP[activeGroup.color].dot} animate-pulse`} />
              <span className={`font-bold text-sm ${COLOR_MAP[activeGroup.color].text}`}>{activeGroup.name}</span>
            </div>
            <span className={`font-mono text-xs ${COLOR_MAP[activeGroup.color].text}`}>
              {fmtSessionTime(activeGroup.startMin)} – {fmtSessionTime(activeGroup.endMin % 1440)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/50 bg-secondary/20">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">Between sessions</span>
          </div>
        )}
      </div>

      {/* Scrollable upcoming sessions */}
      <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ maxHeight: "360px" }}>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Upcoming — Next {dayKeys.length} Days
        </p>
        <div className="space-y-4">
          {dayKeys.map(day => (
            <div key={day}>
              <p className="text-xs font-semibold text-primary mb-2">
                {dayLabel(day, byDay[day][0].date)}
                {" — "}
                <span className="text-muted-foreground font-normal">
                  {byDay[day][0].date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </p>
              <div className="space-y-1.5">
                {byDay[day].map((u, i) => {
                  const c = COLOR_MAP[u.session.color]
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 bg-secondary/20 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <span className="font-medium text-foreground">{u.session.name}</span>
                      </div>
                      <span className={`font-mono ${c.text}`}>
                        {fmtSessionTime(u.startNyMin)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* All sessions reference — collapsible */}
        <div className="mt-4">
          <button
            onClick={() => setShowAll(v => !v)}
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
          >
            {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            All Session Times
          </button>
          {showAll && (
            <div className="mt-2 space-y-1.5">
              {GROUPED.map(g => {
                const active = isActive(nyMin, g.startMin, g.endMin)
                const c = COLOR_MAP[g.color]
                return (
                  <div
                    key={g.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                      active ? `${c.bg} ${c.border} ${c.text}` : "border-border/50 bg-secondary/10 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {active && <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />}
                      <span className="font-semibold">{g.name}</span>
                    </div>
                    <span className="font-mono">
                      {fmtSessionTime(g.startMin)} – {fmtSessionTime(g.endMin % 1440)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          <Clock className="inline w-3 h-3 mr-1 -mt-0.5" />
          DST-adjusted · Real forex session hours
        </p>
      </div>
    </div>
  )
}
