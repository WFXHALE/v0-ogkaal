import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft, BookOpen } from "lucide-react"

const LESSONS = [
  { title: "Reading Candlestick Charts", desc: "Understanding what each candle body, wick, and close tells you about buyer and seller strength." },
  { title: "Support & Resistance Levels", desc: "How to correctly identify and draw significant horizontal levels that price respects repeatedly." },
  { title: "Trend Lines & Channels", desc: "Drawing valid trend lines, identifying breakouts, and trading inside channels with confidence." },
  { title: "Chart Patterns (Basics)", desc: "Head and shoulders, double tops/bottoms, flags, and wedges — what they signal and how to trade them." },
  { title: "Pin Bars & Rejection Candles", desc: "Using strong rejection wicks to identify institutional pushback at key price levels." },
  { title: "Volume Basics", desc: "How volume confirms or weakens price moves and why ignoring it leads to false breakout trades." },
]

export default function PriceActionBasicPage() {
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
              <h1 className="text-3xl font-bold text-foreground">Price Action Basic</h1>
              <p className="text-muted-foreground text-sm mt-1">Free introductory material on Price Action trading.</p>
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

        </div>
      </main>
      <Footer />
    </div>
  )
}
