import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Building2, Target, Shield, Clock, TrendingUp, Zap, CalendarDays, Bot, ChevronRight, AlertCircle } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
interface PropFirmRule {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}

interface PropFirm {
  id: string
  name: string
  tier: "popular" | "standard"
  tagline: string
  rules: PropFirmRule[]
}

// ── Placeholder data — real data will be added later ─────────────────────────
const PROP_FIRMS: PropFirm[] = [
  {
    id: "ftmo",
    name: "FTMO",
    tier: "popular",
    tagline: "One of the most established evaluation-based prop firms.",
    rules: [
      { icon: <Target className="w-4 h-4" />,      label: "Profit Target",        value: "Phase 1: 10% / Phase 2: 5%", highlight: true },
      { icon: <Shield className="w-4 h-4" />,       label: "Daily Drawdown",       value: "5% of initial balance" },
      { icon: <TrendingUp className="w-4 h-4" />,   label: "Max Drawdown",         value: "10% of initial balance" },
      { icon: <Clock className="w-4 h-4" />,        label: "Min Trading Days",     value: "4 calendar days" },
      { icon: <Zap className="w-4 h-4" />,          label: "News Trading",         value: "Allowed" },
      { icon: <Bot className="w-4 h-4" />,          label: "EA / Bots",            value: "Allowed (no HFT)" },
      { icon: <CalendarDays className="w-4 h-4" />, label: "Weekend Holding",      value: "Allowed" },
    ],
  },
  {
    id: "mff",
    name: "My Forex Funds",
    tier: "popular",
    tagline: "Rapid account funding with a straightforward challenge process.",
    rules: [
      { icon: <Target className="w-4 h-4" />,      label: "Profit Target",        value: "Phase 1: 8% / Phase 2: 5%", highlight: true },
      { icon: <Shield className="w-4 h-4" />,       label: "Daily Drawdown",       value: "5% of balance" },
      { icon: <TrendingUp className="w-4 h-4" />,   label: "Max Drawdown",         value: "12% of balance" },
      { icon: <Clock className="w-4 h-4" />,        label: "Min Trading Days",     value: "5 trading days" },
      { icon: <Zap className="w-4 h-4" />,          label: "News Trading",         value: "Restricted 2 min around events" },
      { icon: <Bot className="w-4 h-4" />,          label: "EA / Bots",            value: "Allowed" },
      { icon: <CalendarDays className="w-4 h-4" />, label: "Weekend Holding",      value: "Not allowed" },
    ],
  },
  {
    id: "the5ers",
    name: "The 5%ers",
    tier: "standard",
    tagline: "Growth-based model with no time pressure on challenges.",
    rules: [
      { icon: <Target className="w-4 h-4" />,      label: "Profit Target",        value: "6% to scale up", highlight: true },
      { icon: <Shield className="w-4 h-4" />,       label: "Daily Drawdown",       value: "4% of balance" },
      { icon: <TrendingUp className="w-4 h-4" />,   label: "Max Drawdown",         value: "6% of balance" },
      { icon: <Clock className="w-4 h-4" />,        label: "Min Trading Days",     value: "No minimum" },
      { icon: <Zap className="w-4 h-4" />,          label: "News Trading",         value: "Allowed (depends on plan)" },
      { icon: <Bot className="w-4 h-4" />,          label: "EA / Bots",            value: "Allowed" },
      { icon: <CalendarDays className="w-4 h-4" />, label: "Weekend Holding",      value: "Allowed" },
    ],
  },
  {
    id: "e8funding",
    name: "E8 Funding",
    tier: "standard",
    tagline: "Flexible evaluation with daily drawdown measured from account high.",
    rules: [
      { icon: <Target className="w-4 h-4" />,      label: "Profit Target",        value: "Phase 1: 8% / Phase 2: 5%", highlight: true },
      { icon: <Shield className="w-4 h-4" />,       label: "Daily Drawdown",       value: "5% from daily high" },
      { icon: <TrendingUp className="w-4 h-4" />,   label: "Max Drawdown",         value: "8% from account high" },
      { icon: <Clock className="w-4 h-4" />,        label: "Min Trading Days",     value: "8 trading days" },
      { icon: <Zap className="w-4 h-4" />,          label: "News Trading",         value: "Restricted" },
      { icon: <Bot className="w-4 h-4" />,          label: "EA / Bots",            value: "Allowed" },
      { icon: <CalendarDays className="w-4 h-4" />, label: "Weekend Holding",      value: "Allowed" },
    ],
  },
]

