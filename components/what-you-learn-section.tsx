"use client"

import { Check } from "lucide-react"
import { useT } from "@/hooks/useT"

export function WhatYouLearnSection() {
  const t = useT()

  const topics = [
    t.learn.topics.marketStructure,
    t.learn.topics.liquidity,
    t.learn.topics.bos,
    t.learn.topics.fvg,
    t.learn.topics.orderBlocks,
    t.learn.topics.entryModels,
    t.learn.topics.riskManagement,
    t.learn.topics.psychology,
    t.learn.topics.institutional,
  ]

  return (
    <section className="py-16 px-4 bg-card/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t.learn.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-primary">{t.learn.title.split(" ").slice(-1)[0]}</span>
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
