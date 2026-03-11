"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar, ArrowRight } from "lucide-react"
import { notFound } from "next/navigation"
import { use } from "react"

const catStyle: Record<string, string> = {
  SMC:               "bg-[#FCD535]/10 text-[#FCD535] border-[#FCD535]/30",
  ICT:               "bg-sky-500/10 text-sky-400 border-sky-500/30",
  Psychology:        "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Funded Accounts": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Risk Management": "bg-green-500/10 text-green-400 border-green-500/30",
  Analysis:          "bg-orange-500/10 text-orange-400 border-orange-500/30",
}

type Section = { heading: string; body: string[] }

interface BlogPost {
  slug: string
  category: string
  title: string
  date: string
  readTime: string
  intro: string
  sections: Section[]
}

const ARTICLES: BlogPost[] = [
  {
    slug: "why-retail-traders-lose",
    category: "Psychology",
    title: "Why 90% of Retail Traders Lose — And How to Be in the 10%",
    date: "March 5, 2025",
    readTime: "8 min read",
    intro: "Most traders lose money in financial markets not because their strategy is wrong, but because their psychology and discipline are weak. Many beginners enter trading with unrealistic expectations and believe they can make quick profits without proper knowledge or risk control.",
    sections: [
      {
        heading: "The Overtrading Problem",
        body: [
          "One of the biggest mistakes traders make is overtrading. Instead of waiting for high-probability setups, they take random trades based on emotions. Professional traders understand that patience is a major part of success. They wait for the market to reach their levels before executing trades.",
          "Overtrading causes traders to burn through their capital on low-quality setups. Every poor trade not only loses money but also damages confidence and discipline.",
        ],
      },
      {
        heading: "Poor Risk Management",
        body: [
          "Poor risk management is another major reason traders fail. Beginners often risk too much capital on a single trade. When the trade goes against them, they panic and make emotional decisions. Professional traders usually risk a small percentage of their account and focus on long-term consistency.",
          "Risking more than 1–2% per trade gives the market too much power over your emotions. Small, controlled risk per trade keeps you rational and in the game.",
        ],
      },
      {
        heading: "Fear and Greed",
        body: [
          "Fear and greed destroy many trading accounts. Traders close profitable trades too early because of fear, and they hold losing trades hoping the market will reverse. Both behaviours are driven by emotion rather than logic.",
          "Successful traders focus on discipline, patience, and structured execution rather than quick profits. They follow a pre-written plan and do not deviate from it based on how they feel in the moment.",
        ],
      },
    ],
  },
  {
    slug: "order-blocks-explained",
    category: "SMC",
    title: "Order Blocks Explained: Finding Where Institutions Buy and Sell",
    date: "February 20, 2025",
    readTime: "10 min read",
    intro: "Order blocks are the most powerful entry tool in Smart Money Concepts. They represent the last candle in the opposite direction before a strong institutional move, marking the zone where large players loaded their positions.",
    sections: [
      {
        heading: "What is an Order Block?",
        body: [
          "A bullish order block is the last bearish (red) candle before price surges strongly upward. A bearish order block is the last bullish (green) candle before price drops sharply. These zones represent where institutional accumulation or distribution began.",
          "When price returns to an order block, unfilled institutional orders are still waiting. This creates a high-probability reaction zone where smart money re-enters to continue pushing price in the original direction.",
        ],
      },
      {
        heading: "How to Identify Valid Order Blocks",
        body: [
          "Not every candle before a move is a valid order block. The strongest order blocks are those that caused a Break of Structure (BOS) or Change of Character (CHoCH) — confirming institutional intent behind the move.",
          "Look for order blocks on higher timeframes (Daily, 4H, 1H) to identify the most significant zones. Lower timeframe order blocks within these higher timeframe zones become the most precise entries.",
        ],
      },
      {
        heading: "Trading Order Blocks",
        body: [
          "Wait for price to return to the order block and show rejection before entering. Confirmation signals include a strong rejection candle, a lower timeframe CHoCH inside the zone, or a Fair Value Gap forming within the order block range.",
          "Place your stop-loss just beyond the opposite end of the order block. Target the next liquidity level — the previous high or low that has not been swept yet. A minimum 1:2 risk-to-reward is standard.",
        ],
      },
    ],
  },
  {
    slug: "liquidity-zones-guide",
    category: "SMC",
    title: "Liquidity Zones: The Key to Reading Institutional Price Action",
    date: "February 10, 2025",
    readTime: "7 min read",
    intro: "Price does not move randomly — it is engineered to sweep liquidity before reversing. Understanding liquidity is the single most important shift a retail trader can make.",
    sections: [
      {
        heading: "What is Liquidity?",
        body: [
          "In SMC, liquidity refers to clusters of pending orders sitting above old swing highs and below old swing lows. Retail traders place their stop-losses at these predictable levels. Institutions need these orders to fill their own large positions.",
          "Buy-side liquidity forms above old highs and equal highs, where short sellers have placed their stop-losses. Sell-side liquidity forms below old lows and equal lows, where long traders have placed their stops.",
        ],
      },
      {
        heading: "How Institutions Use Liquidity",
        body: [
          "Institutions deliberately drive price toward these liquidity pools to trigger the stops, absorb the resulting orders, and then reverse in their intended direction. This is why markets so often push just beyond a key level before reversing sharply — the sweep was intentional.",
          "Once you understand this, you stop placing stop-losses at obvious levels. Instead, you place them beyond the next significant structure, out of reach of the most predictable sweeps.",
        ],
      },
      {
        heading: "Identifying Liquidity Sweeps in Real Time",
        body: [
          "A liquidity sweep is characterised by a fast, wick-heavy push beyond a previous high or low, followed by an immediate and sharp reversal back inside the prior range. The candle often has a very long shadow with a small body.",
          "When you see this pattern at a key level, the sweep is likely complete. Wait for a lower-timeframe confirmation — a CHoCH or order block — and enter in the direction of the reversal.",
        ],
      },
    ],
  },
  {
    slug: "funded-account-guide",
    category: "Funded Accounts",
    title: "How to Pass FTMO in 30 Days Using SMC Strategies",
    date: "January 28, 2025",
    readTime: "12 min read",
    intro: "Passing a funded account challenge requires the same discipline as running a live account. The traders who fail treat challenges as gambling. The traders who pass treat them like a professional evaluation.",
    sections: [
      {
        heading: "Understand the Rules First",
        body: [
          "Before placing a single trade, read every rule of the challenge. Understand the maximum daily loss limit, the overall drawdown limit, the minimum trading days requirement, and any restrictions on news trading or overnight positions.",
          "Most traders fail not from bad trades but from rule violations they did not study. Know the rules better than you know your own strategy.",
        ],
      },
      {
        heading: "SMC Strategy for Challenges",
        body: [
          "Focus on one or two clean setups per day — order blocks at key liquidity levels with a minimum 1:3 risk-to-reward ratio. Risk 0.5% to 1% per trade. At this pace, a 10% profit target can be reached in 10–15 trading days without approaching the drawdown limit.",
          "Trade only during London Open and New York Open sessions where volume and directional moves are most reliable. Avoid trades during the Asian session and around major news releases unless you have a clear structure reason.",
        ],
      },
      {
        heading: "Psychology During the Challenge",
        body: [
          "The biggest challenge is not the market — it is yourself. As you approach the profit target, the temptation to overtrade to finish faster or to take low-quality setups grows significantly.",
          "Treat every day of the challenge identically. Same risk, same process, same quality filter. If your setups are not there, do not trade. Finishing in 30 days with consistent execution is more valuable than finishing in 10 days through gambling.",
        ],
      },
    ],
  },
  {
    slug: "risk-management-rules",
    category: "Risk Management",
    title: "The 5 Risk Management Rules Every Profitable Trader Follows",
    date: "January 15, 2025",
    readTime: "6 min read",
    intro: "Strategy is worthless without proper risk management. These five rules will protect your account and allow you to survive long enough to become consistently profitable.",
    sections: [
      {
        heading: "Rule 1 — Risk a Fixed Percentage Per Trade",
        body: [
          "Never risk more than 1–2% of your total account on any single trade. This ensures that even a streak of 10 consecutive losses will not destroy your account. Profitable traders think in terms of hundreds of trades, not individual wins.",
          "Calculate your position size before every entry based on your stop-loss distance and your fixed risk amount. Never guess your lot size.",
        ],
      },
      {
        heading: "Rule 2 — Never Move Your Stop-Loss Against Your Trade",
        body: [
          "Once placed, your stop-loss defines the point at which your trade idea is wrong. Moving it further away to avoid a loss is not risk management — it is denial. It turns a defined, small loss into a potentially catastrophic one.",
          "The only acceptable adjustment to a stop-loss is moving it to break-even or beyond once price has moved sufficiently in your favour.",
        ],
      },
      {
        heading: "Rules 3–5",
        body: [
          "Rule 3 — Set a maximum daily loss limit. If you hit 2–3% in losses in one day, close the platform and return tomorrow. Bad trading days compound when you keep trying to recover.",
          "Rule 4 — Maintain a minimum 1:2 risk-to-reward on every trade. Over time, even a 40% win rate is profitable with a consistent 1:2 RR ratio.",
          "Rule 5 — Track every trade in a journal. You cannot improve what you do not measure. The journal is the most underused and highest-impact tool available to any trader.",
        ],
      },
    ],
  },
  {
    slug: "gold-trading-smc",
    category: "Analysis",
    title: "Trading XAUUSD (Gold) with Smart Money Concepts",
    date: "January 3, 2025",
    readTime: "9 min read",
    intro: "Gold is one of the most liquid and manipulated markets in the world — making it perfect for SMC traders. Its high volatility and clear institutional footprints offer consistent, high-quality setups.",
    sections: [
      {
        heading: "Why Gold is Ideal for SMC",
        body: [
          "XAUUSD has enormous daily volume driven by central banks, hedge funds, and institutional desks. This level of institutional participation means the liquidity sweeps, order blocks, and fair value gaps that SMC traders look for are exceptionally clean and reliable.",
          "Gold also has a clear inverse correlation with the US Dollar Index (DXY). Before trading Gold, always check the DXY direction — a strengthening dollar is generally bearish for gold, and a weakening dollar is generally bullish.",
        ],
      },
      {
        heading: "Key Levels to Watch on Gold",
        body: [
          "Previous day's high and low are the most important levels on Gold. Institutions consistently sweep these levels before the real directional move of the day begins. Mark them each morning before the London session opens.",
          "On the Weekly chart, the previous week's high and low act as major liquidity targets. On the Daily chart, the most recent swing high and swing low define the current dealing range.",
        ],
      },
      {
        heading: "Best Sessions to Trade Gold",
        body: [
          "The London session (7 AM – 10 AM London time) and the New York AM session (2 PM – 5 PM London time) produce the largest and most directional moves on Gold. Avoid trading Gold during the Asian session where price tends to range and create false signals.",
          "The ICT Silver Bullet windows (10 AM–11 AM and 2 PM–3 PM New York time) are particularly effective for Gold setups. During these windows, look for a liquidity sweep of the Asian session high or low, followed by a Fair Value Gap entry in the opposite direction.",
        ],
      },
    ],
  },
]

