import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FaqFeedback } from "@/components/faq-feedback"
import { ChevronLeft } from "lucide-react"

export const metadata = { title: "Minimum deposit for XM accounts — FAQ" }

export default function FaqAnswer6() {
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
            What is the minimum deposit requirement for XM accounts?
          </h1>
          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <p>
              To qualify for VIP group access through an XM account, you must make a minimum deposit of <span className="text-foreground font-semibold">$50</span> under the OG KAAL partner code.
            </p>

            <div className="p-5 rounded-xl bg-card border border-border space-y-4">
              <p className="text-foreground font-semibold">Steps to follow:</p>
              {[
                { step: "1", text: "Open an XM account using the partner link provided on the VIP Group page." },
                { step: "2", text: "During registration, enter the partner code XV3F9 to ensure it is linked to your account." },
                { step: "3", text: "Deposit a minimum of $50 into your XM trading account." },
                { step: "4", text: "Take a screenshot of the deposit confirmation." },
                { step: "5", text: "Submit your Trader ID along with the deposit screenshot through the enrollment form." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            <p>
              If you already have an XM account and need to deposit under the partner code, please reach out on{" "}
              <a href="https://t.me/ogkaaltrading" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline underline-offset-2">
                Telegram
              </a>{" "}
              for guidance before submitting.
            </p>
          </div>
          <FaqFeedback />
        </div>
      </main>
      <Footer />
    </div>
  )
}
