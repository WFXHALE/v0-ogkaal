import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Smart Money Concepts (SMC) Trading Guide | OG KAAL TRADER",
  description:
    "Complete beginner's guide to Smart Money Concepts (SMC) and ICT trading strategies. Learn order blocks, liquidity zones, market structure, and how institutional traders move price.",
  keywords: "Smart Money Concepts, SMC trading, ICT trading, order blocks, liquidity zones, market structure, forex guide",
  openGraph: {
    title: "SMC Trading Guide — OG KAAL TRADER",
    description: "Free complete guide to Smart Money Concepts. Learn to trade like institutions with order blocks, liquidity, and market structure.",
    type: "article",
  },
}

const chapters = [
  {
    num: "01",
    title: "What is Smart Money Concepts (SMC)?",
    body: "Smart Money Concepts is a trading methodology that focuses on understanding how institutional traders — banks, hedge funds, and large financial institutions — manipulate price to fill their large orders before moving price in the intended direction. Unlike retail strategies that rely on lagging indicators, SMC traders read raw price action and order flow.",
    points: ["Banks move price to grab liquidity before reversing", "Retail traders provide the liquidity institutions need", "SMC teaches you to stop being hunted and start hunting with the smart money"],
  },
  {
    num: "02",
    title: "Market Structure",
    body: "Market structure is the foundation of SMC. Price moves in a series of higher highs (HH) and higher lows (HL) in an uptrend, and lower highs (LH) and lower lows (LL) in a downtrend. A Break of Structure (BOS) confirms continuation while a Change of Character (CHoCH) signals potential reversal.",
    points: ["Identify swing highs and swing lows on higher timeframes", "BOS = trend continues in the same direction", "CHoCH = smart money is shifting position, reversal incoming"],
  },
  {
    num: "03",
    title: "Liquidity",
    body: "Liquidity in SMC refers to areas where stop losses cluster — these are the fuel institutions need to fill large orders. Equal highs and lows, swing highs/lows, and previous day highs/lows are all liquidity pools. Price is engineered to sweep these levels before reversing.",
    points: ["Buy-side liquidity sits above swing highs (retail buy stops)", "Sell-side liquidity sits below swing lows (retail sell stops)", "After sweeping liquidity, look for a reversal entry"],
  },
  {
    num: "04",
    title: "Order Blocks",
    body: "An order block is the last up-candle before a bearish move (bearish OB) or the last down-candle before a bullish move (bullish OB). These represent areas where institutions placed large pending orders. When price returns to these zones, institutions re-enter to push price in the original direction.",
    points: ["Bearish OB: last bullish candle before a strong bearish move", "Bullish OB: last bearish candle before a strong bullish move", "Best OBs are those that caused a BOS on a lower timeframe"],
  },
  {
    num: "05",
    title: "Fair Value Gaps (FVG)",
    body: "A Fair Value Gap is a 3-candle pattern where the wicks of candle 1 and candle 3 do not overlap, leaving an imbalance in price. These gaps represent areas where price traded so fast that the market was inefficient. Price often returns to fill FVGs before continuing the trend.",
    points: ["Look for FVGs after strong impulsive moves", "Best FVGs align with order blocks or liquidity sweeps", "Use FVG mitigation as entry confirmation"],
  },
  {
    num: "06",
    title: "Entry Model (Top-Down Analysis)",
    body: "The SMC entry model works top-down: identify the trend and key levels on the Daily or 4H chart, wait for liquidity to be swept on the 1H, then zoom into the 15m or 5m chart for a precise entry using an order block or FVG after a CHoCH.",
    points: ["HTF (Daily/4H): identify trend and key levels", "MTF (1H): wait for liquidity sweep + CHoCH", "LTF (15m/5m): enter on OB or FVG with tight stop below structure"],
  },
]

export default function SmcGuidePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-16 text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-[#FCD535] uppercase tracking-widest mb-3">Free Guide</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance leading-tight mb-5">
            Smart Money Concepts
          </h1>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed mb-8">
            A complete beginner-to-intermediate guide to understanding how institutional traders move markets — and how to trade with them instead of against them.
          </p>
          <Link href="/mentorship" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCD535] text-black font-bold text-sm hover:bg-[#FCD535]/90 transition-colors">
            Learn Live with OG KAAL
          </Link>
        </section>

        {/* Chapters */}
        <section className="px-4 pb-20 max-w-3xl mx-auto space-y-8">
          {chapters.map(ch => (
            <article key={ch.num} className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-[#FCD535]/30 leading-none">{ch.num}</span>
                <h2 className="text-xl font-bold text-foreground">{ch.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{ch.body}</p>
              <ul className="space-y-2">
                {ch.points.map(p => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FCD535] shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* CTA */}
          <div className="rounded-2xl border border-[#FCD535]/30 bg-[#FCD535]/5 p-8 text-center space-y-4">
            <h3 className="text-xl font-bold text-foreground">Ready to Trade Like Smart Money?</h3>
            <p className="text-muted-foreground text-sm">Join the mentorship program to get live trade reviews, personal guidance, and access to VIP signals.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/mentorship" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#FCD535] text-black font-bold text-sm hover:bg-[#FCD535]/90 transition-colors">
                Join Mentorship
              </Link>
              <Link href="/vip-group" className="inline-flex items-center px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors">
                VIP Signals
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
