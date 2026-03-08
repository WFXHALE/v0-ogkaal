import { NextResponse } from "next/server"

interface EconomicEvent {
  id: string
  event: string
  country: string
  date: string
  time: string
  impact: "high" | "medium" | "low"
  forecast: string
  previous: string
  actual?: string
}

// Generate upcoming economic events based on typical schedule
function getUpcomingEvents(): EconomicEvent[] {
  const now = new Date()
  const events: EconomicEvent[] = []
  
  const majorEvents = [
    { event: "FOMC Meeting Minutes", country: "USD", impact: "high" as const },
    { event: "Non-Farm Payrolls", country: "USD", impact: "high" as const },
    { event: "CPI m/m", country: "USD", impact: "high" as const },
    { event: "Core CPI m/m", country: "USD", impact: "high" as const },
    { event: "PPI m/m", country: "USD", impact: "medium" as const },
    { event: "Retail Sales m/m", country: "USD", impact: "high" as const },
    { event: "Interest Rate Decision", country: "USD", impact: "high" as const },
    { event: "GDP q/q", country: "USD", impact: "high" as const },
    { event: "Unemployment Claims", country: "USD", impact: "medium" as const },
    { event: "ECB Interest Rate Decision", country: "EUR", impact: "high" as const },
    { event: "BOE Interest Rate Decision", country: "GBP", impact: "high" as const },
    { event: "BOJ Interest Rate Decision", country: "JPY", impact: "high" as const },
    { event: "German CPI m/m", country: "EUR", impact: "medium" as const },
    { event: "UK CPI y/y", country: "GBP", impact: "high" as const },
  ]
  
  // Generate events for the next 7 days
  for (let i = 0; i < 10; i++) {
    const eventDate = new Date(now)
    eventDate.setDate(now.getDate() + Math.floor(i / 2))
    eventDate.setHours(8 + (i % 6) * 2, 30, 0, 0)
    
    const eventInfo = majorEvents[i % majorEvents.length]
    
    events.push({
      id: `event-${i}`,
      event: eventInfo.event,
      country: eventInfo.country,
      date: eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      time: eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      impact: eventInfo.impact,
      forecast: generateForecast(eventInfo.event),
      previous: generatePrevious(eventInfo.event),
    })
  }
  
  return events
}

function generateForecast(event: string): string {
  if (event.includes("CPI")) return "0.3%"
  if (event.includes("PPI")) return "0.2%"
  if (event.includes("GDP")) return "2.1%"
  if (event.includes("Payrolls") || event.includes("NFP")) return "180K"
  if (event.includes("Interest Rate")) return "5.25%"
  if (event.includes("Unemployment")) return "215K"
  if (event.includes("Retail")) return "0.4%"
  return "-"
}

function generatePrevious(event: string): string {
  if (event.includes("CPI")) return "0.4%"
  if (event.includes("PPI")) return "0.1%"
  if (event.includes("GDP")) return "1.9%"
  if (event.includes("Payrolls") || event.includes("NFP")) return "175K"
  if (event.includes("Interest Rate")) return "5.25%"
  if (event.includes("Unemployment")) return "220K"
  if (event.includes("Retail")) return "0.6%"
  return "-"
}

export async function GET() {
  try {
    const events = getUpcomingEvents()
    
    return NextResponse.json({
      success: true,
      data: events,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch calendar" },
      { status: 500 }
    )
  }
}
