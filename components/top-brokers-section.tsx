"use client"

import { useState } from "react"
import { ExternalLink, Copy, Check, X, Shield, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const XM_AFFILIATE_LINK   = "https://clicks.pipaffiliates.com/c?c=1090940&l=en&p=1"
const XM_PARTNER_CODE     = "XV3F9"
const EXNESS_LINK         = "https://one.exnesstrack.org/a/og_kaal"
const JUSTMARKETS_LINK    = "https://one.justmarkets.link/a/kaaltrading"

interface Broker {
  id:          string
  name:        string
  tagline:     string
  logoUrl:     string
  logoAlt:     string
  highlight:   string
  features:    string[]
  partnerCode?: string
  link:        string
  recommended: boolean
}

const BROKERS: Broker[] = [
  {
    id:          "xm",
    name:        "XM",
    tagline:     "Our #1 Recommended Broker",
    logoUrl:     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-13%20at%2011.53.07%E2%80%AFAM-EMj6TsSNBB9LIHwT573L1QOWChv0Ff.png",
    logoAlt:     "XM 15 Years logo",
    highlight:   "Partner code required for VIP & funded account access",
    features:    ["Regulated broker", "MT4 & MT5", "Low spreads", "Bonus eligible"],
    partnerCode: XM_PARTNER_CODE,
    link:        XM_AFFILIATE_LINK,
    recommended: true,
  },
  {
    id:          "exness",
    name:        "Exness",
    tagline:     "Ultra-low spreads, instant withdrawals",
    logoUrl:     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-13%20at%2011.52.20%E2%80%AFAM-YINpyz9uYqGPHspG99BTQOGV2avn6X.png",
    logoAlt:     "Exness logo",
    highlight:   "Instant withdrawals 24/7",
    features:    ["Instant withdrawals", "Tight spreads", "High leverage", "MT5 platform"],
    link:        EXNESS_LINK,
    recommended: false,
  },
  {
    id:          "justmarkets",
    name:        "JustMarkets",
    tagline:     "Flexible accounts, global access",
    logoUrl:     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-13%20at%2011.53.19%E2%80%AFAM-6bP4MPpsUyM5mS0Um8KEbUvsnuyb4d.png",
    logoAlt:     "JustMarkets logo",
    highlight:   "Up to 1:3000 leverage",
    features:    ["Multiple account types", "Fast execution", "Crypto deposits", "24/7 support"],
    link:        JUSTMARKETS_LINK,
    recommended: false,
  },
]

export function TopBrokersSection() {
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)

  const activeBroker = BROKERS.find(b => b.id === activePopup)

  const handleOpen = (broker: Broker) => {
    if (broker.partnerCode) {
      setActivePopup(broker.id)
    } else {
      window.open(broker.link, "_blank", "noopener noreferrer")
    }
  }

  const handleCopy = () => {
    if (!activeBroker?.partnerCode) return
    navigator.clipboard.writeText(activeBroker.partnerCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = () => {
    if (!activeBroker) return
    window.open(activeBroker.link, "_blank", "noopener noreferrer")
    setActivePopup(null)
  }

  return (
    <>
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">
              Trusted Partners
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our Recommended{" "}
              <span className="text-primary">Brokers</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Trade with regulated brokers trusted by thousands of our community members. Use our partner links for exclusive bonuses and group access.
            </p>
          </div>

          {/* Broker cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {BROKERS.map((broker) => (
              <div
                key={broker.id}
                className={`relative flex flex-col rounded-2xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${
                  broker.recommended
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                {/* Recommended badge */}
                {broker.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold whitespace-nowrap">
                    Recommended
                  </div>
                )}

                <div className="p-6 flex flex-col gap-5 flex-1">
                  {/* Logo */}
                  <div className="h-14 flex items-center justify-center bg-white rounded-xl px-4 py-2 border border-border/40">
                    <img
                      src={broker.logoUrl}
                      alt={broker.logoAlt}
                      className="h-full w-auto object-contain max-h-10"
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{broker.name}</h3>
                    <p className="text-sm text-muted-foreground">{broker.tagline}</p>
                  </div>

                  {/* Highlight pill */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20">
                    <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs text-primary font-medium">{broker.highlight}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 flex-1">
                    {broker.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => handleOpen(broker)}
                    className={`w-full font-semibold ${
                      broker.recommended
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Open Account
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
            Trading involves significant risk. Past performance is not indicative of future results.
            Partner links may earn us a referral commission at no extra cost to you.
          </p>
        </div>
      </section>

      {/* XM Partner Code Popup */}
      {activePopup && activeBroker?.partnerCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setActivePopup(null)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl shadow-primary/10 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setActivePopup(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Logo in popup */}
              <div className="flex justify-center mb-5">
                <div className="h-16 flex items-center justify-center bg-white rounded-xl px-5 py-2 border border-border/40">
                  <img
                    src={activeBroker.logoUrl}
                    alt={activeBroker.logoAlt}
                    className="h-full w-auto object-contain max-h-12"
                  />
                </div>
              </div>

              <h3 className="text-xl font-bold text-foreground text-center mb-1">
                Open Your <span className="text-primary">{activeBroker.name}</span> Account
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Use our partner code when registering to qualify for VIP access and the funded account group.
              </p>

              {/* Partner code box */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Partner Code</p>
                  <p className="font-mono font-bold text-primary text-xl">{activeBroker.partnerCode}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="border-primary/40 hover:bg-primary/10 shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleConfirm}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6 text-base"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continue to {activeBroker.name}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActivePopup(null)}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
