"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BarChart2, Search, ExternalLink, Layers, Zap, Droplets, Clock, Wrench, TrendingUp, X } from "lucide-react"
import { INDICATORS, type Indicator, type IndicatorCategory } from "@/lib/indicators-data"

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORIES: {
  id: IndicatorCategory | "all"
  label: string
  icon: typeof BarChart2
  color: string
  border: string
  bg: string
}[] = [
  { id: "all",          label: "All",          icon: BarChart2,  color: "text-foreground",    border: "border-border",          bg: "bg-secondary/30"  },
  { id: "SMC",          label: "SMC",          icon: Layers,     color: "text-[#FCD535]",     border: "border-[#FCD535]/25",    bg: "bg-[#FCD535]/8"   },
  { id: "ICT",          label: "ICT",          icon: Zap,        color: "text-sky-400",       border: "border-sky-500/25",      bg: "bg-sky-500/8"     },
  { id: "Liquidity",    label: "Liquidity",    icon: Droplets,   color: "text-emerald-400",   border: "border-emerald-500/25",  bg: "bg-emerald-500/8" },
  { id: "Sessions",     label: "Sessions",     icon: Clock,      color: "text-orange-400",    border: "border-orange-500/25",   bg: "bg-orange-500/8"  },
  { id: "Price Action", label: "Price Action", icon: TrendingUp, color: "text-rose-400",      border: "border-rose-500/25",     bg: "bg-rose-500/8"    },
  { id: "Tools",        label: "Tools",        icon: Wrench,     color: "text-purple-400",    border: "border-purple-500/25",   bg: "bg-purple-500/8"  },
]

function catConfig(category: IndicatorCategory) {
  return CATEGORIES.find(c => c.id === category) ?? CATEGORIES[0]
}

// ── Indicator card ─────────────────────────────────────────────────────────────

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const cfg = catConfig(indicator.category)
  const Icon = cfg.icon

  return (
    <article className={`flex flex-col rounded-2xl border ${cfg.border} bg-card transition-shadow hover:shadow-md hover:shadow-black/10`}>
      {/* Coloured icon header */}
      <div className={`h-20 ${cfg.bg} flex items-center justify-center border-b ${cfg.border} rounded-t-2xl`}>
        <Icon className={`w-8 h-8 ${cfg.color} opacity-50`} />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 gap-3 p-4">
        {/* Category badge */}
        <span className={`self-start inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.border} ${cfg.color} ${cfg.bg}`}>
          <Icon className="w-3 h-3" />
          {indicator.category}
        </span>

        {/* Name */}
        <h2 className="font-bold text-foreground text-sm leading-snug">{indicator.name}</h2>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{indicator.description}</p>

        {/* CTA */}
        <a
          href={indicator.tradingview_link}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border ${cfg.border} ${cfg.bg} ${cfg.color} text-xs font-semibold hover:opacity-80 active:scale-[.98] transition-all`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Get Indicator
        </a>
      </div>
    </article>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function IndicatorsPage() {
  const [search,    setSearch]    = useState("")
  const [activecat, setActivecat] = useState<IndicatorCategory | "all">("all")

  const filtered = useMemo(() => {
    let items = INDICATORS
    if (activecat !== "all") items = items.filter(i => i.category === activecat)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      )
    }
    return items
  }, [activecat, search])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="mb-10 text-center">
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

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 items-start">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search indicators..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const active = activecat === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActivecat(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      active
                        ? `${cat.border} ${cat.bg} ${cat.color} shadow-sm`
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground mb-5">
            {filtered.length} indicator{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-foreground font-semibold text-sm mb-1">No results found.</p>
              <p className="text-muted-foreground text-xs mb-4">Try a different search term or category.</p>
              <button onClick={() => { setSearch(""); setActivecat("all") }} className="text-xs text-primary hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(ind => (
                <IndicatorCard key={ind.id} indicator={ind} />
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
