import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Trading Blog | OG KAAL TRADER — SMC, ICT & Forex Insights",
  description:
    "Free trading education articles covering Smart Money Concepts, ICT methodology, forex market analysis, funded account tips, and risk management from OG KAAL TRADER.",
  keywords: "forex blog, SMC trading blog, ICT methodology, trading education, funded accounts",
  openGraph: {
    title: "Trading Blog — OG KAAL TRADER",
    description: "Free articles on SMC, ICT, forex trading, and funded account strategies.",
    type: "website",
  },
}

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

const categoryColors: Record<string, string> = {
  "SMC":              "bg-[#FCD535]/10 text-[#FCD535] border-[#FCD535]/30",
  "Psychology":       "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Funded Accounts":  "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Risk Management":  "bg-green-500/10 text-green-400 border-green-500/30",
  "Analysis":         "bg-orange-500/10 text-orange-400 border-orange-500/30",
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-16 text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-[#FCD535] uppercase tracking-widest mb-3">Blog</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance leading-tight mb-5">
            Trading Education
          </h1>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            Free articles on Smart Money Concepts, market psychology, risk management, and funded account strategies.
          </p>
        </section>

        {/* Posts grid */}
        <section className="px-4 pb-20 max-w-5xl mx-auto">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(p => (
              <article key={p.slug} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-[#FCD535]/30 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryColors[p.category] ?? "bg-secondary text-muted-foreground border-border"}`}>
                    {p.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{p.readTime}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-[#FCD535] transition-colors text-balance">
                    {p.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{p.excerpt}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{p.date}</span>
                  <Link href={`/blog/${p.slug}`} className="text-xs font-semibold text-[#FCD535] hover:underline">
                    Read more
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* SMC Guide CTA */}
          <div className="mt-12 rounded-2xl border border-border bg-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-bold text-foreground text-lg mb-1">Want a structured guide?</p>
              <p className="text-sm text-muted-foreground">Read our complete SMC Trading Guide — from basics to advanced entry models.</p>
            </div>
            <Link href="/smc-guide" className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-xl bg-[#FCD535] text-black font-bold text-sm hover:bg-[#FCD535]/90 transition-colors whitespace-nowrap">
              Read SMC Guide
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
