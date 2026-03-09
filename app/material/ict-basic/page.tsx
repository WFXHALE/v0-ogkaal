import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft, BookOpen } from "lucide-react"

const LESSONS = [
  { title: "Introduction to ICT Methodology", desc: "Who is ICT and what makes Inner Circle Trader's approach unique in retail trading education." },
  { title: "Price Delivery & IPDA", desc: "Understanding interbank price delivery algorithm and how price seeks liquidity algorithmically." },
  { title: "Killzones", desc: "London, New York, and Asian session killzones — the optimal windows for high-probability entries." },
  { title: "Fair Value Gaps (FVG)", desc: "Identifying imbalance candles, how price returns to fill gaps, and using them as entry triggers." },
  { title: "Order Blocks", desc: "Marking bullish and bearish order blocks and distinguishing them from ordinary consolidation." },
  { title: "Power of Three (PO3)", desc: "Accumulation, manipulation, and distribution — the three phases of daily price movement." },
]

export default function IctBasicPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/material" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Materials
          </Link>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">ICT Basic</h1>
              <p className="text-muted-foreground text-sm mt-1">Free introductory material on ICT methodology.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            Free Access — No sign-in required
          </div>
          <div className="space-y-3">
            {LESSONS.map((lesson, i) => (
              <div key={i} className="rounded-xl border border-border bg-card px-5 py-4">
                <p className="text-sm font-semibold text-foreground mb-1">{i + 1}. {lesson.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{lesson.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            Full video lessons and downloadable notes will be available here once uploaded by the instructor.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
