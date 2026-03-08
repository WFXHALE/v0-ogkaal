import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const checklistItems = [
  "Daily Market Analysis",
  "Real-Time Trade Alerts",
  "Private Discussion Forum",
]

export function VipCommunitySection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl border border-[#2a2a35] bg-[#12121a] p-8 md:p-12 overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            {/* VIP Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-[#d4af37] text-sm font-semibold tracking-wide">VIP Exclusive</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join Elite Trading Community
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl">
              Get access to real-time market insights, instant trade alerts, and join our private trading discussion with professional traders who share winning strategies daily.
            </p>

            {/* Checklist */}
            <ul className="flex flex-col gap-4 mb-10">
              {checklistItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40">
                    <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                  </div>
                  <span className="text-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Button 
              className="bg-[#d4af37] hover:bg-[#c4a030] text-[#0a0a0f] font-semibold px-8 py-6 text-base rounded-lg transition-all hover:shadow-lg hover:shadow-[#d4af37]/20"
            >
              Join VIP Community
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
