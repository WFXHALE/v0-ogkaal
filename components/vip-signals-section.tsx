import { Button } from "@/components/ui/button"
import { Bell, BarChart2, Shield, GraduationCap, ArrowRight } from "lucide-react"
import Link from "next/link"

const vipFeatures = [
  {
    icon: Bell,
    title: "Real-Time Trade Signals",
    description: "Get instant notifications for high-probability trade setups as they happen."
  },
  {
    icon: BarChart2,
    title: "Market Analysis",
    description: "Daily and weekly market breakdowns with key levels and trading opportunities."
  },
  {
    icon: Shield,
    title: "Risk Management Guidance",
    description: "Learn proper position sizing and risk management for consistent profits."
  },
  {
    icon: GraduationCap,
    title: "Trade Review & Learning",
    description: "Review past trades together and learn from both wins and losses."
  },
]

export function VipSignalsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">VIP Access</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
              VIP <span className="text-primary">Signals</span> Group
            </h2>
            <p className="text-muted-foreground mb-8 text-balance">
              Join our exclusive VIP group for real-time trading signals, market analysis, and continuous support from OG KAAL TRADER.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {vipFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/vip-group">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Join VIP Group
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Signal Preview</h3>
              <p className="text-sm text-muted-foreground">Example of VIP signal format</p>
            </div>
            
            <div className="bg-background rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-primary uppercase">Gold Signal</span>
                <span className="text-xs text-green-500 font-medium">BUY</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pair:</span>
                  <span className="text-foreground font-medium">XAUUSD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry:</span>
                  <span className="text-foreground font-medium">2,650.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TP 1:</span>
                  <span className="text-green-500 font-medium">2,665.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TP 2:</span>
                  <span className="text-green-500 font-medium">2,680.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SL:</span>
                  <span className="text-red-500 font-medium">2,640.00</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">SMC Order Block + Liquidity Sweep setup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
