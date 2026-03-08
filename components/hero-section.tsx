import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-primary font-medium">SMC & ICT Trading Mentor</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
          OG <span className="text-primary">KAAL</span> TRADER
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed text-balance">
          Professional trading mentor specializing in <span className="text-foreground font-medium">Smart Money Concepts (SMC)</span> and 
          <span className="text-foreground font-medium"> ICT trading strategies</span>. 
          Join our live mentorship programs designed for beginner and advanced traders to transform their trading journey.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/mentorship">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12">
              Start Mentorship
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/vip-group">
            <Button size="lg" variant="outline" className="border-border hover:bg-secondary font-semibold px-8 h-12">
              <Play className="w-5 h-5 mr-2" />
              Join VIP Group
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12 pt-8 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">11,000+</p>
            <p className="text-sm text-muted-foreground">Pips Captured (Q4 2025)</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">100+</p>
            <p className="text-sm text-muted-foreground">Traders Trained</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">Live</p>
            <p className="text-sm text-muted-foreground">VIP Signals Group</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">Daily</p>
            <p className="text-sm text-muted-foreground">Market Analysis</p>
          </div>
        </div>
      </div>
    </section>
  )
}
