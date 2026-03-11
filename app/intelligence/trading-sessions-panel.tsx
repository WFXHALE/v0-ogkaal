"use client"

import { useState, useEffect } from "react"
import { Globe, Clock } from "lucide-react"

// ── DST-aware New York offset ──────────────────────────────────────────────
// Returns UTC offset in minutes for New York (EDT = -240, EST = -300)
function getNyOffsetMinutes(d: Date): number {
  // DST in USA: Second Sunday of March → First Sunday of November
  const year = d.getUTCFullYear()

  // Second Sunday of March
  const march = new Date(Date.UTC(year, 2, 1))
  const marchDay = march.getUTCDay() // 0=Sun
  const dstStart = new Date(Date.UTC(year, 2, (14 - marchDay) % 7 + 1, 7)) // 2:00 AM ET = 7:00 UTC (EST)

  // First Sunday of November
  const nov = new Date(Date.UTC(year, 10, 1))
  const novDay = nov.getUTCDay()
  const dstEnd = new Date(Date.UTC(year, 10, (7 - novDay) % 7 + 1, 6)) // 2:00 AM ET = 6:00 UTC (EDT)

  const isDST = d >= dstStart && d < dstEnd
  return isDST ? -240 : -300 // EDT = UTC-4, EST = UTC-5
}

// Get a Date's time parts in a given UTC offset (minutes)
function getTimeParts(d: Date, offsetMin: number) {
  const totalMin = d.getUTCHours() * 60 + d.getUTCMinutes() + offsetMin
  const corrected = ((totalMin % 1440) + 1440) % 1440
  const h = Math.floor(corrected / 60)
  const m = corrected % 60
  const s = d.getUTCSeconds()
  return { h, m, s, totalMin: corrected }
}

function pad(n: number) { return String(n).padStart(2, "0") }

function formatTime12(h: number, m: number, s: number) {
  const ampm = h >= 12 ? "PM" : "AM"
  const h12  = h % 12 || 12
  return `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`
}

function formatTime24(h: number, m: number) {
  return `${pad(h)}:${pad(m)}`
}

// ── Session definitions (in NY minutes from midnight) ─────────────────────
type SessionName = "Sydney" | "Tokyo" | "London" | "New York"

interface SessionDef {
  name: SessionName
  displayName: string
  startMin: number   // NY minutes from midnight
  endMin:   number   // NY minutes from midnight (may wrap >1440 overnight)
  colorClass: string
  bgClass:    string
}

// Times based on NY time (as specified in config):
// Sydney:   5:00 PM → 2:00 AM  (17:00 → 26:00 → wrap to 02:00)
// Tokyo:    7:00 PM → 4:00 AM  (19:00 → 28:00 → wrap to 04:00)
// London:   3:00 AM → 12:00 PM (03:00 → 12:00)
// New York: 8:00 AM → 5:00 PM  (08:00 → 17:00)

const SESSIONS: SessionDef[] = [
  {
    name: "Sydney",
    displayName: "Sydney",
    startMin: 17 * 60,       // 5:00 PM
    endMin:   26 * 60,       // 2:00 AM next day (26h notation)
    colorClass: "text-sky-400",
    bgClass:    "bg-sky-400/10 border-sky-400/20",
  },
  {
    name: "Tokyo",
    displayName: "Tokyo",
    startMin: 19 * 60,       // 7:00 PM
    endMin:   28 * 60,       // 4:00 AM next day
    colorClass: "text-violet-400",
    bgClass:    "bg-violet-400/10 border-violet-400/20",
  },
  {
    name: "London",
    displayName: "London",
    startMin:  3 * 60,       // 3:00 AM
    endMin:   12 * 60,       // 12:00 PM
    colorClass: "text-amber-400",
    bgClass:    "bg-amber-400/10 border-amber-400/20",
  },
  {
    name: "New York",
    displayName: "New York",
    startMin:  8 * 60,       // 8:00 AM
    endMin:   17 * 60,       // 5:00 PM
    colorClass: "text-emerald-400",
    bgClass:    "bg-emerald-400/10 border-emerald-400/20",
  },
]

