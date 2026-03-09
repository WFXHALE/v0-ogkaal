import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft, BookOpen } from "lucide-react"

const LESSONS = [
  { title: "What is Smart Money?", desc: "Understanding institutional traders and how they move markets differently from retail." },
  { title: "Market Structure Basics", desc: "Identifying swing highs, swing lows, and how structure defines trend direction." },
  { title: "Supply & Demand Zones", desc: "How to mark fresh supply and demand zones and why they act as key price levels." },
  { title: "Break of Structure (BOS)", desc: "Recognising a genuine break of structure and its role in confirming trend continuation." },
  { title: "Change of Character (CHoCH)", desc: "Identifying early reversal signals before the trend fully shifts direction." },
  { title: "Liquidity Concepts", desc: "Understanding buy-side and sell-side liquidity, equal highs/lows, and stop hunts." },
]

export default function SmcBasicPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">

          <Link
            href="/material"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Materials
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">SMC Basic</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Free introductory material on Smart Money Concepts.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            Free Access — No sign-in required
          </div>

          <div className="space-y-3">
            {LESSONS.map((lesson, i) => (
              <div key={i} className="rounded-xl border border-border bg-card px-5 py-4">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {i + 1}. {lesson.title}
                </p>
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
