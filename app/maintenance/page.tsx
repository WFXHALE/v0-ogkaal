import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Settings, Send } from "lucide-react"

export const metadata: Metadata = {
  title: "Under Maintenance – OG KAAL TRADER",
  description: "We are currently performing scheduled maintenance. Please check back shortly.",
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/og-kaal-logo.png"
          alt="OG KAAL TRADER"
          width={80}
          height={80}
          className="rounded-2xl mx-auto"
          priority
        />
      </div>

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-8">
        <Settings className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: "4s" }} />
      </div>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
        Website Under Maintenance
      </h1>

      {/* Message */}
      <p className="text-muted-foreground max-w-md text-base leading-relaxed mb-10 text-pretty">
        We are currently performing scheduled maintenance to improve your experience.
        Please check back shortly. Thank you for your patience.
      </p>

      {/* Divider */}
      <div className="w-16 h-px bg-border mb-10" />

      {/* Support link */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">Need urgent help? Contact us on Telegram:</p>
        <Link
          href="https://t.me/ogkaaltrader"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Send className="w-4 h-4" />
          Contact Support
        </Link>
      </div>

      {/* Brand */}
      <p className="mt-16 text-xs text-muted-foreground font-semibold tracking-widest uppercase">
        OG KAAL TRADER
      </p>
    </main>
  )
}
