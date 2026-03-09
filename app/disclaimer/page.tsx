import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AlertTriangle } from "lucide-react"

export const metadata = {
  title: "Trading Disclaimer — OG KAAL TRADER",
  description: "Important risk disclosure and trading disclaimer for OG KAAL TRADER.",
}

const points = [
  "Trading in forex and cryptocurrency involves substantial financial risk. You may lose all or more than your initial investment.",
  "All educational material, analysis, and content provided on this platform is for learning and informational purposes only. It does not constitute financial advice.",
  "No profit guarantees are made. Past performance of any strategy, signal, or educational content does not guarantee future results.",
  "Users are solely responsible for their own trading decisions, risk management, and any financial outcomes resulting from those decisions.",
  "OG KAAL TRADER and its team members are not registered financial advisors. Always consult a qualified financial professional before making investment decisions.",
  "Market conditions are unpredictable. Even well-researched strategies can result in losses.",
  "By accessing this platform and its content, you acknowledge that you have read, understood, and agree to this disclaimer in full.",
]

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Trading Disclaimer</h1>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8">
            Please read the following disclaimer carefully before using any content, tools, or services provided by OG KAAL TRADER.
          </p>

          <ul className="space-y-5">
            {points.map((point, i) => (
              <li key={i} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{point}</p>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground mt-10 text-center">
            Last updated: March 2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
