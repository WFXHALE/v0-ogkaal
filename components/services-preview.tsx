import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, Crown, ArrowRight } from "lucide-react"

export function ServicesPreview() {
  return (
    <section className="py-16 sm:py-20 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Our <span className="text-primary">Services</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the path that fits your trading journey.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mentorship Card */}
          <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                OG KAAL <span className="text-primary">Mentorship</span>
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Learn Smart Money Concepts and ICT trading strategies from basic to advanced with live trading examples and structured learning.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">$100</span>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                  <Link href="/mentorship" className="flex items-center gap-2">
                    View Mentorship
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* VIP Group Card */}
          <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Crown className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                VIP <span className="text-primary">Trading Group</span>
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Get real-time trade alerts, proper risk management guidance, and funded account challenge support from our exclusive VIP community.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">From $20</span>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                  <Link href="/vip-group" className="flex items-center gap-2">
                    View VIP Group
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
