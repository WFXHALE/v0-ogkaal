"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ChevronDown, ChevronUp, BookOpen, ArrowRight } from "lucide-react"

// ── Category colour map ───────────────────────────────────────────────────────
const catStyle: Record<string, string> = {
  SMC:              "bg-[#FCD535]/10 text-[#FCD535] border-[#FCD535]/30",
  ICT:              "bg-sky-500/10 text-sky-400 border-sky-500/30",
  Psychology:       "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Funded Accounts":"bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Risk Management":"bg-green-500/10 text-green-400 border-green-500/30",
  Analysis:         "bg-orange-500/10 text-orange-400 border-orange-500/30",
}

// ── Original 6 blog posts (article previews) ─────────────────────────────────
const posts = [
  {
    slug: "why-retail-traders-lose",
    category: "Psychology",
    title: "Why 90% of Retail Traders Lose — And How to Be in the 10%",
    excerpt: "Most retail traders fail not because of bad strategies, but because they don't understand who they are trading against. Here's the truth about market manipulation and how to stop being the liquidity.",
    date: "March 5, 2025",
    readTime: "8 min read",
  },
  {
    slug: "order-blocks-explained",
    category: "SMC",
    title: "Order Blocks Explained: Finding Where Institutions Buy and Sell",
    excerpt: "Order blocks are the most powerful entry tool in Smart Money Concepts. Learn how to identify valid order blocks, which ones to trade, and how to set entries with minimal risk.",
    date: "February 20, 2025",
    readTime: "10 min read",
  },
  {
    slug: "liquidity-zones-guide",
    category: "SMC",
    title: "Liquidity Zones: The Key to Reading Institutional Price Action",
    excerpt: "Price doesn't move randomly — it's engineered to sweep liquidity before reversing. Master this concept and you'll stop getting stop hunted forever.",
    date: "February 10, 2025",
    readTime: "7 min read",
  },
  {
    slug: "funded-account-guide",
    category: "Funded Accounts",
    title: "How to Pass FTMO in 30 Days Using SMC Strategies",
    excerpt: "A step-by-step breakdown of the exact approach OG KAAL students use to pass FTMO and other funded account challenges with an 80%+ pass rate.",
    date: "January 28, 2025",
    readTime: "12 min read",
  },
  {
    slug: "risk-management-rules",
    category: "Risk Management",
    title: "The 5 Risk Management Rules Every Profitable Trader Follows",
    excerpt: "Strategy is worthless without proper risk management. These five rules will protect your account and allow you to survive long enough to become consistently profitable.",
    date: "January 15, 2025",
    readTime: "6 min read",
  },
  {
    slug: "gold-trading-smc",
    category: "Analysis",
    title: "Trading XAUUSD (Gold) with Smart Money Concepts",
    excerpt: "Gold is one of the most liquid and manipulated markets in the world — making it perfect for SMC traders. Here's how OG KAAL approaches gold setups.",
    date: "January 3, 2025",
    readTime: "9 min read",
  },
]

// ── Top 10 educational articles ───────────────────────────────────────────────
type Article = {
  id: number
  category: string
  title: string
  sections: { heading: string; body: string[] }[]
}

