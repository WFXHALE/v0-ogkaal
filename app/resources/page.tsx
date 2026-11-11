"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookOpen, Layers, BarChart3, FileText, ArrowUpRight } from "lucide-react"

const resources = [
  {
    title: "SMC Guide",
    description: "Learn market structure, liquidity, order blocks and fair value gaps.",
    href: "/smc-guide",
    icon: Layers,
  },
  {
    title: "Learning Material",
    description: "Access structured SMC, ICT and price-action study material.",
    href: "/material",
    icon: BookOpen,
  },
  {
    title: "Trading Indicators",
    description: "Browse the available tools and indicators for chart analysis.",
    href: "/indicators",
    icon: BarChart3,
  },
  {
    title: "Articles & Insights",
    description: "Read trading education, psychology and risk-management articles.",
    href: "/blog",
    icon: FileText,
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">OG KAAL TRADER</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Trading Resources</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Guides, study material, indicators and articles — organised in one place.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-36 items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  {title}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted-foreground">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
