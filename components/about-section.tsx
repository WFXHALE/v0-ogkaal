import { User, Target, TrendingUp, Award } from "lucide-react"

export function AboutSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            About <span className="text-primary">OG KAAL TRADER</span>
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              OG KAAL TRADER is a trading mentor focused on Smart Money Concepts and ICT trading models. Trading since 2020 and helping traders understand institutional market behavior.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The mentorship program focuses on structure, liquidity, risk management and real trading discipline. Many traders have successfully passed funded challenges after following the structured mentorship system.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <User className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Since 2020</h3>
              <p className="text-sm text-muted-foreground">Active Trading</p>
            </div>
            <div className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <Target className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">SMC Focus</h3>
              <p className="text-sm text-muted-foreground">Institutional Logic</p>
            </div>
            <div className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <TrendingUp className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Funded Traders</h3>
              <p className="text-sm text-muted-foreground">Passed Challenges</p>
            </div>
            <div className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <Award className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Structured</h3>
              <p className="text-sm text-muted-foreground">Learning System</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
