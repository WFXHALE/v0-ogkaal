"use client"

import { useState, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Check,
  Copy,
  X,
  ArrowLeft,
  BookOpen,
  Video,
  Users,
  Brain,
  ChartCandlestick,
  Star,
  Zap,
  Gift,
  Shield,
  Upload,
  Bitcoin,
  QrCode,
  CreditCard,
  Phone,
  AtSign,
  MessageCircle,
  Instagram,
  Mail,
  User,
} from "lucide-react"
import { saveSubmission } from "@/lib/admin-submissions"

// ─── Constants ───────────────────────────────────────────────────────────────

const UPI_LINKS = {
  "1.0": "https://payments.cashfree.com/forms/OGMENTOR1",
  "2.0": "https://payments.cashfree.com/forms/MENTOR2",
  "crypto": "https://payments.cashfree.com/forms/OGMENTOR1",
}

const ERUPEE_QR = "/erupee-qr.png"

const CRYPTO_OPTIONS = [
  {
    key: "trc20",
    label: "USDT TRC20",
    network: "TRC20",
    address: "TF7gytsAtFPM9f2RQPyiFphd8pasiZ1WQF",
    isBinance: false,
  },
  {
    key: "bep20",
    label: "USDT BEP20",
    network: "BEP20",
    address: "0xa1540bccbe530fcc92a2b31db5795394053fdad7",
    isBinance: false,
  },
  {
    key: "binance",
    label: "Binance ID",
    network: "Binance",
    address: "1125271626",
    isBinance: true,
  },
]

// ─── Static data ──────────────────────────────────────────────────────────────

const programInfo = [
  "5 Days per Week Classes",
  "Live Sessions on Google Meet",
  "Complete Study Material Provided",
  "Recorded Classes for Revision",
  "Practical Market Trade Examples",
  "Trading Psychology and Risk Management",
  "Community Learning Environment",
]

const smcTopics = [
  "Market Structure",
  "Break of Structure (BOS)",
  "Change of Character (CHOCH)",
  "Liquidity Concepts",
  "Order Blocks",
  "Fair Value Gaps (FVG)",
  "Inducement and Imbalances",
]

const ictTopics = [
  "Optimal Trade Entry",
  "Killzones",
  "Liquidity Sweeps",
  "Institutional Order Flow",
  "Market Manipulation",
  "Premium and Discount Zones",
]

const mentorship1Features = [
  "Structured Learning (Basics to Advanced)",
  "Live and Recorded Classes",
  "Personal Guidance and Doubt Clearing",
  "Practical Trade Examples",
  "Evaluation Tests (MCQs and quizzes)",
  "Trading Psychology and Risk Management",
  "Learning Resources (PDFs, notes, trackers)",
  "Community Support Group",
]

const mentorship2Features = [
  "3 Free Funded Account Backups",
  "Complete SMC + ICT Indicator Suite",
  "Lifetime VIP Challenge Access",
  "50+ Premium SMC & ICT Books",
  "Premium TradingView Access",
  "XM Broker Deposit and Withdrawal Support",
  "USDT to INR Conversion Support",
  "Top Trader Advancement to ICT 2.0 Elite Group",
]

