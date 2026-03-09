import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FaqFeedback } from "@/components/faq-feedback"
import { ChevronLeft } from "lucide-react"

export const metadata = { title: "How long does verification take after payment? — FAQ" }

export default function FaqAnswer5() {
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
            How long does verification take after payment?
          </h1>
          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <p>
              Verification is typically completed within a few hours of submitting your payment proof and required details. During high-volume periods, it may take longer.
            </p>
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <p className="text-foreground font-semibold text-sm">What affects verification time:</p>
              {[
                "Volume of pending submissions — during peak enrollment periods, reviews may take longer.",
                "Completeness of your submission — make sure to include a clear payment screenshot, UTR number (if applicable), and all required personal details.",
                "Correct Trader ID submission for XM-based enrollments.",
                "Verification is done manually by the team, so please allow sufficient time before following up.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
            <p>
              If verification takes longer than 24 hours, feel free to follow up on{" "}
              <a href="https://t.me/ogkaaltrading" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline underline-offset-2">
                Telegram
              </a>.
            </p>
          </div>
          <FaqFeedback />
        </div>
      </main>
      <Footer />
    </div>
  )
}
