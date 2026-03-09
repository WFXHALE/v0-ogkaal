"use client"

import { AdvancedMaterialPage } from "@/components/advanced-material-page"
import { ADVANCED_MATERIALS } from "@/lib/material-store"

const meta = ADVANCED_MATERIALS.find((m) => m.id === "price-action-advanced")!

const preview = (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">What you will learn</p>
    {[
      { title: "Multi-Timeframe Confluence", desc: "Stacking HTF structure, mid-range zones, and LTF entry signals for maximum edge." },
      { title: "Advanced Supply & Demand", desc: "Identifying fresh, tested, and broken zones — and how to filter out weak levels." },
      { title: "Wyckoff Method Integration", desc: "Combining Wyckoff accumulation and distribution schematics with modern price action." },
      { title: "Stop Hunt Engineering", desc: "Anticipating liquidity grabs above highs and below lows before real moves begin." },
      { title: "High Probability Reversal Setups", desc: "Double top/bottom refinement, failed breakouts, and compression breakouts with targets." },
      { title: "Risk Management Mastery", desc: "Position sizing, R:R optimization, scaling in/out, and protecting capital under drawdown." },
    ].map((lesson, i) => (
      <div key={i} className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-sm font-semibold text-foreground mb-1">{i + 1}. {lesson.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{lesson.desc}</p>
      </div>
    ))}
  </div>
)

export default function PriceActionAdvancedPage() {
  return <AdvancedMaterialPage meta={meta} previewContent={preview} />
}
