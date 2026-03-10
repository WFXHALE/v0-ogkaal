import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrendingUp, Shield, Users, Award } from "lucide-react"

export const metadata: Metadata = {
  title: "About OG KAAL TRADER | Smart Money Concepts Mentor",
  description:
    "Learn about OG KAAL TRADER — a professional forex and gold trader specializing in Smart Money Concepts (SMC) and ICT trading strategies. Join thousands of students mastering the markets.",
  openGraph: {
    title: "About OG KAAL TRADER",
    description: "Professional forex and gold trader. SMC & ICT specialist helping traders achieve consistent profitability.",
    type: "profile",
  },
}

const stats = [
  { value: "5+",   label: "Years Trading" },
  { value: "2K+",  label: "Students Mentored" },
  { value: "78%",  label: "Average Win Rate" },
  { value: "₹0",   label: "Hidden Fees" },
]

const values = [
  { icon: TrendingUp, title: "Consistency Over Luck",   body: "We focus on rule-based, high-probability setups using Smart Money Concepts — not gambling or random signals." },
  { icon: Shield,     title: "Transparency First",      body: "Every trade posted includes entry, stop loss, and take profit. No vague calls, no manipulation." },
  { icon: Users,      title: "Community Driven",        body: "Members grow together through shared analysis, live sessions, and open discussions in our private group." },
  { icon: Award,      title: "Proven Track Record",     body: "Monthly performance stats are published publicly so you can verify results before joining." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-20 text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-[#FCD535] uppercase tracking-widest mb-3">About</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance leading-tight mb-5">
            OG KAAL TRADER
          </h1>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            A professional forex and gold trader with over 5 years of market experience — specializing in Smart Money Concepts (SMC), ICT strategies, and funded account challenges. The mission is simple: help ordinary people trade like institutions.
          </p>
        </section>

        {/* Stats */}
        <section className="px-4 py-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-5 text-center">
                <p className="text-3xl font-bold text-[#FCD535]">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="px-4 py-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-5">The Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              OG KAAL TRADER started trading in 2019 after losing money through retail indicators and false signals. After years of studying Smart Money Concepts and ICT methodology, a consistent edge was developed — one based on understanding where banks and institutions place their orders.
            </p>
            <p>
              In 2022, the FX KAAL community was launched to share this knowledge with aspiring traders. Since then, over 2,000 students have gone through the mentorship program, many achieving consistent profitability and passing funded account challenges with firms like FTMO and MyForexFunds.
            </p>
            <p>
              The platform operates with zero tolerance for false promises. Every signal, every lesson, every result is documented and verifiable.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="px-4 py-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(v => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FCD535]/10 flex items-center justify-center shrink-0">
                  <v.icon className="w-5 h-5 text-[#FCD535]" />
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">{v.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