const TOP_10: Article[] = [
  {
    id: 1,
    category: "SMC",
    title: "What is Smart Money Concept (SMC)?",
    sections: [
      {
        heading: "Understanding SMC",
        body: [
          "Smart Money Concepts (SMC) is a trading methodology built around understanding how institutional participants — banks, hedge funds, and major financial entities — operate in the financial markets. Instead of following conventional retail indicators, SMC traders study the footprints institutions leave behind in price.",
          "The core idea is simple: large institutions need massive amounts of liquidity to fill their orders. Retail traders, with their predictable stop-loss placements, become that liquidity source. SMC teaches you to recognise where institutions enter and how to align your trades with them rather than against them.",
        ],
      },
      {
        heading: "Why Institutions Move the Market",
        body: [
          "No single retail trader can move a major market like XAUUSD or EURUSD. Only institutions with enormous capital can push price significantly. This means every major swing, every reversal, and every trend is driven by institutional activity.",
          "Institutions do not simply buy or sell at the current price. They need to engineer liquidity — engineering areas where enough retail orders exist — before they can fill their own positions. This creates patterns that repeat across all timeframes.",
        ],
      },
      {
        heading: "How Retail Traders Lose Liquidity",
        body: [
          "Retail traders typically place stop-losses just above swing highs and below swing lows. This is exactly where institutions drive price before reversing. Every time you get stopped out on a seemingly correct trade, you may have been caught in a deliberate liquidity sweep.",
          "Retail traders also tend to chase breakouts. When price breaks a key level and retail enters, institutions use that momentum to close their positions — leaving retail traders trapped in losing trades.",
        ],
      },
      {
        heading: "Core Concepts Inside SMC",
        body: [
          "Market Structure — The framework of higher highs, higher lows (uptrend) and lower highs, lower lows (downtrend). Reading structure correctly tells you where price is likely to go next.",
          "Break of Structure (BOS) — When price breaks a previous swing high or low in the direction of the current trend, confirming trend continuation.",
          "Change of Character (CHOCH) — When price breaks against the current trend structure, signalling a potential reversal and the beginning of a new trend.",
          "Order Blocks — The last bullish or bearish candle before a significant move. These zones represent where institutions placed large orders and where price is likely to react on a return.",
          "Fair Value Gaps (FVG) — Price imbalances created when price moves so fast that it leaves a gap between two candles. Price often returns to fill these gaps before continuing.",
          "Liquidity Pools — Areas where stop-losses cluster, typically above old highs or below old lows. Institutions target these zones to find the orders they need.",
          "Liquidity Sweeps — The deliberate move by institutions to trigger stop-losses and grab liquidity, followed immediately by a sharp reversal in the opposite direction.",
        ],
      },
    ],
  },
  {
    id: 2,
    category: "SMC",
    title: "Why Smart Money Concepts Work",
    sections: [
      {
        heading: "Institutional Behaviour Creates Predictable Patterns",
        body: [
          "Institutional trading is not random. Large players follow internal mandates, risk protocols, and liquidity requirements that force them to operate in predictable ways. They must build positions gradually, sweeping liquidity at structured levels before reversing.",
          "This systematic behaviour produces the same patterns across every market and every timeframe. A liquidity sweep on a one-minute chart follows the same logic as one on a daily chart — only the scale changes.",
        ],
      },
      {
        heading: "Following Liquidity, Not Indicators",
        body: [
          "Traditional retail indicators are lagging. They react to price after the move has already happened. SMC traders instead track where liquidity sits — old highs, old lows, equal highs, equal lows — and anticipate institutional moves before they complete.",
          "By understanding where stop-losses are clustered and where institutions need to fill orders, SMC gives traders an edge based on market mechanics rather than signals that every other retail trader is also reading.",
        ],
      },
    ],
  },
  {
    id: 3,
    category: "SMC",
    title: "Market Structure Explained",
    sections: [
      {
        heading: "Reading Trend Through Structure",
        body: [
          "Market structure is the backbone of SMC analysis. Before looking at any entry, a trader must first identify the current market structure on their higher timeframe: is price making higher highs and higher lows (bullish), or lower highs and lower lows (bearish)?",
          "Trend continuation is confirmed by a Break of Structure (BOS) — price exceeds the most recent swing high in a bull trend or the most recent swing low in a bear trend. This tells the trader that institutional momentum is still active.",
        ],
      },
      {
        heading: "Change of Character (CHOCH)",
        body: [
          "A CHOCH occurs when price breaks against the current structure for the first time. In a bullish trend, a CHOCH is when price breaks below the most recent higher low, suggesting that institutional selling has begun.",
          "The key distinction between BOS and CHOCH: a BOS confirms the existing trend; a CHOCH signals that the trend may be ending. Traders use CHOCH on higher timeframes to switch bias, then look for lower-timeframe confirmation before entering.",
        ],
      },
    ],
  },
  {
    id: 4,
    category: "SMC",
    title: "Order Blocks Explained",
    sections: [
      {
        heading: "What is an Order Block?",
        body: [
          "An order block is the final candle in the opposite direction before a strong impulsive move. For a bullish order block: the last red (bearish) candle before price surges upward. For a bearish order block: the last green (bullish) candle before price drops sharply.",
          "The reason order blocks matter is that institutions load their orders into these candles. When price returns to that zone, unfilled institutional orders are still waiting — creating a high-probability reaction point.",
        ],
      },
      {
        heading: "Why Institutions Leave Footprints",
        body: [
          "No institution can fill millions of dollars in a single order without moving price against themselves. Instead, they scale into positions over multiple candles. The order block is where that accumulation or distribution began.",
          "Valid order blocks are those formed after a Break of Structure or Change of Character — confirming institutional intent. Traders look for price to return to these zones and show rejection before entering in the direction of the original impulsive move.",
        ],
      },
    ],
  },
  {
    id: 5,
    category: "SMC",
    title: "Fair Value Gap Explained",
    sections: [
      {
        heading: "What is a Fair Value Gap?",
        body: [
          "A Fair Value Gap (FVG) — also called an imbalance — forms when price moves so quickly that a gap exists between the wick of one candle and the wick of the candle two positions later. On a three-candle sequence, the gap between the first candle's high and the third candle's low is the FVG.",
          "This gap represents an area where not enough two-sided trading occurred. The market left behind an inefficiency, and price often returns to that zone to balance out the orders that were skipped during the initial impulse.",
        ],
      },
      {
        heading: "How Traders Use FVGs",
        body: [
          "Traders mark FVGs as potential entry zones. When price returns to fill a bullish FVG (formed during a move upward), it can be treated as a discount entry opportunity in the direction of the original move.",
          "FVGs are most powerful when they align with order blocks or appear at a key liquidity level. They become less reliable when price has already returned to fill them multiple times — a partially-filled FVG loses its significance.",
        ],
      },
    ],
  },
  {
    id: 6,
    category: "SMC",
    title: "Liquidity in Trading",
    sections: [
      {
        heading: "Buy-Side and Sell-Side Liquidity",
        body: [
          "Liquidity in SMC refers to the clusters of pending orders sitting in the market. Buy-side liquidity forms above old swing highs and equal highs, where retail stop-losses from short sellers accumulate. Sell-side liquidity forms below old swing lows and equal lows, where long traders have placed their stops.",
          "Institutions need these liquidity pools to execute their large orders. They drive price toward these zones, trigger the stops, absorb the orders, and then reverse in their intended direction.",
        ],
      },
      {
        heading: "How Stop Hunts Work",
        body: [
          "A stop hunt is a deliberate move by institutional players to push price just beyond a well-known level — triggering retail stop-losses — before reversing sharply. This is how institutions collect the liquidity they need to fill large positions.",
          "Recognising a stop hunt in real time takes practice. Key signals include a fast, wick-heavy push beyond a previous high or low with no follow-through, accompanied by a swift rejection back inside the range. When you see this, the hunt is over — and the real move may be beginning.",
        ],
      },
    ],
  },
  {
    id: 7,
    category: "Psychology",
    title: "How a Trader Becomes Profitable",
    sections: [
      {
        heading: "The Journey to Consistency",
        body: [
          "Becoming a profitable trader is a process, not an event. Most traders want to fast-track results before they have built the foundation. The journey typically follows a predictable path: first you learn the concepts, then you begin to apply them incorrectly, then you identify your mistakes, and finally you develop a repeatable, rule-based process.",
          "There is no shortcut. Even traders who are naturally analytical still need screen time — thousands of hours watching how price behaves around their identified zones before pattern recognition becomes instinctive.",
        ],
      },
      {
        heading: "Discipline and Emotional Control",
        body: [
          "Knowledge does not make a profitable trader. Execution does. Many traders know exactly what they should do and still make emotional decisions when real money is on the line. Building discipline requires treating every trade identically — the same risk, the same process, regardless of how convinced you feel.",
          "Emotional control develops by removing the emotional stakes from individual trades. When your risk per trade is sized correctly, no single loss should feel catastrophic. The goal is never to win one trade; it is to execute consistently over hundreds of trades.",
        ],
      },
      {
        heading: "Building Consistency",
        body: [
          "Consistency means your trading results are more predictable over time. It is achieved by narrowing your strategy to a small number of setups that you understand deeply, instead of trading every pattern you come across.",
          "Track every trade in a journal. Review your wins and losses weekly. The patterns in your mistakes — not your successes — are what reveal where your process needs work.",
        ],
      },
    ],
  },
  {
    id: 8,
    category: "Psychology",
    title: "Trading Psychology and Discipline",
    sections: [
      {
        heading: "FOMO — Fear of Missing Out",
        body: [
          "FOMO leads traders to enter positions after the optimal entry has already passed, chasing a move that is already underway. The result is a poor risk-to-reward ratio and a high likelihood of entering just as the move exhausts.",
          "The solution is straightforward but difficult in practice: if you missed the entry, accept it and move on. Another setup will come. There are always more trades — there is no last trade. Writing this as a rule and reviewing it before every session builds resistance to FOMO over time.",
        ],
      },
      {
        heading: "Overtrading",
        body: [
          "Overtrading comes from boredom, from wanting to recover a loss, or from a belief that more trades equal more profit. In reality, overtrading is the single fastest way to drain a trading account. Most edge comes from high-quality setups — not from frequency.",
          "Set a hard rule: maximum two trades per session. If both setups are losers, close the platform and return the next day. Protecting your capital on bad days is more valuable than any gain on a good day.",
        ],
      },
      {
        heading: "Revenge Trading",
        body: [
          "Revenge trading happens when a trader takes the next trade primarily to recover what was lost, rather than because a valid setup exists. The emotional state that drives revenge trading — frustration, urgency, and a sense of injustice — is incompatible with rational decision-making.",
          "After any losing trade, step away from the charts for at least 30 minutes. Reassess your bias and your emotional state before re-entering. If the loss was within your pre-defined risk, it was a correct trade — not something to recover from.",
        ],
      },
    ],
  },
  {
    id: 9,
    category: "Psychology",
    title: "Daily Routine of a Professional Trader",
    sections: [
      {
        heading: "Pre-Session Market Analysis",
        body: [
          "Before any trade is considered, a professional trader reviews the higher timeframe context. This means identifying the current market structure on the Daily and 4H charts, locating the key liquidity zones and order blocks, and determining a directional bias for the session.",
          "This analysis is done before the market opens — not reactively as price moves. Decisions made reactively are almost always emotional. Decisions made from a pre-planned framework are almost always more disciplined.",
        ],
      },
      {
        heading: "Trade Planning",
        body: [
          "After establishing bias, the trader identifies specific entry zones: order blocks, FVGs, or liquidity levels where they would look to enter. They pre-define their stop-loss placement, take-profit target, and the exact conditions that must be met for the trade to be valid.",
          "This is the plan. If price reaches the zone but does not show the expected reaction, the trade is skipped. Entering without confirmation because 'price is near my zone' is not following the plan — it is improvising.",
        ],
      },
      {
        heading: "Risk Management Execution",
        body: [
          "Every trade is sized based on a fixed percentage risk — typically 0.5% to 1% of the account. Position size is calculated before entry, not guessed. Stop-losses are placed at the level that invalidates the trade setup, not at a round number that feels comfortable.",
          "Once in a trade, the professional does not move their stop-loss against themselves. Managing a trade means letting the plan play out, not re-negotiating risk in real time.",
        ],
      },
      {
        heading: "Journaling",
        body: [
          "Every trade is logged after it closes: the setup, the entry reason, the result, and the lesson. Screenshots of the entry and exit are attached. The journal is reviewed at the end of each week to identify recurring mistakes and strengths.",
          "Professionals treat their trading journal as their most valuable tool. It is the only objective record of what actually happened — not what they thought happened.",
        ],
      },
    ],
  },
  {
    id: 10,
    category: "ICT",
    title: "What is ICT (Inner Circle Trader)?",
    sections: [
      {
        heading: "What ICT Trading Concepts Are",
        body: [
          "ICT refers to the trading methodology developed and taught by Michael J. Huddleston, known online as 'The Inner Circle Trader'. ICT concepts are built on the premise that central banks and institutional trading desks follow algorithmic price delivery models — and that understanding these models gives retail traders a significant edge.",
          "ICT is not a system of signals or indicators. It is a framework for understanding how price is deliberately delivered by algorithms to reach liquidity targets, how to identify when that delivery is happening, and how to position yourself to benefit from it.",
        ],
      },
      {
        heading: "How ICT Builds on Institutional Trading",
        body: [
          "ICT expands on concepts like liquidity, order flow, and market structure — pushing them further into the mechanics of how banks and central banks actually operate. ICT traders study things like the interbank price delivery algorithm (IPDA), optimal trade entry, and specific time-based models that repeat on monthly, weekly, daily, and intraday cycles.",
          "The methodology teaches traders to read price as a series of algorithmic objectives rather than random movements, which changes how they approach setups entirely.",
        ],
      },
      {
        heading: "Core ICT Concepts",
        body: [
          "Liquidity — The foundation of ICT. Price is always seeking out areas of liquidity (old highs, old lows, equal levels) before reversing. ICT traders map these levels before the session begins.",
          "Killzones — Specific time windows during which institutional order flow is highest: the London Killzone (2–5 AM New York time), the New York AM Killzone (7–10 AM), and the London Close (10 AM–12 PM). Setups taken inside Killzones carry higher probability.",
          "Power of Three — A three-phase daily price delivery model: Accumulation (building a position quietly), Manipulation (a false move to trigger retail stops), and Distribution (the real directional move). Also known as AMD.",
          "Turtle Soup — A reversal pattern based on a false breakout of a 20-day high or low. Price breaks just beyond the level, triggers retail entries, then reverses. ICT traders use this to enter against trapped retail positions.",
          "Unicorn Model — A high-confidence setup combining a Change of Character (CHOCH), a Fair Value Gap, and a Breaker Block forming in alignment with the higher timeframe structure. One of the most precise models in the ICT framework.",
          "Silver Bullet — A time-based entry model specific to three windows: 3–4 AM, 10–11 AM, and 2–3 PM (New York time). Within each window, a trader waits for a Fair Value Gap to form and enters on the retracement into it, targeting the opposing liquidity.",
        ],
      },
    ],
  },
]

