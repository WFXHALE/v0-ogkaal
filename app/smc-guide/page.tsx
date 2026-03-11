"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, BookOpen, Brain, TrendingUp, Layers, Zap } from "lucide-react"

// ── SMC Topics ────────────────────────────────────────────────────────────────
const SMC_TOPICS = [
  { name: "Market Structure",             desc: "The framework of higher highs / higher lows in an uptrend and lower highs / lower lows in a downtrend. It is the first thing you read on any chart." },
  { name: "Break of Structure (BOS)",     desc: "When price breaks a previous swing high in an uptrend or a previous swing low in a downtrend, confirming that trend continuation is underway." },
  { name: "Change of Character (CHoCH)",  desc: "When price breaks against the current structure for the first time, signalling a potential reversal and that smart money may be repositioning." },
  { name: "Order Blocks",                 desc: "The last candle in the opposite direction before a strong institutional move. Price often returns to these zones before continuing in the original direction." },
  { name: "Fair Value Gap (FVG)",         desc: "A three-candle imbalance where price moved so fast that a gap remains between candle 1's wick and candle 3's wick. Price frequently returns to fill this inefficiency." },
  { name: "Liquidity Pools",              desc: "Clusters of stop-loss orders resting above old highs (buy-side) and below old lows (sell-side). Institutions target these pools before reversing price." },
  { name: "Inducement",                   desc: "A minor fake-out move designed to lure retail traders into a trade in the wrong direction before the true institutional move begins." },
  { name: "Equal Highs / Equal Lows",     desc: "Two or more swing highs or lows at the same price level. These are strong liquidity targets because retail traders place stops just beyond them." },
  { name: "Premium & Discount Zones",     desc: "Above the 50% midpoint of a range is Premium (ideal for selling). Below the 50% midpoint is Discount (ideal for buying). Institutions buy cheap and sell expensive." },
  { name: "Mitigation Blocks",            desc: "Former support levels that have been broken and flipped into resistance — or vice versa. Price returns to these areas to fill institutional orders before the next leg." },
  { name: "Breaker Blocks",               desc: "An order block that has been broken through and now acts in the opposite role. A bullish breaker was previously a bearish order block that has since been taken out." },
  { name: "Liquidity Sweep",              desc: "A deliberate move to trigger stop-losses above a high or below a low before a sharp reversal. The sweep and subsequent rejection is the entry signal." },
  { name: "Imbalance",                    desc: "Any area on the chart where price traded in one direction without two-sided participation. FVGs are the most common form of imbalance." },
  { name: "Institutional Order Flow",     desc: "The directional bias of large institutional participants inferred from market structure, liquidity sweeps, and order block creation on higher timeframes." },
  { name: "Accumulation / Distribution",  desc: "Accumulation is when institutions quietly build positions at low prices. Distribution is when they sell those positions at higher prices to retail buyers." },
  { name: "Swing High / Swing Low",       desc: "A swing high is a candle with lower highs on both sides. A swing low is a candle with higher lows on both sides. They define the key structural reference points." },
  { name: "Displacement",                 desc: "A strong, fast, impulsive move away from a range that leaves behind imbalances and fair value gaps. It confirms institutional intent in that direction." },
  { name: "Optimal Trade Entry (OTE)",    desc: "A Fibonacci retracement zone between 61.8% and 79% of a swing. ICT identifies this as the highest-probability area to enter after a displacement." },
  { name: "Consequent Encroachment",      desc: "The exact 50% midpoint of a Fair Value Gap. Price commonly reacts at this level when returning to fill an FVG before continuing the original move." },
  { name: "Volume Imbalance",             desc: "Similar to an FVG but identified when the closing price of one candle and the opening price of the next candle create a gap with low volume in between." },
  { name: "Rejection Block",              desc: "A candle with a long wick that indicates a failed attempt to push price beyond a key level. The body of the candle acts as the order block for future reactions." },
  { name: "Propulsion Block",             desc: "A consolidation zone just before a strong impulsive move. When price returns to this area, it often propels price again in the original direction." },
]

