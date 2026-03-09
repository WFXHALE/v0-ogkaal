"use client"

import { AdvancedMaterialPage } from "@/components/advanced-material-page"
import { ADVANCED_MATERIALS } from "@/lib/material-store"
import { BookOpen } from "lucide-react"

const meta = ADVANCED_MATERIALS.find((m) => m.id === "smc-advanced")!

const preview = (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">What you will learn</p>
    {[
      { title: "Institutional Order Flow", desc: "How banks and hedge funds place orders and how their footprints appear on charts." },
      { title: "Advanced Liquidity Raids", desc: "Engineering liquidity runs, turtle soup entries, and hunting retail stop losses." },
      { title: "Optimal Trade Entry (OTE)", desc: "Fibonacci-based entry models used by institutions for high risk-reward setups." },
      { title: "Multi-Timeframe SMC Analysis", desc: "Aligning higher timeframe bias with lower timeframe entries for precision." },
      { title: "Premium & Discount Arrays", desc: "Buying in discount and selling in premium — the foundation of SMC trade management." },
      { title: "Live Trade Breakdowns", desc: "Real trade examples with full entry, stop, target, and post-trade analysis." },
    ].map((lesson, i) => (
      <div key={i} className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-sm font-semibold text-foreground mb-1">{i + 1}. {lesson.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{lesson.desc}</p>
      </div>
    ))}
  </div>
)

export default function SmcAdvancedPage() {
  return <AdvancedMaterialPage meta={meta} previewContent={preview} />
}