// ── Accordion card ─────────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md hover:shadow-black/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 px-5 py-5 text-left hover:bg-secondary/20 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary mt-0.5">
            {article.id}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catStyle[article.category] ?? "bg-secondary text-muted-foreground border-border"}`}>
                {article.category}
              </span>
            </div>
            <h2 className="font-bold text-foreground text-sm leading-snug text-balance">{article.title}</h2>
          </div>
        </div>
        <span className="shrink-0 mt-0.5 text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-border/60 px-5 py-5 space-y-6">
          {article.sections.map(section => (
            <div key={section.heading}>
              <h3 className="text-sm font-bold text-foreground mb-2">{section.heading}</h3>
              <div className="space-y-2">
                {section.body.map((para, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="px-4 py-16 text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Blog</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance leading-tight mb-5">
            Trading Education
          </h1>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            Free articles on Smart Money Concepts, ICT methodology, market psychology, risk management, and funded account strategies.
          </p>
        </section>

        {/* ── Original posts grid ─────────────────────────────────────────── */}
        <section className="px-4 pb-14 max-w-5xl mx-auto">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(p => (
              <article key={p.slug} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catStyle[p.category] ?? "bg-secondary text-muted-foreground border-border"}`}>
                    {p.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{p.readTime}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors text-balance">
                    {p.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{p.excerpt}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{p.date}</span>
                  <Link href={`/blog/${p.slug}`} className="text-xs font-semibold text-primary hover:underline">
                    Read more
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Top 10 Educational Series ────────────────────────────────────── */}
        <section className="px-4 pb-16 max-w-3xl mx-auto" aria-labelledby="top10-heading">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-border/50" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top 10 Educational Articles</span>
            </div>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <h2 id="top10-heading" className="text-2xl font-bold text-foreground text-center mb-2 text-balance">
            SMC, ICT & Professional Trading — Complete Guide
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8 text-pretty leading-relaxed">
            A structured series covering everything from the foundations of Smart Money Concepts to the daily habits of professional traders. Click any article to expand it.
          </p>
          <div className="space-y-3">
            {TOP_10.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        {/* ── Mentorship CTA ──────────────────────────────────────────────── */}
        <section className="px-4 pb-20 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Mentorship Program</p>
              <h3 className="text-lg font-bold text-foreground mb-2 text-balance">
                Learn these concepts live with professional guidance
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you want to learn these concepts live and understand how professional traders use them in real trading, you can join our mentorship program.
              </p>
            </div>
            <Link
              href="/mentorship"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[.98] transition-all"
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