// ── ICT Topics ────────────────────────────────────────────────────────────────
const ICT_TOPICS = [
  { name: "ICT Killzones",             desc: "Specific time windows of peak institutional activity: London (2–5 AM NY), New York AM (7–10 AM NY), and London Close (10 AM–12 PM NY)." },
  { name: "Power of Three (AMD)",      desc: "A three-phase daily model: Accumulation (ranging), Manipulation (false move to sweep stops), and Distribution (the real directional move)." },
  { name: "Silver Bullet Setup",       desc: "A time-based FVG entry model with three windows — 3–4 AM, 10–11 AM, and 2–3 PM NY time. Look for a sweep followed by an FVG to enter." },
  { name: "Turtle Soup",               desc: "A reversal pattern where price breaks just beyond a 20-day high or low, triggers retail breakout entries, then immediately reverses sharply." },
  { name: "SMT Divergence",            desc: "When two correlated pairs (e.g. EURUSD and GBPUSD) diverge — one makes a new high while the other fails to — signalling a potential reversal." },
  { name: "ICT Order Blocks",          desc: "The same concept as SMC order blocks but framed within ICT's daily/weekly models. ICT specifies the precise candle that carries institutional orders." },
  { name: "ICT Fair Value Gaps",       desc: "FVGs formed within ICT killzone windows carry higher probability because they align with peak institutional order flow timing." },
  { name: "Macro Time Windows",        desc: "Specific 20-minute windows during the NY session (e.g. 9:50–10:10 AM) where algorithmic price delivery consistently produces high-probability setups." },
  { name: "Session Liquidity",         desc: "The high and low created during the Asian session act as primary liquidity targets for the London and New York sessions to sweep before reversing." },
  { name: "London Judas Swing",        desc: "A false move during early London hours designed to mislead traders about the day's direction before the real move begins during the NY session." },
  { name: "Daily Bias",                desc: "The higher-timeframe directional expectation for the trading day. Determined by the weekly structure, previous day's liquidity targets, and IPDA data." },
  { name: "New York Reversal",         desc: "A common pattern where price sweeps the London session high or low at the New York open before reversing sharply in the opposite direction." },
  { name: "Draw on Liquidity (DOL)",   desc: "The next significant liquidity target that price is being delivered toward. Identifying the DOL tells you where the current move will likely terminate." },
  { name: "IPDA Lookback",             desc: "ICT's Interbank Price Delivery Algorithm looks back 20, 40, and 60 trading days to identify where the algorithm is sourcing liquidity targets from." },
  { name: "Midnight Open",             desc: "The New York midnight price level (00:00 NY time). Price frequently returns to this level before making the day's directional move." },
  { name: "New York Open Gap",         desc: "The gap between the 5 PM Friday close and the Sunday open. These gaps act as targets and often get filled within the first few days of the new week." },
  { name: "Quarterly Shifts",          desc: "ICT identifies the first two weeks of each quarter as periods where institutions shift their positioning, creating high-probability reversal opportunities." },
  { name: "Unicorn Model",             desc: "A high-confidence ICT setup combining a CHoCH, a Fair Value Gap, and a Breaker Block in alignment with higher timeframe structure." },
  { name: "Inverse FVG",               desc: "An FVG that forms in the opposite direction of the trend and gets filled, signalling that the trend is likely to continue rather than reverse." },
  { name: "Central Bank Dealer Range", desc: "The high-to-low range formed during the Asian session, used as a reference for the day's dealing range and likely manipulation targets." },
]

// ── Section wrapper ───────────────────────────────────────────────────────────
function SectionHeading({ num, label, icon }: { num: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Section {num}</p>
        <h2 className="text-xl font-bold text-foreground leading-tight">{label}</h2>
      </div>
    </div>
  )
}

