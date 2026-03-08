import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, BookOpen, Users, Video, Brain, ChartCandlestick, Shield, Gift } from "lucide-react"

const coreFeatures = [
  { icon: BookOpen, text: "Structured learning from basic to advanced" },
  { icon: ChartCandlestick, text: "Complete SMC + ICT concepts (Market Structure, BOS, CHOCH, Liquidity, Order Blocks, FVG)" },
  { icon: Video, text: "Live trading sessions explaining real market setups" },
  { icon: Video, text: "Recorded classes for revision" },
  { icon: Users, text: "Personal guidance and doubt clearing" },
  { icon: Brain, text: "Trading psychology and risk management training" },
  { icon: ChartCandlestick, text: "Practical trade examples and chart breakdowns" },
  { icon: BookOpen, text: "Access to learning resources (PDFs, notes, recordings, trackers)" },
  { icon: Users, text: "Community support and interaction" },
]

const mentorship2Features = [
  { icon: Gift, text: "3 Free Funded Account Backups" },
  { icon: ChartCandlestick, text: "Complete SMC + ICT Indicator Suite" },
  { icon: Star, text: "Lifetime VIP Challenge Access" },
  { icon: BookOpen, text: "50+ SMC & ICT Trading Books" },
  { icon: Zap, text: "Premium TradingView Access" },
  { icon: Shield, text: "XM Broker Deposit & Withdrawal Assistance" },
  { icon: Shield, text: "USDT to INR Conversion Support" },
  { icon: Star, text: "Top Trader Advancement to ICT 2.0 Elite Group" },
]

export default function MentorshipPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Premium Program</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
              OG KAAL <span className="text-primary">MENTORSHIP</span>
              <br />
              <span className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground">SMC & ICT</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed text-balance">
              Learn Smart Money Concepts and ICT trading strategies from basic to advanced with live trading examples and structured learning.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6">
                Join Mentorship
              </Button>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">$100</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-16 sm:py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                What You'll <span className="text-primary">Learn</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A comprehensive trading education covering everything you need to become a profitable trader.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-foreground leading-relaxed">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mentorship 2.0 Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-primary/5 to-background border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 mb-6">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wide">Upgraded</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Mentorship <span className="text-primary">2.0</span> – Upgraded Program
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Unlock exclusive bonuses and premium resources to accelerate your trading journey.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {mentorship2Features.map((feature, index) => (
                <div
                  key={index}
                  className="relative p-6 rounded-xl bg-card border border-primary/30 hover:border-primary transition-colors group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-foreground font-medium">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-10 py-6">
                Enroll Now
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ready to Start Your <span className="text-primary">Trading Journey</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of traders who have transformed their trading with our proven SMC & ICT strategies.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6">
                Join Mentorship – $100
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Lifetime Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Community Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Live Sessions</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
