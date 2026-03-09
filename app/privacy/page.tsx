import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — OG KAAL TRADER",
  description: "Privacy policy explaining how OG KAAL TRADER collects and uses your data.",
}

const dataCollected = [
  { label: "Full Name", desc: "Used to identify you during enrollment and verification." },
  { label: "Email Address", desc: "Used for communication, confirmation messages, and support." },
  { label: "Phone Number", desc: "Used for WhatsApp or direct contact when needed." },
  { label: "Telegram ID / Username", desc: "Used to add verified users to VIP groups and mentorship channels." },
  { label: "Payment Submission Data", desc: "Includes transaction screenshots, UTR numbers, or wallet transaction IDs submitted during enrollment. Used solely to verify your payment." },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-10">
            OG KAAL TRADER is committed to protecting your privacy. This page explains what information we collect, why we collect it, and how it is used.
          </p>

          {/* What we collect */}
          <section className="mb-10">
            <h2 className="text-base font-bold text-foreground mb-4 pb-2 border-b border-border">
              Information We Collect
            </h2>
            <div className="space-y-3">
              {dataCollected.map((item) => (
                <div key={item.label} className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm font-semibold text-foreground mb-1">{item.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How we use it */}
          <section className="mb-10">
            <h2 className="text-base font-bold text-foreground mb-4 pb-2 border-b border-border">
              How We Use Your Information
            </h2>
            <ul className="space-y-3">
              {[
                "To verify your identity and payment before granting access to mentorship or VIP programs.",
                "To communicate updates, class schedules, and important announcements.",
                "To add verified users to the correct Telegram or community groups.",
                "To respond to support requests or contact form submissions.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Data sharing */}
          <section className="mb-10">
            <h2 className="text-base font-bold text-foreground mb-4 pb-2 border-b border-border">
              Data Sharing
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not sell, rent, or share your personal information with any third parties for marketing purposes. Your data is used exclusively within OG KAAL TRADER for the purposes described above.
            </p>
          </section>

          {/* Data security */}
          <section className="mb-10">
            <h2 className="text-base font-bold text-foreground mb-4 pb-2 border-b border-border">
              Data Security
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We take reasonable precautions to protect your submitted information. However, no method of transmission over the internet is 100% secure. We encourage you to contact us immediately if you believe your information has been compromised.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-4 pb-2 border-b border-border">
              Contact Us
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please reach out via the{" "}
              <a href="/contact" className="text-primary underline underline-offset-2">Contact page</a>.
            </p>
          </section>

          <p className="text-xs text-muted-foreground mt-10 text-center">
            Last updated: March 2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
