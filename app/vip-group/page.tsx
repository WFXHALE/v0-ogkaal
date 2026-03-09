"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { VipAccessFlow, useVipAccessFlow } from "@/components/vip-access-flow"
import { Check, Crown, Shield, TrendingUp, Users, AlertCircle, Copy } from "lucide-react"
import { useState } from "react"

const PARTNER_CODE = "XV3F9"

const vipFeatures = [
  "Real-time trade alerts",
  "Proper risk management guidance",
  "Structured entry levels",
  "Funded account challenge support",
  "Private community access",
  "Daily market analysis",
]

export default function VipGroupPage() {
  const { isOpen, initialUserType, openFlow, closeFlow } = useVipAccessFlow()
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PARTNER_CODE)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const pricingOptions = [
    {
      title: "XM Existing User",
      price: "₹2500 / $30",
      description: "For traders who already have an XM trading account.",
      requirements: "Deposit minimum $50 under partner code XV3F9 and submit your Trader ID.",
      highlight: false,
      cta: "Continue",
      onClick: () => openFlow("existing"),
    },
    {
      title: "XM New User",
      price: "Varies",
      description: "For new XM users",
      requirements: "Create XM account using partner link, deposit minimum $50.",
      highlight: true,
      cta: "Open XM Account",
      onClick: () => openFlow("new"),
    },
    {
      title: "Funded Account User",
      price: "From ₹2,500",
      description: "For funded traders",
      requirements: "For traders using funded accounts. Select your account size.",
      highlight: false,
      cta: "Get Funded Access",
      onClick: () => openFlow("funded"),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">VIP Exclusive</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
              OG KAAL <span className="text-primary">VIP</span> Trading Group
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed text-balance">
              This VIP group focuses on helping traders with proper risk management, structured entry levels, and funded account challenge support.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {vipFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner Code Banner */}
        <section className="py-8 bg-primary border-y border-primary">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div>
              <p className="text-primary-foreground font-bold text-lg">XM Partner Code</p>
              <p className="text-primary-foreground/80 text-sm">Enter this code when opening your XM account to qualify for VIP access</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-6 py-3 bg-primary-foreground rounded-xl border-4 border-primary-foreground/20 shadow-lg">
                <span className="font-mono font-black text-primary text-3xl tracking-widest">{PARTNER_CODE}</span>
              </div>
              <Button
                size="lg"
                onClick={handleCopyCode}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold border-0"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Choose Your <span className="text-primary">Plan</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Select the option that best fits your trading setup.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingOptions.map((option, index) => (
                <div
                  key={index}
                  className={`relative p-8 rounded-2xl border transition-all ${
                    option.highlight
                      ? "bg-gradient-to-b from-primary/10 to-card border-primary shadow-lg shadow-primary/10"
                      : "bg-card border-border/50 hover:border-primary/50"
                  }`}
                >
                  {option.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                      Recommended
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                    <div className="text-4xl font-bold text-primary">{option.price}</div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mb-4 min-h-[40px]">
                    {option.requirements}
                  </p>
                  {option.highlight && (
                    <p className="text-xs text-primary text-center mb-4 font-medium">
                      Use Partner Code: {PARTNER_CODE}
                    </p>
                  )}
                  <Button
                    onClick={option.onClick}
                    className={`w-full font-bold ${
                      option.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {option.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Join Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-primary/5 to-background border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                How to <span className="text-primary">Join</span>
              </h2>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-border/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground leading-relaxed">
                  To join the VIP group, users must either open an XM trading account using the official referral link or pay the required membership fee depending on their trading setup.
                </p>
              </div>
              <div className="grid sm:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Choose Plan</h4>
                    <p className="text-sm text-muted-foreground">Select based on your broker</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Open XM Account</h4>
                    <p className="text-sm text-muted-foreground">Use partner code {PARTNER_CODE}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Verify Account</h4>
                    <p className="text-sm text-muted-foreground">Submit your XM Trader ID</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Join VIP Group</h4>
                    <p className="text-sm text-muted-foreground">Get instant Telegram access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                VIP Group <span className="text-primary">Benefits</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Real-Time Trade Alerts</h3>
                <p className="text-muted-foreground">Get instant notifications for high-probability trade setups.</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Risk Management</h3>
                <p className="text-muted-foreground">Learn proper position sizing and risk control strategies.</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Private Community</h3>
                <p className="text-muted-foreground">Connect with like-minded traders and share insights.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Join the <span className="text-primary">Elite Traders</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
              Take your trading to the next level with VIP access to exclusive trade alerts and community support.
            </p>
            <p className="text-primary font-medium mb-8">
              Use Partner Code: <span className="font-mono font-bold text-lg">{PARTNER_CODE}</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => openFlow("new")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6"
              >
                Open XM Account
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => openFlow()}
                className="border-primary/50 text-foreground hover:bg-primary/10 font-bold text-lg px-8 py-6"
              >
                Join VIP Group
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* VIP Access Flow Modal */}
      <VipAccessFlow 
        isOpen={isOpen} 
        onClose={closeFlow} 
        initialUserType={initialUserType}
      />
    </div>
  )
}
