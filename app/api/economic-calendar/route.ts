import { NextResponse } from "next/server"

export const runtime = "edge"
export const revalidate = 1800 // 30 min cache

// Country code → flag emoji helper
function flagEmoji(currency: string): string {
  const flags: Record<string, string> = {
    USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
    CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", CHF: "🇨🇭",
    CNY: "🇨🇳", CNH: "🇨🇳", ALL: "🌍",
  }
  return flags[currency] ?? "🏳️"
}

// ForexFactory calendar — their API endpoint used by mobile apps
async function fetchForexFactoryCalendar() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  // ForexFactory's internal JSON calendar endpoint
  const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`FF calendar ${res.status}`)
  const data = await res.json() as Array<{
    title: string
    country: string
    date: string
    time: string
    impact: string
    forecast?: string
    previous?: string
  }>

  // Impact: Holiday / Low / Medium / High → map
  const impactMap: Record<string, "high" | "medium" | "low"> = {
    High: "high", Medium: "medium", Low: "low", Holiday: "low",
  }

  // Map currency codes
  const currencyMap: Record<string, string> = {
    USD: "USD", EUR: "EUR", GBP: "GBP", JPY: "JPY",
    CAD: "CAD", AUD: "AUD", NZD: "NZD", CHF: "CHF",
    CNY: "CNY", ALL: "ALL",
  }

  const todayDate = new Date(today)

  return data
    .filter(e => e.impact !== "Holiday")
    .map((e, i) => {
      const eventDate = new Date(e.date)
      const diffDays = Math.round((eventDate.getTime() - todayDate.getTime()) / 86400000)
      let dateLabel: string
      if (diffDays === 0) dateLabel = "Today"
      else if (diffDays === 1) dateLabel = "Tomorrow"
      else if (diffDays === -1) dateLabel = "Yesterday"
      else if (diffDays > 0 && diffDays < 7) {
        dateLabel = eventDate.toLocaleDateString("en-US", { weekday: "short" })
      } else {
        dateLabel = eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }

      const currency = currencyMap[e.country] ?? e.country

      return {
        id: String(i + 1),
        event: e.title,
        currency,
        flag: flagEmoji(currency),
        impact: impactMap[e.impact] ?? "low",
        time: e.time === "All Day" ? "All Day" : e.time,
        date: dateLabel,
        rawDate: e.date,
        forecast: e.forecast || undefined,
        previous: e.previous || undefined,
        rawDate: e.date,
      }
    })
    .sort((a, b) => {
      // Sort by date then time
      const da = new Date(`${a.rawDate} ${a.time}`)
      const db = new Date(`${b.rawDate} ${b.time}`)
      return da.getTime() - db.getTime()
    })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const impactFilter = url.searchParams.get("impact") // "high" | "all"
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10)

  try {
    let events = await fetchForexFactoryCalendar()

    if (impactFilter === "high") {
      events = events.filter(e => e.impact === "high")
    }

    return NextResponse.json({ events: events.slice(0, limit), source: "ForexFactory" })
  } catch (err) {
    // Graceful fallback with a small set of known upcoming events
    console.error("Economic calendar fetch failed:", err)
    return NextResponse.json({
      events: [],
      error: "calendar_unavailable",
      source: "fallback",
    })
  }
}
