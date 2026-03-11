"use client"

import { GraduationCap, Users, LineChart, Calculator, TrendingUp, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useT } from "@/hooks/useT"

export function NavigationCardsSection() {
  const t = useT()

  const navigationCards = [
    {
      title: t.cards.mentorshipTitle,
      description: t.cards.mentorshipDesc,
      icon: GraduationCap,
      href: "/mentorship",
      color: "from-amber-500/20 to-yellow-500/20",
    },
    {
      title: t.cards.vipGroupTitle,
      description: t.cards.vipGroupDesc,
      icon: Users,
      href: "/vip-group",
      color: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: t.cards.tradeTitle,
      description: t.cards.tradeDesc,
      icon: LineChart,
      href: "/trade-dashboard",
      color: "from-green-500/20 to-emerald-500/20",
    },
    {
      title: t.cards.fundedTitle,
      description: t.cards.fundedDesc,
      icon: Calculator,
      href: "/funded-tools",
      color: "from-purple-500/20 to-violet-500/20",
    },
    {
      title: t.cards.marketTitle,
      description: t.cards.marketDesc,
      icon: TrendingUp,
      href: "#market-overview",
      color: "from-red-500/20 to-orange-500/20",
    },
    {
      title: t.cards.booksTitle,
      description: t.cards.booksDesc,
      icon: BookOpen,
      href: "#books",
      color: "from-teal-500/20 to-cyan-500/20",
    },
  ]

  return (
    <section className="py-16 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t.cards.sectionTitle.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-primary">{t.cards.sectionTitle.split(" ").slice(-1)[0]}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.cards.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {navigationCards.map((card) => (
            <Link key={card.href} href={card.href} className="group">
              <div className="h-full p-4 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h3 className="text-sm sm:text-xl font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-base text-muted-foreground mb-3 sm:mb-4 hidden sm:block">
                  {card.description}
                </p>
                <Button variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent group-hover:translate-x-1 transition-transform text-xs sm:text-sm">
                  {t.cards.exploreButton}
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