const cryptoTopics: { name: string; desc: string }[] = [
  { name: "What is Cryptocurrency", desc: "Introduction to digital currencies, their origin, and how they differ from traditional money." },
  { name: "How Blockchain Works", desc: "The technology behind crypto — decentralised ledgers, consensus mechanisms, and blocks." },
  { name: "How Crypto Markets Operate", desc: "24/7 trading, price discovery, global exchanges, and how crypto market structure differs from Forex and equities." },
  { name: "Centralized vs Decentralized Exchanges", desc: "Differences between CEXs (Binance, OKX) and DEXs (Uniswap) — pros, cons, and when to use each." },
  { name: "Spot Trading vs Futures Trading", desc: "Buying the actual asset versus trading contracts with expiry and margin requirements." },
  { name: "What is Leverage", desc: "How leverage amplifies gains and losses, and why proper risk management is essential when using it." },
  { name: "Bid Price and Ask Price", desc: "Understanding the order book, spread, and how buy and sell prices are set in the market." },
  { name: "Market Orders vs Limit Orders", desc: "Instant execution versus waiting for price — how and when to use each order type." },
  { name: "Crypto Market Liquidity", desc: "What liquidity means, why it matters, and how thin markets lead to slippage and volatility." },
  { name: "How to Read Crypto Charts", desc: "Candlestick basics, timeframe selection, and interpreting price movement across different chart types." },
  { name: "Basic Technical Analysis", desc: "Trends, moving averages, volume, and how to combine indicators for a clearer market picture." },
  { name: "Support and Resistance in Crypto", desc: "Identifying key price levels, round numbers, and historical zones that attract buyers and sellers." },
  { name: "Trend Identification", desc: "Higher highs, higher lows, lower highs, lower lows — reading the overall direction of any crypto asset." },
  { name: "Risk Management in Crypto Trading", desc: "Position sizing, stop-loss placement, and protecting capital in a highly volatile market." },
  { name: "Portfolio Management", desc: "How to allocate capital across assets, diversify risk, and rebalance a crypto portfolio over time." },
  { name: "Long vs Short Positions", desc: "Profiting in both bull and bear markets — understanding directional bias in futures trading." },
  { name: "Funding Rates", desc: "What funding rates are, how they affect futures traders, and how to use them as a sentiment indicator." },
  { name: "Crypto Market Cycles", desc: "Bull markets, bear markets, accumulation, and distribution — understanding the bigger picture." },
  { name: "Bitcoin Dominance", desc: "How BTC dominance affects altcoins and why it is a key indicator for altcoin season timing." },
  { name: "Altcoin Rotation", desc: "How capital flows from Bitcoin into large-cap and then small-cap altcoins during bull market phases." },
  { name: "Security and Wallet Safety", desc: "Keeping your assets safe — private keys, seed phrases, 2FA, and best practices for account security." },
  { name: "Cold Wallet vs Hot Wallet", desc: "The difference between hardware wallets (offline) and software wallets (online) and when to use each." },
  { name: "Crypto Scams and Risk Awareness", desc: "Common scams — rug pulls, phishing, fake projects — and how to research before investing." },
]

const cryptoMentorshipFeatures = [
  "Crypto Fundamentals from the Ground Up",
  "Live Classes on Spot and Futures Trading",
  "Risk Management and Portfolio Strategy",
  "Practical Chart Analysis and Trade Examples",
  "Crypto Market Cycles and Bitcoin Dominance",
  "Security, Wallets, and Exchange Setup Guidance",
  "Community Learning Environment",
  "Recorded Classes for Revision",
]

// ─── Types ───────────────────────────────────────────────────────────────────