export default function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const article = ARTICLES.find(a => a.slug === slug)
  if (!article) notFound()

  const others = ARTICLES.filter(a => a.slug !== slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">

        {/* ── Back breadcrumb ── */}
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-2">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>

        {/* ── Article header ── */}
        <header className="max-w-3xl mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catStyle[article.category] ?? "bg-secondary text-muted-foreground border-border"}`}>
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {article.date}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance leading-tight mb-5">
            {article.title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-4 italic">
            {article.intro}
          </p>
        </header>

        {/* ── Article body ── */}
        <article className="max-w-3xl mx-auto px-4 pb-12">
          <div className="space-y-8">
            {article.sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-lg font-bold text-foreground mb-3">{section.heading}</h2>
                <div className="space-y-3">
                  {section.body.map((para, j) => (
                    <p key={j} className="text-base text-muted-foreground leading-relaxed">{para}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        {/* ── More articles ── */}
        {others.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-8">
            <div className="border-t border-border/50 pt-8">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-5">More Articles</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {others.map(o => (
                  <Link
                    key={o.slug}
                    href={`/blog/${o.slug}`}
                    className="group rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors"
                  >
                    <span className={`self-start px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catStyle[o.category] ?? "bg-secondary text-muted-foreground border-border"}`}>
                      {o.category}
                    </span>
                    <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors text-balance">{o.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Mentorship CTA ── */}
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Mentorship Program</p>
              <h3 className="text-base font-bold text-foreground mb-1">Learn these concepts live with professional guidance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Join our mentorship to master SMC and ICT concepts with structured coaching and live trading sessions.
              </p>
            </div>
            <Link
              href="/mentorship"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[.98] transition-all"
            >
              Enroll Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
