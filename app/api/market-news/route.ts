import { NextResponse } from "next/server"

export const runtime = "edge"
// Cache for 10 minutes
export const revalidate = 600

interface RSSItem {
  title: string
  link: string
  pubDate: string
  source?: string
}

// Classify a headline into an asset category
function classifyAsset(title: string): { asset: string; assetType: "forex" | "crypto" | "gold" | "indices" } {
  const t = title.toLowerCase()
  if (t.includes("bitcoin") || t.includes(" btc")) return { asset: "Bitcoin (BTC)", assetType: "crypto" }
  if (t.includes("ethereum") || t.includes(" eth")) return { asset: "Ethereum (ETH)", assetType: "crypto" }
  if (t.includes("crypto") || t.includes("solana") || t.includes("xrp") || t.includes("altcoin")) return { asset: "Crypto", assetType: "crypto" }
  if (t.includes("gold") || t.includes("xauusd") || t.includes("xau")) return { asset: "Gold (XAUUSD)", assetType: "gold" }
  if (t.includes("s&p") || t.includes("nasdaq") || t.includes("dow jones") || t.includes("stock market") || t.includes("equities")) return { asset: "S&P 500", assetType: "indices" }
  if (t.includes("eur/usd") || t.includes("eurusd") || t.includes("euro")) return { asset: "EUR/USD", assetType: "forex" }
  if (t.includes("gbp") || t.includes("pound")) return { asset: "GBP/USD", assetType: "forex" }
  if (t.includes("jpy") || t.includes("yen")) return { asset: "USD/JPY", assetType: "forex" }
  if (t.includes("aud") || t.includes("australian")) return { asset: "AUD/USD", assetType: "forex" }
  if (t.includes("forex") || t.includes("dollar") || t.includes("usd") || t.includes("fed") || t.includes("interest rate") || t.includes("inflation")) return { asset: "Forex", assetType: "forex" }
  return { asset: "Markets", assetType: "indices" }
}

function classifyImpact(title: string): "bullish" | "bearish" | "neutral" {
  const t = title.toLowerCase()
  const bullish = ["surge", "rally", "rise", "gain", "jump", "soar", "beat", "strong", "bullish", "high", "record", "up", "boost", "grow", "positive", "optimism", "recovery"]
  const bearish = ["fall", "drop", "decline", "crash", "plunge", "weak", "bearish", "low", "loss", "concern", "risk", "fear", "sell", "negative", "recession", "worries", "down"]
  const bScore = bullish.filter(w => t.includes(w)).length
  const beScore = bearish.filter(w => t.includes(w)).length
  if (bScore > beScore) return "bullish"
  if (beScore > bScore) return "bearish"
  return "neutral"
}

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = Date.now()
    const diff = Math.floor((now - date.getTime()) / 60000) // minutes
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
  } catch {
    return "recently"
  }
}

async function fetchRSSFeed(url: string, sourceName: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MarketBot/1.0)" },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const items: RSSItem[] = []
    // Simple XML parsing — extract <item> blocks
    const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)
    for (const match of itemMatches) {
      const block = match[1]
      const title = (block.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/s) ||
                     block.match(/<title[^>]*>(.*?)<\/title>/s))?.[1]?.trim() ?? ""
      const link  = (block.match(/<link[^>]*>(.*?)<\/link>/s))?.[1]?.trim() ?? ""
      const pubDate = (block.match(/<pubDate[^>]*>(.*?)<\/pubDate>/s))?.[1]?.trim() ?? ""
      if (title && title.length > 20) {
        items.push({ title, link, pubDate, source: sourceName })
      }
      if (items.length >= 8) break
    }
    return items
  } catch {
    return []
  }
}

export async function GET() {
  // Fetch from multiple free RSS feeds in parallel
  const [investing, forexlive, coindesk] = await Promise.all([
    fetchRSSFeed("https://www.investing.com/rss/news.rss", "Investing.com"),
    fetchRSSFeed("https://www.forexlive.com/feed/news", "ForexLive"),
    fetchRSSFeed("https://www.coindesk.com/arc/outboundfeeds/rss/", "CoinDesk"),
  ])

  const rawItems = [...investing, ...forexlive, ...coindesk]

  // Deduplicate by similar title, classify, and limit to 12
  const seen = new Set<string>()
  const news = rawItems
    .filter(item => {
      const key = item.title.slice(0, 40).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 12)
    .map((item, i) => {
      const { asset, assetType } = classifyAsset(item.title)
      return {
        id: String(i + 1),
        asset,
        assetType,
        headline: item.title,
        impact: classifyImpact(item.title),
        source: item.source ?? "Markets",
        time: item.pubDate ? timeAgo(item.pubDate) : "recently",
        url: item.link,
      }
    })

  // Fallback if all feeds fail
  if (news.length === 0) {
    return NextResponse.json({ news: [], error: "feeds_unavailable" })
  }

  return NextResponse.json({ news })
}