// ── Rule badge helpers ────────────────────────────────────────────────────────
const RULE_ICONS = {
  allowed:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  restricted:  "bg-red-500/10 text-red-400 border-red-500/20",
  conditional: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  neutral:     "bg-secondary/60 text-muted-foreground border-border/60",
}

function ruleValueColor(value: string): string {
  const lower = value.toLowerCase()
  if (lower === "allowed") return RULE_ICONS.allowed
  if (lower.includes("not allowed") || lower.includes("restricted")) return RULE_ICONS.restricted
  if (lower.includes("depends") || lower.includes("around")) return RULE_ICONS.conditional
  return RULE_ICONS.neutral
}

// ── Firm card ─────────────────────────────────────────────────────────────────
function FirmCard({ firm }: { firm: PropFirm }) {
  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FCD535]/10 border border-[#FCD535]/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#FCD535]" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">{firm.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{firm.tagline}</p>
          </div>
        </div>
        {firm.tier === "popular" && (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FCD535]/10 text-[#FCD535] border border-[#FCD535]/20">
            Popular
          </span>
        )}
      </div>

      {/* Rules grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {firm.rules.map(rule => (
          <div
            key={rule.label}
            className={`flex items-start gap-2.5 p-3 rounded-xl border ${rule.highlight ? "bg-[#FCD535]/5 border-[#FCD535]/20" : "bg-secondary/20 border-border/60"}`}
          >
            <span className={`shrink-0 mt-0.5 ${rule.highlight ? "text-[#FCD535]" : "text-muted-foreground"}`}>
              {rule.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-none mb-1">{rule.label}</p>
              <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${ruleValueColor(rule.value)}`}>
                {rule.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA placeholder */}
      <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Full rules &amp; review coming soon</span>
        <div className="flex items-center gap-1 text-xs text-[#FCD535]/60 font-medium">
          View full details <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </article>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PropFirmsPage() {
  const popular  = PROP_FIRMS.filter(f => f.tier === "popular")
  const standard = PROP_FIRMS.filter(f => f.tier === "standard")

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FCD535]/10 border border-[#FCD535]/20 text-[#FCD535] text-xs font-semibold mb-4">
              <Building2 className="w-3.5 h-3.5" />
              Compare &amp; Choose
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-3">
              Prop Firms
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto text-pretty">
              Compare rules across the most popular proprietary trading firms — profit targets, drawdown limits, trading day requirements, and more.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-10 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Placeholder data only.</span>{" "}
              All rules shown below are approximate and will be updated with verified, up-to-date information. Always check the official firm website before purchasing a challenge.
            </p>
          </div>

          {/* Rule key */}
          <div className="mb-8 flex items-center flex-wrap gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">Key:</span>
            {[
              { label: "Allowed",     style: RULE_ICONS.allowed },
              { label: "Restricted",  style: RULE_ICONS.restricted },
              { label: "Conditional", style: RULE_ICONS.conditional },
            ].map(k => (
              <span key={k.label} className={`inline-flex px-2.5 py-0.5 rounded border text-xs font-medium ${k.style}`}>{k.label}</span>
            ))}
          </div>

          {/* Popular firms */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              Popular Firms
              <span className="text-xs font-normal text-muted-foreground">({popular.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {popular.map(f => <FirmCard key={f.id} firm={f} />)}
            </div>
          </section>

          {/* Other firms */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              More Firms
              <span className="text-xs font-normal text-muted-foreground">({standard.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {standard.map(f => <FirmCard key={f.id} firm={f} />)}
            </div>
          </section>

          {/* Add more CTA */}
          <div className="mt-10 rounded-2xl border border-border border-dashed bg-secondary/10 px-6 py-8 text-center">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">More firms being added</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              FTMO, MFF, The 5%ers, E8, Funded Next, TopStep, Fidelcrest and more will be listed here with full rule breakdowns and OG Kaal reviews.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
