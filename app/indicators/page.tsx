import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BarChart2, BookOpen, Code2, Link2, Layers, ChevronRight } from "lucide-react"

const INDICATOR_CATEGORIES = [
  {
    id: "smc",
    label: "SMC Indicators",
    icon: <Layers className="w-5 h-5" />,
    description: "Smart Money Concepts indicators covering order blocks, fair value gaps, liquidity, and market structure.",
    color: "text-[#FCD535]",
    border: "border-[#FCD535]/20",
    bg: "bg-[#FCD535]/5",
    items: [
      "Order Block Detector",
      "Fair Value Gap (FVG) Scanner",
      "Liquidity Sweep Alert",
      "Market Structure Break (MSB / BOS)",
      "Premium & Discount Zones",
    ],
  },
  {
    id: "ict",
    label: "ICT Indicators",
    icon: <BarChart2 className="w-5 h-5" />,
    description: "Inner Circle Trader methodology indicators for kill zones, power of 3, optimal trade entries, and more.",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    items: [
      "Kill Zone Highlighter",
      "Power of 3 (Accumulation / Manipulation / Distribution)",
      "Optimal Trade Entry (OTE) Levels",
      "Daily / Weekly Profiles",
      "ICT Bias Indicator",
    ],
  },
  {
    id: "tradingview",
    label: "TradingView Indicators",
    icon: <Link2 className="w-5 h-5" />,
    description: "Curated public and private TradingView script links used by the OG Kaal community.",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    items: [
      "OG Kaal SMC Suite (Community Script)",
      "ICT Concepts Full Pack",
      "Session Killzones",
      "Multi-Timeframe Structure",
      "News Event Marker",
    ],
  },
  {
    id: "pine",
    label: "Pine Script Indicators",
    icon: <Code2 className="w-5 h-5" />,
    description: "Open-source Pine Script v5 indicators you can copy and customise directly on TradingView.",
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
    items: [
      "Custom OB + FVG Script",
      "Auto Fibonacci Levels",
      "Swing High / Low Detector",
      "NWOG / NDOG Marker",
      "Session Range Box",
    ],
  },
  {
    id: "explanations",
    label: "Indicator Explanations",
    icon: <BookOpen className="w-5 h-5" />,
    description: "In-depth guides explaining how each indicator works and how to use it in your trading plan.",
    color: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    items: [
      "How to Read Order Blocks",
      "Using FVGs for Entry Precision",
      "Understanding Liquidity Pools",
      "Kill Zones vs. Session Ranges",
      "Combining SMC + ICT Concepts",
    ],
  },
]

export default function IndicatorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FCD535]/10 border border-[#FCD535]/20 text-[#FCD535] text-xs font-semibold mb-4">
              <BarChart2 className="w-3.5 h-3.5" />
              SMC &amp; ICT Based
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-3">
              Trading Indicators
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto text-pretty">
              A curated library of Smart Money Concepts and ICT indicators, Pine Scripts, and TradingView tools used by the OG Kaal community.
            </p>
          </div>

          {/* Coming soon banner */}
          <div className="mb-10 rounded-xl border border-border bg-secondary/20 px-5 py-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FCD535] shrink-0 mt-1.5" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Content coming soon.</span>{" "}
              Indicator files, TradingView links, and detailed explanations will be added here. The sections below show what will be available.
            </p>
          </div>

          {/* Category cards */}
          <div className="space-y-6">
            {INDICATOR_CATEGORIES.map(cat => (
              <section
                key={cat.id}
                className={`rounded-2xl border ${cat.border} ${cat.bg} p-6`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-10 h-10 rounded-xl border ${cat.border} bg-background flex items-center justify-center shrink-0 ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${cat.color}`}>{cat.label}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{cat.description}</p>
                  </div>
                </div>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cat.items.map(item => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-background/60 border border-border/60 text-sm text-muted-foreground"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${cat.color}`} />
                      <span className="text-pretty">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
