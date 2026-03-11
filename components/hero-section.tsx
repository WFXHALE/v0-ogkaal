"use client"

import { TrendingUp } from "lucide-react"
import { useT } from "@/hooks/useT"

export function HeroSection() {
  const t = useT()
  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">{t.hero.badge}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
          OG <span className="text-primary">KAAL</span> TRADER
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed text-balance">
          {t.hero.subtitle1}{" "}
          <span className="text-foreground font-medium">Smart Money Concepts (SMC)</span>{" "}
          {t.language.label === "Language" ? "and" : "aur"}{" "}
          <span className="text-foreground font-medium">ICT trading models</span>.
        </p>

        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.hero.description}
        </p>
      </div>
    </section>
  )
}
