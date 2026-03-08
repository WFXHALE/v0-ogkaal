import { Check } from "lucide-react"

const topics = [
  "Market Structure",
  "Liquidity Concepts",
  "Break of Structure and CHOCH",
  "Fair Value Gaps",
  "Order Blocks",
  "Entry Models",
  "Risk Management",
  "Trade Psychology",
  "Institutional Market Logic",
]

export function WhatYouLearnSection() {
  return (
    <section className="py-16 px-4 bg-card/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What You Will <span className="text-primary">Learn</span>
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground font-medium">{topic}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
