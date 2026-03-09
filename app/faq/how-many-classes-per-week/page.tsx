import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FaqFeedback } from "@/components/faq-feedback"
import { ChevronLeft } from "lucide-react"

export const metadata = { title: "How many classes per week? — FAQ" }

export default function FaqAnswer3() {
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
            How many classes are conducted per week?
          </h1>
          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <p>
              Classes are conducted <span className="text-foreground font-semibold">5 days a week</span>, from Monday to Friday.
            </p>
            <div className="p-5 rounded-xl bg-card border border-border">
              <div className="grid grid-cols-5 gap-2 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                  <div key={day} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs font-bold text-primary">{day}</p>
                    <p className="text-xs text-muted-foreground mt-1">Class</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["Sat", "Sun"].map((day) => (
                  <div key={day} className="p-3 rounded-lg bg-card border border-border/50 text-center">
                    <p className="text-xs font-bold text-muted-foreground">{day}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Off</p>
                  </div>
                ))}
              </div>
            </div>
            <p>
              Weekends (Saturday and Sunday) are off. This schedule allows students to review material, practice, and rest before the next week begins.
            </p>
          </div>
          <FaqFeedback />
        </div>
      </main>
      <Footer />
    </div>
  )
}
