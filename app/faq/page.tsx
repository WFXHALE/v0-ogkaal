import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChevronRight, HelpCircle } from "lucide-react"
import { faqs } from "@/lib/faq-data"

export const metadata = {
  title: "FAQ — OG KAAL TRADER",
  description: "Frequently asked questions about OG KAAL TRADER mentorship, VIP group, and trading programs.",
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">FAQ</h1>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-10">
            Click any question below to read the full answer.
          </p>

          <ul className="space-y-3">
            {faqs.map((faq, i) => (
              <li key={faq.slug}>
                <Link
                  href={`/faq/${faq.slug}`}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors text-pretty">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}