type ProgramType = "1.0" | "2.0" | "crypto" | null
type FlowStep = "idle" | "contact" | "payment" | "success"
type PaymentMethod = "upi" | "crypto" | "erupee" | null

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MentorshipPage() {
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>(null)
  const [flowStep, setFlowStep] = useState<FlowStep>("idle")

  // Contact form
  const [contactData, setContactData] = useState({
    fullName: "",
    telegramId: "",
    instagramId: "",
    phoneNumber: "",
    email: "",
  })

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [cryptoOption, setCryptoOption] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [utr, setUtr] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const screenshotRef = useRef<HTMLInputElement>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleEnroll = (program: ProgramType) => {
    setSelectedProgram(program)
    setFlowStep("contact")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleContactSubmit = () => {
    const { fullName, telegramId, instagramId, phoneNumber, email } = contactData
    if (!fullName || !telegramId || !instagramId || !phoneNumber || !email) return
    setFlowStep("payment")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isContactValid =
    contactData.fullName &&
    contactData.telegramId &&
    contactData.instagramId &&
    contactData.phoneNumber &&
    contactData.email

  const isPaymentValid = () => {
    if (!paymentMethod || !screenshot) return false
    if (paymentMethod === "crypto") return !!cryptoOption
    if (paymentMethod === "erupee") return true
    return !!utr // upi requires UTR
  }

  const handlePaymentSubmit = async () => {
    await saveSubmission({
      type: "mentorship",
      name: contactData.fullName,
      telegram: contactData.telegramId,
      phone: contactData.phoneNumber,
      details: {
        program: `Mentorship ${selectedProgram}`,
        instagram: contactData.instagramId,
        email: contactData.email,
        paymentMethod,
        cryptoOption,
        utr,
      },
    })
    setFlowStep("success")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleReset = () => {
    setSelectedProgram(null)
    setFlowStep("idle")
    setContactData({ fullName: "", telegramId: "", instagramId: "", phoneNumber: "", email: "" })
    setPaymentMethod(null)
    setCryptoOption(null)
    setScreenshot(null)
    setUtr("")
    setCopiedField(null)
  }

  // ── Render flow overlay ───────────────────────────────────────────────────

  if (flowStep !== "idle") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="max-w-2xl mx-auto px-4">

            {/* Back button */}
            {flowStep !== "success" && (
              <button
                onClick={flowStep === "contact" ? handleReset : () => setFlowStep(flowStep === "payment" ? "contact" : "payment")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Step indicator */}
            {flowStep !== "success" && (
              <div className="flex items-center gap-2 mb-8">
                {["contact", "payment"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        flowStep === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : flowStep === "success" || (s === "contact" && flowStep === "payment")
                          ? "bg-primary/20 text-primary border-primary/50"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className={`text-xs ${flowStep === s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {s === "contact" ? "Your Details" : "Payment"}
                    </span>
                    {i < 1 && <div className="w-8 h-px bg-border mx-1" />}
                  </div>
                ))}
              </div>
            )}

            {/* Program badge */}
            {flowStep !== "success" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 mb-6">
                <Star className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  {selectedProgram === "crypto" ? "Crypto Mentorship" : `Mentorship ${selectedProgram}`}
                </span>
              </div>
            )}

            {/* ── STEP: Contact Details ─────────────────────────────────── */}
            {flowStep === "contact" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Your Details</h2>
                <p className="text-muted-foreground mb-6 text-sm">Fill in your information to proceed to payment.</p>

                <div className="space-y-4">
                  {[
                    { key: "fullName", label: "Full Name", placeholder: "Enter your full name", icon: User, type: "text" },
                    { key: "telegramId", label: "Telegram ID", placeholder: "@yourusername", icon: MessageCircle, type: "text" },
                    { key: "instagramId", label: "Instagram ID", placeholder: "@yourhandle", icon: Instagram, type: "text" },
                    { key: "phoneNumber", label: "Phone Number", placeholder: "+91 XXXXX XXXXX", icon: Phone, type: "tel" },
                    { key: "email", label: "Email Address", placeholder: "you@example.com", icon: Mail, type: "email" },
                  ].map(({ key, label, placeholder, icon: Icon, type }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={type}
                          value={contactData[key as keyof typeof contactData]}
                          onChange={(e) => setContactData((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleContactSubmit}
                  disabled={!isContactValid}
                  className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {/* ── STEP: Payment ────────────────────────────────────────── */}
            {flowStep === "payment" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Payment</h2>
                <p className="text-muted-foreground mb-6 text-sm">Choose a payment method and upload your proof.</p>

                {/* Method selector */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { key: "upi", label: "UPI", icon: QrCode },
                    { key: "crypto", label: "Crypto", icon: Bitcoin },
                    { key: "erupee", label: "E-Rupee", icon: CreditCard },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setPaymentMethod(key as PaymentMethod)
                        setCryptoOption(null)
                        setCopiedField(null)
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === key
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${paymentMethod === key ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${paymentMethod === key ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                    </button>
                  ))}
                </div>

                {/* ── UPI ── */}
                {paymentMethod === "upi" && (
                  <div className="rounded-xl border border-border bg-secondary/40 mb-5 overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-border/60 bg-secondary/60">
                      <p className="text-sm font-semibold text-foreground">Pay via UPI</p>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Step 1 — UPI ID + QR */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                          <p className="text-sm font-semibold text-foreground">Send payment using the UPI ID or scan the QR code</p>
                        </div>

                        {/* UPI ID copy row */}
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border ml-7">
                          <span className="text-xs text-muted-foreground shrink-0">UPI ID:</span>
                          <code className="flex-1 text-sm font-mono font-bold text-foreground tracking-tight">CXEWANKUSS@YBL</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 h-8 px-3"
                            onClick={() => handleCopy("upi-id", "CXEWANKUSS@YBL")}
                          >
                            {copiedField === "upi-id"
                              ? <Check className="w-4 h-4 text-green-500" />
                              : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>

                        {/* Clickable QR */}
                        <div className="ml-7">
                          <button
                            type="button"
                            onClick={() => setQrModalOpen(true)}
                            className="block mx-auto rounded-xl overflow-hidden border-2 border-border hover:border-primary/60 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ width: "min(200px, 100%)" }}
                            aria-label="Click to enlarge QR code"
                          >
                            <div className="w-full overflow-hidden bg-white" style={{ aspectRatio: "1 / 1" }}>
                              <img
                                src="/upi-qr.jpeg"
                                alt="UPI QR Code — click to enlarge and scan"
                                className="w-full object-cover"
                                style={{ objectPosition: "center 52%", height: "175%" }}
                              />
                            </div>
                          </button>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Click to enlarge — scan with Google Pay, PhonePe, Paytm or BHIM
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">2</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Upload your payment screenshot</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Take a screenshot of the payment confirmation from your UPI app and upload it below.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">3</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Enter your UTR / Transaction ID</p>
                          <p className="text-xs text-muted-foreground mt-0.5">The UTR or transaction reference number is shown in your UPI app after a successful payment.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── E-Rupee ── */}
                {paymentMethod === "erupee" && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-5 space-y-3 text-center">
                    <p className="text-sm font-medium text-foreground">Pay via E-Rupee (Digital Rupee)</p>
                    <div className="bg-white rounded-xl overflow-hidden w-56 mx-auto border border-border">
                      <img src={ERUPEE_QR} alt="E-Rupee QR Code — Reserve Bank of India Digital Rupee for Shahid Bashir" className="w-full h-auto" />
                    </div>
                    <p className="text-xs text-muted-foreground">Scan the QR to pay via E-Rupee. After payment, upload your screenshot below.</p>
                  </div>
                )}

                {/* ── Crypto ── */}
                {paymentMethod === "crypto" && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-5">
                    <p className="text-sm font-medium text-foreground mb-3">Select crypto payment option</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {CRYPTO_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setCryptoOption(opt.key); setCopiedField(null) }}
                          className={`p-3 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                            cryptoOption === opt.key
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border hover:border-primary/50 text-muted-foreground bg-background"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {cryptoOption && (() => {
                      const opt = CRYPTO_OPTIONS.find((o) => o.key === cryptoOption)!
                      return (
                        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Network</span>
                            <span className="text-sm font-bold text-primary">{opt.network}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">
                              {opt.isBinance ? "Binance UID" : "Wallet Address"}
                            </span>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs font-mono text-foreground bg-secondary px-3 py-2 rounded-lg break-all">
                                {opt.address}
                              </code>
                              <Button size="sm" variant="ghost" onClick={() => handleCopy("crypto-addr", opt.address)}>
                                {copiedField === "crypto-addr" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          {opt.isBinance && (
                            <p className="text-xs text-muted-foreground">
                              Send USDT using Binance Pay or internal Binance transfer to this UID.
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Screenshot upload */}
                {paymentMethod && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-2">Payment Screenshot</label>
                    <div
                      onClick={() => screenshotRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        screenshot ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        ref={screenshotRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                      />
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      {screenshot ? (
                        <p className="text-sm text-primary font-medium">{screenshot.name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Click to upload payment screenshot</p>
                      )}
                    </div>
                  </div>
                )}

                {/* UTR — only for UPI */}
                {paymentMethod === "upi" && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-2">UTR / Transaction ID</label>
                    <input
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter UTR or transaction reference number"
                      className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                )}

                <Button
                  onClick={handlePaymentSubmit}
                  disabled={!isPaymentValid()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
                >
                  Submit Payment Proof
                </Button>
              </div>
            )}

            {/* ── STEP: Success ─────────────────────────────────────────── */}
            {flowStep === "success" && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Payment Submitted</h2>
                <p className="text-lg font-semibold text-primary mb-4">Under Review</p>
                <div className="p-6 rounded-xl bg-card border border-border text-left space-y-3 mb-8 max-w-md mx-auto">
                  <p className="text-foreground text-sm font-medium text-center">
                    Your payment is being verified. After successful verification, you will be added and granted access shortly.
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline" className="border-primary/50 hover:bg-primary/10">
                  Back to Mentorship
                </Button>
              </div>
            )}

          </div>
        </main>
      </div>
    )
  }

  // ── Main Page (idle) ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">

        {/* ── Hero / Program Info ───────────────────────────────────────── */}
        <section className="py-16 sm:py-24 border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">SMC & ICT Trading Program</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight text-balance">
              OG KAAL Mentorship —{" "}
              <span className="text-primary">SMC & ICT Trading Program</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl leading-relaxed">
              Learn Smart Money Concepts (SMC) and ICT trading strategies from beginner to advanced with structured classes, live trading examples, and practical market analysis.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {programInfo.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-400 text-sm font-medium">Saturday and Sunday are non-class days.</span>
            </div>
          </div>
        </section>

        {/* ── What You Will Learn ───────────────────────────────────────── */}
        <section className="py-16 sm:py-20 border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-10 text-center">
              What You Will <span className="text-primary">Learn</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {/* SMC Column */}
              <div className="p-6 rounded-2xl bg-card border border-border/60">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ChartCandlestick className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Smart Money Concepts (SMC)</h3>
                </div>
                <ul className="space-y-3">
                  {smcTopics.map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ICT Column */}
              <div className="p-6 rounded-2xl bg-card border border-border/60">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">ICT Concepts</h3>
                </div>
                <ul className="space-y-3">
                  {ictTopics.map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mentorship Programs ───────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-10 text-center">
              Mentorship <span className="text-primary">Programs</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Card 1 — Mentorship 1.0 */}
              <div className="flex flex-col p-7 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground mb-3">
                    Mentorship 1.0 — Basic Program
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    OG KAAL Mentorship — SMC & ICT
                  </h3>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {mentorship1Features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleEnroll("1.0")}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  Enroll in Mentorship 1.0
                </Button>
              </div>

              {/* Card 2 — Mentorship 2.0 */}
              <div className="flex flex-col p-7 rounded-2xl bg-card border-2 border-primary/60 hover:border-primary transition-colors relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold text-primary">2026</span>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary mb-3">
                    Mentorship 2.0 — Upgraded Program
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Advanced mentorship upgrade including everything from Mentorship 1.0 plus additional benefits.
                  </h3>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {mentorship2Features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleEnroll("2.0")}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  Enroll in Mentorship 2.0
                </Button>
              </div>

              {/* Card 3 — Crypto Mentorship */}
              <div className="flex flex-col p-7 rounded-2xl bg-card border border-amber-500/40 hover:border-amber-500/70 transition-colors relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                    <Bitcoin className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">₹20,000</span>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-xs font-semibold text-amber-400 border border-amber-500/20 mb-3">
                    Crypto Mentorship — New Program
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Crypto Mentorship
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Learn cryptocurrency markets, investing strategies, trading methods, and risk management — from spot investing to futures trading.
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {cryptoMentorshipFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-amber-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleEnroll("crypto")}
                  className="w-full bg-amber-500 text-white hover:bg-amber-400 font-bold"
                >
                  Enroll in Crypto Mentorship
                </Button>
              </div>

            </div>
          </div>
        </section>

        {/* ── Crypto Topics ─────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Bitcoin className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Crypto Mentorship — Topics Covered
              </h2>
            </div>
            <p className="text-muted-foreground text-sm mb-8 max-w-2xl leading-relaxed">
              This program teaches the fundamentals of cryptocurrency markets, investing strategies, trading methods, and risk management. Students will learn how crypto markets work, how to analyse price movements, and how to manage both spot investments and futures trading strategies.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cryptoTopics.map((topic, i) => (
                <div key={topic.name} className="flex gap-3 p-4 rounded-xl bg-card border border-border/60 hover:border-amber-500/30 transition-colors">
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[11px] font-bold text-amber-400 shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">{topic.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{topic.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />

      {/* ── QR Zoom Modal ─────────────────────────────────────────────── */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setQrModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="UPI QR Code enlarged view"
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
              aria-label="Close QR code"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            {/* Full QR image — cropped to remove name/phone header */}
            <div className="w-full overflow-hidden bg-white" style={{ aspectRatio: "1 / 1" }}>
              <img
                src="/upi-qr.jpeg"
                alt="UPI QR Code — scan to pay"
                className="w-full object-cover"
                style={{ objectPosition: "center 52%", height: "175%" }}
              />
            </div>

            {/* UPI ID below */}
            <div className="px-5 py-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-1">UPI ID</p>
              <p className="font-mono text-base font-bold text-gray-900 tracking-tight">CXEWANKUSS@YBL</p>
              <p className="text-xs text-gray-400 mt-2">Scan using Google Pay, PhonePe, Paytm, BHIM or any UPI app</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
