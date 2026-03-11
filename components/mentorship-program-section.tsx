"use client"

import { GraduationCap, BookOpen, LineChart, Shield } from "lucide-react"
import { useT } from "@/hooks/useT"

export function MentorshipProgramSection() {
  const t = useT()
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">{t.mentorship.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t.mentorship.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-primary">{t.mentorship.title.split(" ").slice(-1)[0]}</span>
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
          <p className="text-muted-foreground leading-relaxed mb-8 text-center max-w-3xl mx-auto">
            {t.mentorship.description}
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div className="text-center p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{t.mentorship.card1Title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.mentorship.card1Desc}</p>
            </div>
            <div className="text-center p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <LineChart className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{t.mentorship.card2Title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.mentorship.card2Desc}</p>
            </div>
            <div className="text-center p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{t.mentorship.card3Title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.mentorship.card3Desc}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-muted-foreground leading-relaxed">
            {t.mentorship.goalText}
          </p>
        </div>
      </div>
    </section>
  )
}
