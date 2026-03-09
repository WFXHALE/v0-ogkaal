import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FaqFeedback } from "@/components/faq-feedback"
import { ChevronLeft } from "lucide-react"

export const metadata = {
  title: "Mentorship 1.0 vs Mentorship 2.0 — FAQ",
}

export default function FaqAnswer2() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/faq" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ChevronLeft className="w-4 h-4" />
            Back to FAQ
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-8 text-balance">
            What is the difference between Mentorship 1.0 and Mentorship 2.0?
          </h1>

          <div className="space-y-5 text-muted-foreground leading-relaxed text-sm">
            <p>
              Both programs cover core trading concepts, but Mentorship 2.0 is the upgraded version offering a more comprehensive experience with additional benefits.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-card border border-border">
                <p className="text-foreground font-bold mb-3">Mentorship 1.0</p>
                {[
                  "Core SMC and ICT concepts",
                  "Live classes",
                  "Study material",
                  "Community support",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-xl bg-primary/5 border border-primary/30">
                <p className="text-primary font-bold mb-3">Mentorship 2.0 (Upgraded)</p>
                {[
                  "Everything in 1.0",
                  "VIP group access",
                  "Funded account opportunities",
                  "Advanced trading tools",
                  "Priority support",
                  "Exclusive strategy sessions",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <p>
              Mentorship 2.0 is recommended for traders who want a more complete learning experience and access to advanced resources beyond the basics.
            </p>
          </div>

          <FaqFeedback />
        </div>
      </main>
      <Footer />
    </div>
  )
}
