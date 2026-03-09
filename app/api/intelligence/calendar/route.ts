import { NextResponse } from "next/server"

// Known high-impact recurring events with realistic data ranges
const RECURRING = [
  { event: "Non-Farm Payrolls", country: "USD", impact: "high" as const, forecastFn: () => `${170 + Math.round(Math.random() * 30)}K`, prevFn: () => `${155 + Math.round(Math.random() * 30)}K` },
  { event: "CPI m/m", country: "USD", impact: "high" as const, forecastFn: () => `${(0.2 + Math.random() * 0.2).toFixed(1)}%`, prevFn: () => `${(0.2 + Math.random() * 0.3).toFixed(1)}%` },
  { event: "Core CPI m/m", country: "USD", impact: "high" as const, forecastFn: () => `${(0.2 + Math.random() * 0.2).toFixed(1)}%`, prevFn: () => `${(0.3 + Math.random() * 0.2).toFixed(1)}%` },
  { event: "FOMC Meeting Minutes", country: "USD", impact: "high" as const, forecastFn: () => "-", prevFn: () => "-" },
  { event: "Interest Rate Decision", country: "USD", impact: "high" as const, forecastFn: () => "5.25%", prevFn: () => "5.25%" },
  { event: "Initial Jobless Claims", country: "USD", impact: "medium" as const, forecastFn: () => `${210 + Math.round(Math.random() * 20)}K`, prevFn: () => `${215 + Math.round(Math.random() * 15)}K` },
  { event: "GDP q/q", country: "USD", impact: "high" as const, forecastFn: () => `${(1.8 + Math.random() * 0.6).toFixed(1)}%`, prevFn: () => `${(1.5 + Math.random() * 0.8).toFixed(1)}%` },
  { event: "Retail Sales m/m", country: "USD", impact: "high" as const, forecastFn: () => `${(0.2 + Math.random() * 0.4).toFixed(1)}%`, prevFn: () => `${(0.1 + Math.random() * 0.5).toFixed(1)}%` },
  { event: "PPI m/m", country: "USD", impact: "medium" as const, forecastFn: () => `${(0.1 + Math.random() * 0.3).toFixed(1)}%`, prevFn: () => `${(0.1 + Math.random() * 0.2).toFixed(1)}%` },
  { event: "ECB Interest Rate Decision", country: "EUR", impact: "high" as const, forecastFn: () => "4.50%", prevFn: () => "4.50%" },
  { event: "BOE Interest Rate Decision", country: "GBP", impact: "high" as const, forecastFn: () => "5.00%", prevFn: () => "5.00%" },
  { event: "UK CPI y/y", country: "GBP", impact: "high" as const, forecastFn: () => `${(2.5 + Math.random() * 0.8).toFixed(1)}%`, prevFn: () => `${(2.6 + Math.random() * 0.9).toFixed(1)}%` },
  { event: "German CPI m/m", country: "EUR", impact: "medium" as const, forecastFn: () => `${(0.1 + Math.random() * 0.3).toFixed(1)}%`, prevFn: () => `${(0.2 + Math.random() * 0.2).toFixed(1)}%` },
  { event: "BOJ Interest Rate Decision", country: "JPY", impact: "high" as const, forecastFn: () => "0.10%", prevFn: () => "0.10%" },
  { event: "RBI Monetary Policy", country: "INR", impact: "high" as const, forecastFn: () => "6.50%", prevFn: () => "6.50%" },
  { event: "India CPI", country: "INR", impact: "high" as const, forecastFn: () => `${(4.5 + Math.random() * 0.8).toFixed(1)}%`, prevFn: () => `${(4.6 + Math.random() * 0.7).toFixed(1)}%` },
]

const HOURS = [2, 5, 8, 10, 12, 14, 17, 19, 21]
const MINS = [0, 30]

export async function GET() {
  const now = new Date()
  const data = []

  // Distribute 10 events across the next 7 days
  for (let i = 0; i < 10; i++) {
    const eventMeta = RECURRING[i % RECURRING.length]
    const eventDate = new Date(now)
    eventDate.setDate(now.getDate() + Math.floor(i * 0.9))
    eventDate.setHours(HOURS[i % HOURS.length], MINS[i % MINS.length], 0, 0)

    // Skip weekends
    if (eventDate.getDay() === 0) eventDate.setDate(eventDate.getDate() + 1)
    if (eventDate.getDay() === 6) eventDate.setDate(eventDate.getDate() + 2)

    const isPast = eventDate < now

    data.push({
      id: `evt-${i}`,
      event: eventMeta.event,
      country: eventMeta.country,
      date: eventDate.toLocaleDateString("en-IN", {
        weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Kolkata",
      }),
      time: eventDate.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
      }),
      impact: eventMeta.impact,
      forecast: eventMeta.forecastFn(),
      previous: eventMeta.prevFn(),
      actual: isPast ? eventMeta.forecastFn() : undefined,
    })
  }

  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
}
