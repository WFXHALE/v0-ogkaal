import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrendingUp, Shield, Users, Award, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"

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

const blogPosts = [
  {
    slug: "why-retail-traders-lose",
    category: "Psychology",
    title: "Why 90% of Retail Traders Lose — And How to Be in the 10%",
    excerpt: "Most retail traders fail not because of bad strategies, but because they don't understand who they are trading against.",
    date: "March 5, 2025",
    readTime: "8 min",
  },
  {
    slug: "order-blocks-explained",
    category: "SMC",
    title: "Order Blocks Explained: Finding Where Institutions Buy and Sell",
    excerpt: "Order blocks are the most powerful entry tool in Smart Money Concepts. Learn how to identify valid order blocks with minimal risk.",
    date: "February 20, 2025",
    readTime: "10 min",
  },
  {
    slug: "funded-account-guide",
    category: "Funded Accounts",
    title: "How to Pass FTMO in 30 Days Using SMC Strategies",
    excerpt: "A step-by-step breakdown of the exact approach OG KAAL students use to pass FTMO with an 80%+ pass rate.",
    date: "January 28, 2025",
    readTime: "12 min",
  },
  {
    slug: "risk-management-rules",
    category: "Risk Management",
    title: "The 5 Risk Management Rules Every Profitable Trader Follows",
    excerpt: "Strategy is worthless without proper risk management. These five rules will protect your account.",
    date: "January 15, 2025",
    readTime: "6 min",
  },
  {
    slug: "liquidity-zones-guide",
    category: "SMC",
    title: "Liquidity Zones: The Key to Reading Institutional Price Action",
    excerpt: "Price doesn't move randomly — it's engineered to sweep liquidity before reversing. Master this concept to stop getting stop hunted.",
    date: "February 10, 2025",
    readTime: "7 min",
  },
  {
    slug: "gold-trading-smc",
    category: "Analysis",
    title: "Trading XAUUSD (Gold) with Smart Money Concepts",
    excerpt: "Gold is one of the most liquid and manipulated markets — making it perfect for SMC traders.",
    date: "January 3, 2025",
    readTime: "9 min",
  },
]

const categoryColors: Record<string, string> = {
  "SMC":             "bg-[#FCD535]/10 text-[#FCD535] border-[#FCD535]/30",
  "Psychology":      "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Funded Accounts": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Risk Management": "bg-green-500/10 text-green-400 border-green-500/30",
  "Analysis":        "bg-orange-500/10 text-orange-400 border-orange-500/30",
}

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

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-t border-border/60" />
        </div>

        {/* Blog section — anchored so /about#blog works */}
        <section id="blog" className="px-4 py-16 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#FCD535] uppercase tracking-widest mb-3">Blog</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-4">
              Trading Education
            </h2>
            <p className="text-muted-foreground text-pretty max-w-xl mx-auto leading-relaxed">
              Free articles on Smart Money Concepts, market psychology, risk management, and funded account strategies.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map(p => (
              <article
                key={p.slug}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-[#FCD535]/40 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryColors[p.category] ?? "bg-secondary text-muted-foreground border-border"}`}>
                    {p.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {p.readTime}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-[#FCD535] transition-colors text-balance">
                    {p.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{p.excerpt}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">{p.date}</span>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[#FCD535] hover:underline"
                  >
                    Read <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
