"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Building2, ChevronDown, ChevronUp, Check, X,
  AlertCircle, Search, Filter,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountModel = {
  profitTarget: string | null   // null = not available
  dailyDrawdown: string
  maxDrawdown: string
}

type PropFirmData = {
  id: string
  name: string
  website: string
  accountSizes: string[]
  profitSplit: string
  payoutFrequency: string
  drawdownType: "Static" | "Trailing" | "Both"
  consistencyRule: boolean
  weekendHolding: boolean
  overnightHolding: boolean
  twoStep: AccountModel | null
  oneStep: AccountModel | null
  instantFunding: AccountModel | null
}

// ── Data (sourced from PropFirmMatch & official firm websites) ─────────────────

const FIRMS: PropFirmData[] = [
  {
    id: "ftmo",
    name: "FTMO",
    website: "https://ftmo.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand (14 day min)",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: null,
    instantFunding: null,
  },
  {
    id: "the5ers",
    name: "The 5%ers",
    website: "https://the5ers.com",
    accountSizes: ["$5K", "$10K", "$20K", "$40K", "$80K", "$160K"],
    profitSplit: "Up to 100%",
    payoutFrequency: "Monthly",
    drawdownType: "Trailing",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "4%", maxDrawdown: "6%" },
    oneStep: { profitTarget: "6%", dailyDrawdown: "4%", maxDrawdown: "6%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "3%", maxDrawdown: "5%" },
  },
  {
    id: "e8markets",
    name: "E8 Markets",
    website: "https://e8markets.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K", "$400K"],
    profitSplit: "Up to 80%",
    payoutFrequency: "On demand",
    drawdownType: "Trailing",
    consistencyRule: true,
    weekendHolding: false,
    overnightHolding: false,
    twoStep: null,
    oneStep: { profitTarget: "8%", dailyDrawdown: "5%", maxDrawdown: "8%" },
    instantFunding: null,
  },
  {
    id: "fundingpips",
    name: "FundingPips",
    website: "https://fundingpips.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: null,
  },
  {
    id: "brightfunded",
    name: "BrightFunded",
    website: "https://brightfunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 100%",
    payoutFrequency: "14 days (1st: 30 days)",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: null,
    instantFunding: null,
  },
  {
    id: "alphacapital",
    name: "Alpha Capital",
    website: "https://alphacapitalgroup.uk",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "5%", maxDrawdown: "10%" },
  },
  {
    id: "fundednext",
    name: "FundedNext",
    website: "https://fundednext.com",
    accountSizes: ["$6K", "$15K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 95%",
    payoutFrequency: "On demand (after 5 days)",
    drawdownType: "Trailing",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "3%", maxDrawdown: "5%" },
  },
  {
    id: "goatfunded",
    name: "Goat Funded Trader",
    website: "https://goatfundedtrader.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "5%", maxDrawdown: "10%" },
  },
  {
    id: "blueberryfunded",
    name: "Blueberry Funded",
    website: "https://blueberryfunded.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Monthly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 5%", dailyDrawdown: "4%", maxDrawdown: "8%" },
    oneStep: null,
    instantFunding: null,
  },
  {
    id: "maventrading",
    name: "Maven Trading",
    website: "https://maventrading.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 80%",
    payoutFrequency: "Monthly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: null,
    instantFunding: null,
  },
  {
    id: "aquafunded",
    name: "Aqua Funded",
    website: "https://aquafunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: null,
  },
  {
    id: "toptiertrader",
    name: "TopTier Trader",
    website: "https://toptiertrader.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Trailing",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: null,
  },
  {
    id: "finotive",
    name: "Finotive Funding",
    website: "https://finotivefunding.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Monthly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 5%", dailyDrawdown: "4%", maxDrawdown: "8%" },
    oneStep: { profitTarget: "8%", dailyDrawdown: "4%", maxDrawdown: "8%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "4%", maxDrawdown: "8%" },
  },
  {
    id: "fortraders",
    name: "For Traders",
    website: "https://fortraders.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: null,
    instantFunding: null,
  },
  {
    id: "breakout",
    name: "Breakout",
    website: "https://breakout.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 4%", dailyDrawdown: "4%", maxDrawdown: "8%" },
    oneStep: { profitTarget: "8%", dailyDrawdown: "4%", maxDrawdown: "8%" },
    instantFunding: null,
  },
  {
    id: "fundedelite",
    name: "Funded Elite",
    website: "https://fundedelite.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: null,
  },
  {
    id: "blueguardian",
    name: "Blue Guardian",
    website: "https://blueguardian.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 85%",
    payoutFrequency: "14 days",
    drawdownType: "Trailing",
    consistencyRule: true,
    weekendHolding: false,
    overnightHolding: true,
    twoStep: { profitTarget: "8% / 5%", dailyDrawdown: "5%", maxDrawdown: "8%" },
    oneStep: { profitTarget: "8%", dailyDrawdown: "5%", maxDrawdown: "8%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "5%", maxDrawdown: "8%" },
  },
  {
    id: "instantfunding",
    name: "Instant Funding",
    website: "https://instantfunding.io",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand",
    drawdownType: "Static",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: null,
    oneStep: null,
    instantFunding: { profitTarget: null, dailyDrawdown: "5%", maxDrawdown: "10%" },
  },
  {
    id: "fxify",
    name: "FXIFY",
    website: "https://fxify.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand (after 14 days)",
    drawdownType: "Trailing",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% / 5%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "5%", maxDrawdown: "10%" },
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

const YesNo = ({ value, size = "sm" }: { value: boolean; size?: "sm" | "xs" }) => (
  value
    ? <span className={`inline-flex items-center gap-1 font-semibold text-emerald-400 ${size === "xs" ? "text-[11px]" : "text-xs"}`}>
        <Check className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.5} /> Yes
      </span>
    : <span className={`inline-flex items-center gap-1 font-semibold text-red-400 ${size === "xs" ? "text-[11px]" : "text-xs"}`}>
        <X className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.5} /> No
      </span>
)

