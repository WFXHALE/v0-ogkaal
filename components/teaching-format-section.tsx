import { Youtube, Video, FileText, Monitor, BarChart3, Lightbulb } from "lucide-react"

const teachingMethods = [
  {
    icon: Youtube,
    title: "Live YouTube Classes",
    description: "Regular live trading sessions and educational content streamed on YouTube for all students."
  },
  {
    icon: Video,
    title: "Private Google Meet Sessions",
    description: "One-on-one and group mentorship sessions via Google Meet for personalized guidance."
  },
  {
    icon: FileText,
    title: "Study Material & PDFs",
    description: "Comprehensive trading PDFs and study materials covering SMC and ICT concepts."
  },
  {
    icon: Monitor,
    title: "Live Trade Demonstrations",
    description: "Watch real-time trade executions with detailed explanation of entry and exit strategies."
  },
  {
    icon: BarChart3,
    title: "Market Breakdown Sessions",
    description: "Daily and weekly market analysis breaking down price action and key levels."
  },
  {
    icon: Lightbulb,
    title: "SMC & ICT Strategy Sessions",
    description: "Deep-dive sessions explaining Smart Money Concepts and ICT trading methodologies."
  },
]

export function TeachingFormatSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            How We <span className="text-primary">Teach</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            Our comprehensive teaching methodology combines live sessions, detailed materials, and hands-on practice to ensure your trading success.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachingMethods.map((method) => (
            <div
              key={method.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <method.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{method.title}</h3>
              <p className="text-sm text-muted-foreground">{method.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