// ── Topic card ────────────────────────────────────────────────────────────────
function TopicCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1.5 hover:border-primary/30 transition-colors">
      <p className="text-sm font-bold text-foreground leading-snug">{name}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SmcGuidePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="px-4 py-16 text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Complete Guide</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance leading-tight mb-5">
            SMC & ICT Professional Trading Guide
          </h1>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            A structured guide covering Smart Money Concepts, ICT methodology, trading psychology, and all the key topics from foundation to advanced concepts.
          </p>
        </section>

        <div className="max-w-5xl mx-auto px-4 pb-20 space-y-16">

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1 — What is SMC?
          ═══════════════════════════════════════════════════════════════ */}
          <section>
            <SectionHeading num="1" label="What is Smart Money Concepts (SMC)?" icon={<BookOpen className="w-5 h-5" />} />
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">What Smart Money Concepts Are</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Smart Money Concepts (SMC) is a trading methodology that focuses on understanding how institutional traders — banks, hedge funds, and major financial entities — operate in the market. Instead of following conventional retail indicators like RSI or MACD, SMC traders study the footprints institutions leave behind in raw price action.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Why SMC Works</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Institutions cannot fill large orders at a single price without moving the market against themselves. They need to engineer liquidity — deliberately pushing price toward areas where retail stop-losses cluster — before reversing in their intended direction. SMC teaches traders to recognise these patterns and align their entries with institutional order flow rather than against it.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Who Introduced SMC</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Smart Money Concepts as a unified framework was largely popularised by the trading education community building on the concepts originally shared by Michael J. Huddleston (ICT). SMC distilled ICT's more complex methodology into accessible concepts focused on order blocks, liquidity, and market structure — making institutional trading analysis accessible to retail traders worldwide.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2 — What is ICT?
          ═══════════════════════════════════════════════════════════════ */}
          <section>
            <SectionHeading num="2" label="What is ICT (Inner Circle Trader)?" icon={<Zap className="w-5 h-5" />} />
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">What ICT Concepts Are</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ICT refers to the trading methodology developed and taught by Michael J. Huddleston, known online as "The Inner Circle Trader". ICT concepts are built on the premise that central banks and institutional trading desks follow algorithmic price delivery models. Understanding these models gives retail traders a significant edge in reading where price is being delivered next.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Why ICT Trading Works</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ICT is not a system of signals or indicators. It is a framework for understanding how price is deliberately delivered by algorithms to reach liquidity targets. The same patterns repeat across all timeframes and all liquid markets because they are driven by the same algorithmic logic. Traders who understand the logic trade with the algorithm instead of being confused by it.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Who Introduced ICT Methodology</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Michael J. Huddleston began sharing ICT concepts publicly in the 2000s and has since taught hundreds of thousands of traders through his YouTube channel and mentorship programmes. His methodology covers everything from basic liquidity and order blocks to advanced time-based models, IPDA data ranges, and algorithmic price delivery frameworks.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 3 — Trading Psychology
          ═══════════════════════════════════════════════════════════════ */}
          <section>
            <SectionHeading num="3" label="Trading Psychology" icon={<Brain className="w-5 h-5" />} />
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Discipline</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Discipline is the ability to follow your trading plan without deviation, regardless of how you feel in the moment. Knowledge of SMC or ICT does not make a profitable trader — consistent execution does. Every trade must follow the same process: same analysis, same risk, same quality filter.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Patience</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The market does not owe you a trade every day. Professional traders sometimes wait 2–3 days for a setup that meets all their criteria. The willingness to sit on your hands and wait for an A+ setup is one of the most underrated skills in trading. Overtrading is the single fastest way to destroy a trading account.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Emotional Control</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fear causes traders to close profitable trades too early. Greed causes traders to hold losing trades too long. Revenge trading — taking a poor-quality trade to recover a loss — is driven by ego rather than logic. Emotional control is built by sizing risk so small that no single trade threatens your account, and by treating every trade as just one data point in a long series.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 4 — SMC Topics
          ═══════════════════════════════════════════════════════════════ */}
          <section>
            <SectionHeading num="4" label="SMC Topics" icon={<TrendingUp className="w-5 h-5" />} />
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              The following are the core concepts within the Smart Money Concepts framework. Each topic below is a building block — understand them in order and they will form a complete picture of how institutional price delivery works.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SMC_TOPICS.map(t => (
                <TopicCard key={t.name} name={t.name} desc={t.desc} />
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 5 — ICT Topics
          ═══════════════════════════════════════════════════════════════ */}
          <section>
            <SectionHeading num="5" label="ICT Topics" icon={<Layers className="w-5 h-5" />} />
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              ICT concepts build on SMC foundations and add time-based, algorithmic, and model-specific frameworks. These tools allow traders to narrow entries to specific windows and setups with very high precision.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ICT_TOPICS.map(t => (
                <TopicCard key={t.name} name={t.name} desc={t.desc} />
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 6 — Mentorship
          ═══════════════════════════════════════════════════════════════ */}
          <section>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Section 6 — Mentorship Program</p>
                <h2 className="text-xl font-bold text-foreground mb-3 text-balance">
                  Want to Learn All These Concepts in Detail?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you want to master SMC and ICT concepts through structured, live coaching — with real trade examples, personal feedback, and a step-by-step learning path — you can join our professional mentorship program. We cover every topic in this guide in depth, from foundations to funded account strategies.
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

        </div>
      </main>
      <Footer />
    </div>
  )
}