const NA = () => (
  <span className="inline-flex items-center gap-1 text-red-400">
    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
    <span className="text-[11px] font-medium">N/A</span>
  </span>
)

const DrawdownTypeBadge = ({ type }: { type: "Static" | "Trailing" | "Both" }) => {
  const map = {
    Static:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
    Trailing: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    Both:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-semibold ${map[type]}`}>{type}</span>
  )
}

function AccountModelBlock({ label, model }: { label: string; model: AccountModel | null }) {
  const accent = label === "Two Step" ? "border-primary/30 bg-primary/5"
    : label === "One Step" ? "border-sky-500/30 bg-sky-500/5"
    : "border-emerald-500/30 bg-emerald-500/5"
  const textAccent = label === "Two Step" ? "text-primary"
    : label === "One Step" ? "text-sky-400"
    : "text-emerald-400"

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${model ? accent : "border-border/40 bg-secondary/10 opacity-50"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${model ? textAccent : "text-muted-foreground"}`}>{label}</p>
      {model === null ? (
        <NA />
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Profit Target</span>
            {model.profitTarget
              ? <span className="text-[11px] font-semibold text-foreground">{model.profitTarget}</span>
              : <NA />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Daily DD</span>
            <span className="text-[11px] font-semibold text-foreground">{model.dailyDrawdown}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Max DD</span>
            <span className="text-[11px] font-semibold text-foreground">{model.maxDrawdown}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function FirmCard({ firm }: { firm: PropFirmData }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md hover:shadow-black/10">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm leading-tight">{firm.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{firm.profitSplit} split · {firm.payoutFrequency}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DrawdownTypeBadge type={firm.drawdownType} />
          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-border/60 px-5 py-4 space-y-5">

          {/* Account models row */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Account Models</p>
            <div className="grid grid-cols-3 gap-2">
              <AccountModelBlock label="Two Step"       model={firm.twoStep} />
              <AccountModelBlock label="One Step"       model={firm.oneStep} />
              <AccountModelBlock label="Instant Funding" model={firm.instantFunding} />
            </div>
          </div>

          {/* Rules row */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Rules</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Drawdown Type</span>
                <DrawdownTypeBadge type={firm.drawdownType} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Consistency Rule</span>
                <YesNo value={firm.consistencyRule} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Weekend Holding</span>
                <YesNo value={firm.weekendHolding} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overnight Holding</span>
                <YesNo value={firm.overnightHolding} />
              </div>
            </div>
          </div>

          {/* Account sizes + profit split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Account Sizes</p>
              <div className="flex flex-wrap gap-1.5">
                {firm.accountSizes.map(s => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-lg bg-secondary/50 border border-border/60 font-mono text-foreground">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Profit Split</p>
              <span className="text-sm font-bold text-primary">{firm.profitSplit}</span>
              <p className="text-[10px] text-muted-foreground mt-1">Payout: {firm.payoutFrequency}</p>
            </div>
          </div>

          {/* Website link */}
          <a
            href={firm.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
          >
            Visit official website →
          </a>

        </div>
      )}
    </article>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PropFirmsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "two-step" | "one-step" | "instant">("all")

  const filtered = FIRMS.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === "all" ? true
      : filter === "two-step"  ? f.twoStep !== null
      : filter === "one-step"  ? f.oneStep !== null
      : f.instantFunding !== null
    return matchSearch && matchFilter
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
              <Building2 className="w-3.5 h-3.5" />
              {FIRMS.length} Firms Listed
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-3">
              Prop Firms Comparison
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto text-pretty">
              Compare profit targets, drawdown rules, account models, and payout structures across {FIRMS.length} leading prop firms — all in one place.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3.5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Data is sourced from public firm websites and{" "}
              <a href="https://propfirmmatch.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-foreground hover:text-primary transition-colors">PropFirmMatch</a>.
              {" "}Rules change frequently — always verify on the firm{"'"}s official website before purchasing a challenge.
            </p>
          </div>

          {/* Search + filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search firms..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border">
              <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
              {(["all", "two-step", "one-step", "instant"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "all" ? "All" : f === "two-step" ? "2-Step" : f === "one-step" ? "1-Step" : "Instant"}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Account models:</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold">Two Step</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-sky-500/30 bg-sky-500/5 text-sky-400 font-semibold">One Step</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-semibold">Instant Funding</span>
            <DrawdownTypeBadge type="Static" />
            <DrawdownTypeBadge type="Trailing" />
          </div>

          {/* Firm list */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-sm">No firms match your search.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(f => <FirmCard key={f.id} firm={f} />)}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
