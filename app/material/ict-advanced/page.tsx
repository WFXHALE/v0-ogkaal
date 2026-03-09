"use client"

import { AdvancedMaterialPage } from "@/components/advanced-material-page"
import { ADVANCED_MATERIALS } from "@/lib/material-store"

const meta = ADVANCED_MATERIALS.find((m) => m.id === "ict-advanced")!

const preview = (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">What you will learn</p>
    {[
      { title: "Advanced PD Arrays", desc: "Breaker blocks, mitigation blocks, rejection blocks, and void blocks — ranked by reliability." },
      { title: "ICT Macro & Time Theory", desc: "Micro time windows within killzones and how to use the clock to predict price reversals." },
      { title: "Judas Swing", desc: "Identifying the false move that precedes the true directional delivery of price." },
      { title: "Silver Bullet Strategy", desc: "The 3-4 AM, 10-11 AM, and 2-3 PM New York setups — step by step execution." },
      { title: "AMD Cycle Mastery", desc: "Advanced accumulation, manipulation, and distribution applied across weekly profiles." },
      { title: "Quarterly Theory", desc: "How to read price delivery across monthly, weekly, and daily timeframes using ICT seasonality." },
    ].map((lesson, i) => (
      <div key={i} className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-sm font-semibold text-foreground mb-1">{i + 1}. {lesson.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{lesson.desc}</p>
      </div>
    ))}
  </div>
)

export default function IctAdvancedPage() {
  return <AdvancedMaterialPage meta={meta} previewContent={preview} />
}
