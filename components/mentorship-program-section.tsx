import { GraduationCap, BookOpen, LineChart, Shield } from "lucide-react"

export function MentorshipProgramSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Featured Program</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Mentorship <span className="text-primary">2.0</span> Program
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
          <p className="text-muted-foreground leading-relaxed mb-8 text-center max-w-3xl mx-auto">
            The mentorship program includes structured learning of SMC and ICT concepts. Students go through basic to advanced market models and learn how to identify liquidity, structure shifts and institutional order flow. The program focuses on building consistent traders through risk management and proper market understanding.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Structured Learning</h3>
              <p className="text-sm text-muted-foreground">Basic to advanced concepts</p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <LineChart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Market Analysis</h3>
              <p className="text-sm text-muted-foreground">Live trading sessions</p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Risk Management</h3>
              <p className="text-sm text-muted-foreground">Disciplined trading</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-muted-foreground leading-relaxed">
            The goal of this platform is to help traders develop discipline and understanding of market structure instead of relying on random signals.
          </p>
        </div>
      </div>
    </section>
  )
}
