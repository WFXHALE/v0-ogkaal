import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ScrollText } from "lucide-react"

export const metadata = {
  title: "Terms & Conditions — OG KAAL TRADER",
  description: "Terms and conditions for using OG KAAL TRADER mentorship and VIP services.",
}

const sections = [
  {
    title: "Payments and Refunds",
    rules: [
      "All mentorship program payments are strictly non-refundable once access has been granted.",
      "VIP group access fees are non-refundable under any circumstances.",
      "Partial refunds are not available for unused portions of any program.",
    ],
  },
  {
    title: "Code of Conduct",
    rules: [
      "Any form of abusive behavior, harassment, or disrespect toward other members or the OG KAAL TRADER team will result in immediate removal from the mentorship or VIP group without refund.",
      "Sharing, reselling, or distributing any paid content, recordings, or study material is strictly prohibited and may result in permanent removal and legal action.",
      "Misleading activity such as providing false information during enrollment, KYC, or payment verification will lead to immediate removal without refund.",
      "Violation of community rules, platform guidelines, or the spirit of this agreement may result in removal at the sole discretion of the OG KAAL TRADER team.",
    ],
  },
  {
    title: "Legal Liability",
    rules: [
      "If any user performs illegal, suspicious, or fraudulent activity that directly or indirectly causes the website owner's bank account, payment account, or business operations to be frozen, blocked, or negatively affected, legal action will be initiated against that user according to applicable laws.",
      "The responsible user may be held liable and required to pay a financial penalty or compensate for losses equal to three times the amount of the loss or damage caused by their actions.",
      "OG KAAL TRADER reserves the right to report any fraudulent activity to relevant financial institutions and law enforcement agencies.",
    ],
  },
  {
    title: "General",
    rules: [
      "OG KAAL TRADER reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.",
      "By enrolling in any program or accessing any service, you confirm that you have read, understood, and agreed to all terms stated on this page.",
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-10">
            By using any service, program, or content provided by OG KAAL TRADER, you agree to the following terms and conditions.
          </p>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-bold text-foreground mb-3 pb-2 border-b border-border">
                  {section.title}
                </h2>
                <ul className="space-y-3">
                  {section.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{rule}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-10 text-center">
            Last updated: March 2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
