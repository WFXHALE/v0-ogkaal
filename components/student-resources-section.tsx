import { FileText, PlayCircle, Target, Users, HeadphonesIcon, CheckCircle } from "lucide-react"

const resources = [
  {
    icon: FileText,
    title: "Course Material PDFs",
    description: "Comprehensive SMC and ICT trading guides in PDF format for offline study."
  },
  {
    icon: PlayCircle,
    title: "Recorded Sessions",
    description: "Access to all past mentorship sessions for revision and catching up."
  },
  {
    icon: Target,
    title: "Trading Models & Strategies",
    description: "Proven trading models and entry strategies used by professional traders."
  },
  {
    icon: Users,
    title: "Community Groups",
    description: "Dedicated Telegram groups for practice trades and market discussions."
  },
  {
    icon: HeadphonesIcon,
    title: "Continuous Support",
    description: "Ongoing mentorship support even after completing the course."
  },
]

export function StudentResourcesSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Student <span className="text-primary">Resources</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            As a mentorship student, you get access to exclusive resources designed to accelerate your trading journey.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div
              key={resource.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <resource.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-card border border-primary/20 rounded-2xl p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground mb-4 text-balance">
                Training <span className="text-primary">Pathway</span>
              </h3>
              <p className="text-muted-foreground mb-6 text-balance">
                Our structured curriculum takes you from beginner to advanced trader with clear milestones and evaluations.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground">SMC Course (Basic to Advanced) - Complete within 1 month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground">Evaluation test before advancing to next stage</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground">ICT Basic Training after SMC completion</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground">ICT Advanced Training with live market practice</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground">Dedicated trading groups for practice and discussion</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">1</span>
              </div>
              <span className="text-sm text-muted-foreground">Month SMC Course</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