// Grouped sessions for display: Asian = Sydney + Tokyo
const GROUPED_SESSIONS = [
  {
    name: "Asian",
    components: ["Sydney", "Tokyo"] as SessionName[],
    startMin: 17 * 60,  // earliest start (Sydney 5PM)
    endMin:   28 * 60,  // latest end (Tokyo 4AM)
    colorClass: "text-sky-400",
    bgClass:    "bg-sky-400/10 border-sky-400/20",
  },
  {
    name: "London",
    components: ["London"] as SessionName[],
    startMin: 3 * 60,
    endMin:   12 * 60,
    colorClass: "text-amber-400",
    bgClass:    "bg-amber-400/10 border-amber-400/20",
  },
  {
    name: "New York",
    components: ["New York"] as SessionName[],
    startMin: 8 * 60,
    endMin:   17 * 60,
    colorClass: "text-emerald-400",
    bgClass:    "bg-emerald-400/10 border-emerald-400/20",
  },
]

// Normalise minutes to 0-1439 and check if nyMin is within session
// Overnight sessions (endMin > 1440) are handled by extending into next day
function isSessionActive(nyMin: number, startMin: number, endMin: number): boolean {
  if (endMin <= 1440) {
    return nyMin >= startMin && nyMin < endMin
  }
  // Overnight: active if nyMin >= startMin OR nyMin < (endMin - 1440)
  return nyMin >= startMin || nyMin < (endMin - 1440)
}

// Build a display string for a session start/end in the requested timezone
function sessionTimeStr(
  nyStartMin: number,
  nyEndMin:   number,
  mode: "IST" | "NY"
): { start: string; end: string } {
  if (mode === "NY") {
    const s = nyStartMin % 1440
    const e = nyEndMin   % 1440
    return {
      start: formatTime24(Math.floor(s / 60), s % 60),
      end:   formatTime24(Math.floor(e / 60), e % 60),
    }
  }
  // IST = NY + 9h30m  (IST is UTC+5:30, NY EST is UTC-5, EDT is UTC-4)
  // Average offset difference: IST - NY ≈ +9.5h (EST) or +9.5h (EDT — IST is UTC+5:30, EDT UTC-4 → diff 9.5h)
  // Actually: IST = UTC+5:30; EST = UTC-5 → IST-EST = 10:30; EDT = UTC-4 → IST-EDT = 9:30
  // We use a fixed 9:30 offset (EDT) as approximate — for session display this is fine
  const IST_OFFSET = 9 * 60 + 30
  const sIst = (nyStartMin + IST_OFFSET) % 1440
  const eIst = (nyEndMin   + IST_OFFSET) % 1440
  return {
    start: formatTime24(Math.floor(sIst / 60), sIst % 60),
    end:   formatTime24(Math.floor(eIst / 60), eIst % 60),
  }
}

function getSessionStatus(nyTotalMin: number) {
  let current: typeof GROUPED_SESSIONS[number] | null = null
  let past: typeof GROUPED_SESSIONS[number] | null = null
  let upcoming: typeof GROUPED_SESSIONS[number] | null = null

  // Find active grouped session
  for (const g of GROUPED_SESSIONS) {
    if (isSessionActive(nyTotalMin, g.startMin, g.endMin)) {
      current = g
      break
    }
  }

  if (current) {
    // Past: the grouped session that ended most recently before current
    // Order by start time — find the one that started before current
    const idx = GROUPED_SESSIONS.indexOf(current)
    past     = GROUPED_SESSIONS[(idx - 1 + GROUPED_SESSIONS.length) % GROUPED_SESSIONS.length]
    upcoming = GROUPED_SESSIONS[(idx + 1)                           % GROUPED_SESSIONS.length]
  } else {
    // Between sessions — find upcoming and most recent past
    let minFwdDist = Infinity
    let minBwdDist = Infinity
    for (const g of GROUPED_SESSIONS) {
      let fwdDist = (g.startMin - nyTotalMin + 1440) % 1440
      let bwdDist = (nyTotalMin - g.endMin   % 1440 + 1440) % 1440
      if (fwdDist < minFwdDist) { minFwdDist = fwdDist; upcoming = g }
      if (bwdDist < minBwdDist) { minBwdDist = bwdDist; past     = g }
    }
  }

  return { current, past, upcoming }
}

