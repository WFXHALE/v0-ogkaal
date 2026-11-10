import { NextResponse } from "next/server"

function sentiment(title: string): "bullish" | "bearish" | "neutral" {
  const t = title.toLowerCase()
  const bull = ["surge", "rally", "gains", "rises", "bullish", "higher", "growth", "soars", "jumps", "climbs", "recovery", "breaks out", "breakout"]
  const bear = ["falls", "drops", "declines", "bearish", "lower", "crash", "plunge", "slump", "tumbles", "slides", "selloff", "fear", "warning", "collapse"]
  const b = bull.filter(w => t.includes(w)).length
  const r = bear.filter(w => t.includes(w)).length
  if (b > r) return "bullish"
  if (r > b) return "bearish"
  return "neutral"
}

export async function GET() {
  try {
    const res = await fetch(
      "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest&limit=12",
      { next: { revalidate: 180 }, signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) throw new Error(`CryptoCompare returned HTTP ${res.status}`)
    const json = await res.json() as { Data?: unknown }
    const raw = json.Data
    const items: unknown[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { Data?: unknown[] } | null)?.Data)
        ? (raw as { Data: unknown[] }).Data
        : []
    if (items.length === 0) throw new Error("CryptoCompare returned no news items")

    const data = items.slice(0, 10).map((entry: unknown, i: number) => {
      const item = entry as { id?: string; title?: string; source?: string; published_on?: number; url?: string }
      return {
        id: item.id ?? `news-${i}`,
        headline: item.title ?? "",
        source: item.source ?? "Unknown",
        time: item.published_on
          ? new Date(item.published_on * 1000).toISOString()
          : null,
        impact: sentiment(item.title ?? ""),
        category: "Crypto",
        url: item.url ?? "",
      }
    }).filter(item => item.headline)

    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[news route] live feed unavailable:", err)
    return NextResponse.json({
      success: false,
      data: [],
      error: "Live market news is temporarily unavailable. Please try again later.",
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
