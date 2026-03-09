import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FaqFeedback } from "@/components/faq-feedback"
import { ChevronLeft } from "lucide-react"

export const metadata = { title: "Are recordings of live classes provided? — FAQ" }

export default function FaqAnswer4() {
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
            Are recordings of live classes provided?
          </h1>
          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <p>
              Yes. Recordings of live classes are provided so you never have to worry about missing a session.
            </p>
            <div className="p-5 rounded-xl bg-card border border-border space-y-3">
              {[
                "All live sessions are recorded and made available in the mentorship channel.",
                "Study materials covering topics discussed in class are shared after each session.",
                "You can revisit recordings at any time during your mentorship period.",
                "Materials are organized by topic for easy reference.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <FaqFeedback />
        </div>
      </main>
      <Footer />
    </div>
  )
}