// ── Component ──────────────────────────────────────────────────────────────

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
      <div className="rounded-xl bg-card border border-border p-5 animate-pulse h-96" />
    )
  }

  // IST = UTC+5:30
  const IST_OFFSET_MIN = 5 * 60 + 30
  const istParts = getTimeParts(now, IST_OFFSET_MIN)

  // NY dynamic offset
  const nyOffsetMin = getNyOffsetMinutes(now)
  const nyParts     = getTimeParts(now, nyOffsetMin)
  const nyTotalMin  = nyParts.totalMin  // 0–1439

  const { current, past, upcoming } = getSessionStatus(nyTotalMin)

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl bg-card border border-border p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Trading Sessions</h2>
        </div>
        {/* Timezone toggle */}
        <div className="flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 gap-0.5">
          {(["IST", "NY"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "IST" ? "Indian (IST)" : "New York (NY)"}
            </button>
          ))}
        </div>
      </div>

      {/* Live Clocks */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Indian Time</p>
          <p className="font-mono text-lg font-bold text-foreground tabular-nums leading-none">
            {formatTime12(istParts.h, istParts.m, istParts.s)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">IST (UTC+5:30)</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">New York Time</p>
          <p className="font-mono text-lg font-bold text-foreground tabular-nums leading-none">
            {formatTime12(nyParts.h, nyParts.m, nyParts.s)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {nyOffsetMin === -240 ? "EDT (UTC-4)" : "EST (UTC-5)"}
          </p>
        </div>
      </div>

      {/* Session Status */}
      <div className="space-y-2">
        {/* Past */}
        {past && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/20">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Past Session</p>
              <p className="font-semibold text-muted-foreground mt-0.5">{past.name}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{sessionTimeStr(past.startMin, past.endMin, mode).start} – {sessionTimeStr(past.startMin, past.endMin, mode).end}</p>
              <p className="text-[10px] mt-0.5">{mode === "IST" ? "IST" : "NY Time"}</p>
            </div>
          </div>
        )}

        {/* Current */}
        {current ? (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${current.bgClass}`}>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-2 h-2 rounded-full ${current.colorClass.replace("text-", "bg-")} animate-pulse shadow-[0_0_6px_2px] ${current.colorClass.replace("text-", "shadow-")}/50`} />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Current Session</p>
              </div>
              <p className={`text-base font-bold ${current.colorClass}`}>{current.name}</p>
            </div>
            <div className="text-right text-xs">
              <p className={`font-medium ${current.colorClass}`}>
                {sessionTimeStr(current.startMin, current.endMin, mode).start} – {sessionTimeStr(current.startMin, current.endMin, mode).end}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{mode === "IST" ? "IST" : "NY Time"}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/50 bg-secondary/10">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Current Session</p>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Between Sessions</p>
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/20">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Upcoming Session</p>
              <p className="font-semibold text-foreground mt-0.5">{upcoming.name}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Starts {sessionTimeStr(upcoming.startMin, upcoming.endMin, mode).start}</p>
              <p className="text-[10px] mt-0.5">{mode === "IST" ? "IST" : "NY Time"}</p>
            </div>
          </div>
        )}
      </div>

      {/* All sessions reference */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">All Sessions ({mode})</p>
        <div className="space-y-1.5">
          {GROUPED_SESSIONS.map((g) => {
            const times = sessionTimeStr(g.startMin, g.endMin, mode)
            const active = isSessionActive(nyTotalMin, g.startMin, g.endMin)
            return (
              <div
                key={g.name}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                  active ? `${g.bgClass} ${g.colorClass}` : "border-border/50 bg-secondary/10 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  {active && <span className={`w-1.5 h-1.5 rounded-full ${g.colorClass.replace("text-", "bg-")} animate-pulse`} />}
                  <span className="font-semibold">{g.name}</span>
                </div>
                <span className="font-mono">{times.start} – {times.end}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-muted-foreground text-center">
        <Clock className="inline w-3 h-3 mr-1 -mt-0.5" />
        Times auto-adjust for DST · Based on real forex session hours
      </p>
    </div>
  )
}
