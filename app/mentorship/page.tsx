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

const PAYMENT_DETAILS = {
  upiId: "cxewankuss@ybl",
  upiQrCodeUrl:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/paytm-uNxomWsKUWCUbHXNJTECcGuJiEsvB9.jpg",
  imps: {
    accountNumber: "259541281829",
    ifsc: "INDB0000136",
    bankName: "Indusind Bank",
    accountHolder: "Shahid Bashir",
  },
}

const CRYPTO_OPTIONS = [
  {
    key: "binance",
    label: "Binance ID",
    network: "Binance",
    address: "1125271626",
    isBinance: true,
  },
  {
    key: "bep20",
    label: "USDT BEP20",
    network: "BEP20",
    address: "0xa1540bccbe530fcc92a2b31db5795394053fdad7",
    isBinance: false,
  },
  {
    key: "trc20",
    label: "USDT TRC20",
    network: "TRC20",
    address: "TF7gytsAtFPM9f2RQPyiFphd8pasiZ1WQF",
    isBinance: false,
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

// ─── Types ───────────────────────────────────────────────────────────────────

type ProgramType = "1.0" | "2.0" | null
type FlowStep = "idle" | "contact" | "payment" | "success"
type PaymentMethod = "imps" | "upi" | "crypto" | null

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
    return !!utr
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
                <span className="text-xs font-semibold text-primary">Mentorship {selectedProgram}</span>
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
                    { key: "imps", label: "IMPS", icon: CreditCard },
                    { key: "upi", label: "UPI", icon: QrCode },
                    { key: "crypto", label: "Crypto", icon: Bitcoin },
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

                {/* ── IMPS ── */}
                {paymentMethod === "imps" && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-5 space-y-3">
                    <p className="text-sm font-medium text-foreground mb-1">Bank Transfer Details (IMPS/NEFT)</p>
                    {[
                      { key: "holder", label: "Account Holder", value: PAYMENT_DETAILS.imps.accountHolder },
                      { key: "acc", label: "Account Number", value: PAYMENT_DETAILS.imps.accountNumber, mono: true },
                      { key: "ifsc", label: "IFSC Code", value: PAYMENT_DETAILS.imps.ifsc, mono: true },
                      { key: "bank", label: "Bank Name", value: PAYMENT_DETAILS.imps.bankName },
                    ].map(({ key, label, value, mono }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div>
                          <span className="text-xs text-muted-foreground block">{label}</span>
                          <span className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(key, value)}
                        >
                          {copiedField === key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── UPI ── */}
                {paymentMethod === "upi" && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-5 space-y-4">
                    <div className="bg-white rounded-xl overflow-hidden w-56 mx-auto">
                      <img
                        src={PAYMENT_DETAILS.upiQrCodeUrl}
                        alt="UPI QR Code"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div>
                        <span className="text-xs text-muted-foreground block">UPI ID</span>
                        <span className="font-mono text-sm font-medium text-foreground">{PAYMENT_DETAILS.upiId}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy("upi", PAYMENT_DETAILS.upiId)}>
                        {copiedField === "upi" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
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

                {/* UTR — only for IMPS and UPI */}
                {(paymentMethod === "imps" || paymentMethod === "upi") && (
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
                <h2 className="text-2xl font-bold text-foreground mb-4">Request Submitted!</h2>
                <div className="p-6 rounded-xl bg-card border border-border text-left space-y-3 mb-8 max-w-md mx-auto">
                  <p className="text-foreground text-sm font-medium text-center">Your request is under review.</p>
                  <p className="text-muted-foreground text-sm text-center">
                    You will be added to the mentorship group soon.
                  </p>
                  <p className="text-muted-foreground text-sm text-center">
                    You will be notified via your phone number and WhatsApp.
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-10 text-center">
              Mentorship <span className="text-primary">Programs</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">

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

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
