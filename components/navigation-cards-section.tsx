import { GraduationCap, Users, LineChart, Calculator, TrendingUp, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const navigationCards = [
  {
    title: "Mentorship",
    description: "Learn SMC & ICT strategies",
    icon: GraduationCap,
    href: "/mentorship",
    color: "from-amber-500/20 to-yellow-500/20",
  },
  {
    title: "VIP Group",
    description: "Join the trading signals community",
    icon: Users,
    href: "/vip-group",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Trade Dashboard",
    description: "Monitor trades and performance",
    icon: LineChart,
    href: "/trade-dashboard",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    title: "Funded Tools",
    description: "Calculators and risk management",
    icon: Calculator,
    href: "/funded-tools",
    color: "from-purple-500/20 to-violet-500/20",
  },
  {
    title: "Market Overview",
    description: "Live prices and charts",
    icon: TrendingUp,
    href: "#market-overview",
    color: "from-red-500/20 to-orange-500/20",
  },
  {
    title: "Books",
    description: "Trading resources and guides",
    icon: BookOpen,
    href: "#books",
    color: "from-teal-500/20 to-cyan-500/20",
  },
]

export function NavigationCardsSection() {
  return (
    <section className="py-16 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Explore <span className="text-primary">Platform</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Navigate to different sections and tools available on the platform
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <Link key={card.title} href={card.href} className="group">
              <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {card.description}
                </p>
                <Button variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent group-hover:translate-x-1 transition-transform">
                  Explore
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
