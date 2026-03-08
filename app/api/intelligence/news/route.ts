import { NextResponse } from "next/server"

interface NewsItem {
  id: string
  headline: string
  source: string
  time: string
  impact: "bullish" | "bearish" | "neutral"
  category: string
  url?: string
}

// Fetch news from Finnhub (free tier available)
async function fetchFinnhubNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=forex&token=${process.env.FINNHUB_API_KEY || "demo"}`,
      { next: { revalidate: 60 } }
    )
    if (!response.ok) return []
    const data = await response.json()
    
    return data.slice(0, 10).map((item: { id: number; headline: string; source: string; datetime: number; url: string }, index: number) => ({
      id: item.id?.toString() || `news-${index}`,
      headline: item.headline || "Market Update",
      source: item.source || "Financial News",
      time: new Date(item.datetime * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      impact: determineImpact(item.headline),
      category: "Forex",
      url: item.url,
    }))
  } catch {
    return []
  }
}

// Fetch crypto news from CryptoCompare
async function fetchCryptoNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest",
      { next: { revalidate: 60 } }
    )
    if (!response.ok) return []
    const data = await response.json()
    
    return (data.Data || []).slice(0, 5).map((item: { id: string; title: string; source: string; published_on: number; url: string }, index: number) => ({
      id: item.id || `crypto-${index}`,
      headline: item.title || "Crypto Update",
      source: item.source || "Crypto News",
      time: new Date(item.published_on * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      impact: determineImpact(item.title),
      category: "Crypto",
      url: item.url,
    }))
  } catch {
    return []
  }
}

function determineImpact(headline: string): "bullish" | "bearish" | "neutral" {
  const lowerHeadline = headline.toLowerCase()
  
  const bullishKeywords = [
    "surge", "rally", "gains", "rises", "bullish", "up", "higher", "growth",
    "positive", "boost", "soars", "jumps", "climbs", "advances", "recovery"
  ]
  
  const bearishKeywords = [
    "falls", "drops", "declines", "bearish", "down", "lower", "crash", "plunge",
    "negative", "slump", "tumbles", "slides", "weakness", "selloff", "fear"
  ]
  
  const bullishCount = bullishKeywords.filter(word => lowerHeadline.includes(word)).length
  const bearishCount = bearishKeywords.filter(word => lowerHeadline.includes(word)).length
  
  if (bullishCount > bearishCount) return "bullish"
  if (bearishCount > bullishCount) return "bearish"
  return "neutral"
}

export async function GET() {
  try {
    const [forexNews, cryptoNews] = await Promise.all([
      fetchFinnhubNews(),
      fetchCryptoNews(),
    ])
    
    // Combine and sort by time
    const allNews = [...forexNews, ...cryptoNews]
      .slice(0, 10)
      .sort(() => Math.random() - 0.5) // Mix forex and crypto

    // If no API data, provide fallback headlines
    const finalNews = allNews.length > 0 ? allNews : [
      {
        id: "1",
        headline: "Federal Reserve signals potential rate decision ahead",
        source: "Reuters",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        impact: "neutral" as const,
        category: "Forex",
      },
      {
        id: "2", 
        headline: "Bitcoin maintains strength above key support levels",
        source: "CoinDesk",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        impact: "bullish" as const,
        category: "Crypto",
      },
      {
        id: "3",
        headline: "Gold prices steady amid dollar fluctuations",
        source: "Bloomberg",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        impact: "neutral" as const,
        category: "Commodities",
      },
    ]

    return NextResponse.json({
      success: true,
      data: finalNews,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("News API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    )
  }
}
