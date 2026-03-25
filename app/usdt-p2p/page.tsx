"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NoticeTicker } from "@/components/notice-ticker"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  User, 
  CreditCard, 
  Wallet, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Upload,
  ExternalLink,
  Send,
  QrCode,
  Receipt,
  FileCheck,
  HelpCircle,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { saveSubmission } from "@/lib/admin-submissions"
import { UsdtHelpModal } from "@/components/usdt-help-modal"
import { Clock, History } from "lucide-react"

const TELEGRAM_LINK = "https://t.me/ogkaaltrader"

type PaymentMethod = "upi" | "imps" | "erupee"
type Network = "trc20" | "bep20" | "binance"

interface FormData {
  // Step 1 - User Details
  fullName: string
  email: string
  phone: string
  usdtAmount: string
  // Step 2 - Payment Info (read-only display)
  paymentMethod: PaymentMethod | ""
  // Step 3 - Payment Confirmation
  paymentScreenshot: File | null
  utrNumber: string
  // Step 4 - Identity Verification
  governmentId: File | null
  selfie: File | null
  // Step 5 - Wallet Details
  walletAddress: string
  network: Network | ""
}

// Payment details
const PAYMENT_DETAILS = {
  upiId: "cxewankuss@ybl",
  upiQrCodeUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/paytm-uNxomWsKUWCUbHXNJTECcGuJiEsvB9.jpg",
  erupeeQrCodeUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/qr-YXgnZr1z6VbDW8poxN1mnzBILfT73j.jpg",
  imps: {
    accountNumber: "259541281829",
    ifsc: "INDB0000136",
    bankName: "Indusind Bank",
    accountHolder: "Shahid Bashir"
  }
}

type HistoryRecord = {
  id: string
  userId: string
  name: string
  amountUsdt?: string
  usdtAmount?: string
  status: string
  createdAt: string
  type: "buy" | "sell"
}

export default function UsdtP2PPage() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell" | "history">("buy")
  const [step, setStep] = useState(0) // 0 = info, 1-5 = form steps
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpMode, setHelpMode] = useState<"buy" | "sell">("buy")

  // Live simulated exchange rate — range ₹105–₹120, updates every 15 min by ±₹2
  // Start with a fixed value (0 = not yet mounted) to avoid SSR/client mismatch
  // from Math.random(), then set the real value after first mount.
  const [exchangeRate, setExchangeRate] = useState<number>(0)
  const [rateFlash, setRateFlash] = useState(false)
  const [mounted, setMounted] = useState(false)

  // p2pRate is always exchangeRate − 5, clamped to ₹100–₹115
  const p2pRate = Math.min(115, Math.max(100, exchangeRate - 5))

  useEffect(() => {
    // Set initial random rate only on client after mount
    setExchangeRate(Math.floor(Math.random() * 16) + 105)
    setMounted(true)

    const FIFTEEN_MINUTES = 15 * 60 * 1000
    const id = setInterval(() => {
      setExchangeRate(prev => {
        const delta = Math.random() < 0.5 ? -2 : 2
        const next  = Math.min(120, Math.max(105, prev + delta))
        return next
      })
      setRateFlash(true)
      setTimeout(() => setRateFlash(false), 600)
    }, FIFTEEN_MINUTES)
    return () => clearInterval(id)
  }, [])

  // History state
  const [historyRecords, setHistoryRecords]       = useState<HistoryRecord[]>([])
  const [historyLoading, setHistoryLoading]       = useState(false)
  const [historyTab, setHistoryTab]               = useState<"pending" | "completed" | "cancelled">("pending")

  useEffect(() => {
    if (activeTab !== "history") return
    setHistoryLoading(true)
    Promise.all([
      fetch("/api/admin/usdt-buy").then(r => r.json()).catch(() => ({ ok: false })),
      fetch("/api/admin/usdt-sell").then(r => r.json()).catch(() => ({ ok: false })),
    ]).then(([buyRes, sellRes]) => {
      const buys:  HistoryRecord[] = (buyRes.ok  ? buyRes.data  ?? [] : []).map((r: HistoryRecord) => ({ ...r, type: "buy"  as const }))
      const sells: HistoryRecord[] = (sellRes.ok ? sellRes.data ?? [] : []).map((r: HistoryRecord) => ({ ...r, type: "sell" as const }))
      const all = [...buys, ...sells].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setHistoryRecords(all)
    }).finally(() => setHistoryLoading(false))
  }, [activeTab])
  const [sellUsdtAmount, setSellUsdtAmount] = useState("")
  const [copiedUpi, setCopiedUpi] = useState(false)
  
  // Sell flow state: -1 = info/CTA, 0 = method selection, 1 = kaal form, 2 = success
  const [sellStep, setSellStep] = useState(-1)
  const [sellFormData, setSellFormData] = useState({
    // Payment method selection (where user wants to receive payment)
    paymentMethodType: "" as "upi" | "imps" | "gpay" | "",
    // UPI details
    upiId: "",
    // IMPS details
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountHolderName: "",
    // Google Pay
    gpayNumber: "",
    // Common fields
    name: "",
    phone: "",
    telegram: "",
    screenshot: null as File | null,
  })
  const sellScreenshotRef = useRef<HTMLInputElement>(null)

  const BINANCE_P2P_LINK = "https://www.binance.com/en/p2p"

  // Network-specific KAAL P2P destinations
  const KAAL_WALLETS = {
    bep20:    { label: "BSC (BEP-20)",    address: "0xa1540bccbe530fcc92a2b31db5795394053fdad7", copyLabel: "Copy Address" },
    trc20:    { label: "TRON (TRC-20)",   address: "TF7gytsAtFPM9f2RQPyiFphd8pasiZ1WQF",        copyLabel: "Copy Address" },
    binance:  { label: "Binance ID",      address: "1125271626",                                  copyLabel: "Copy ID"      },
  } as const

  const [sellNetwork, setSellNetwork] = useState<"bep20" | "trc20" | "binance" | "">("")
  const [copiedNetwork, setCopiedNetwork] = useState(false)

  const handleCopyNetworkAddress = () => {
    if (!sellNetwork) return
    navigator.clipboard.writeText(KAAL_WALLETS[sellNetwork].address)
    setCopiedNetwork(true)
    setTimeout(() => setCopiedNetwork(false), 2000)
  }

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    usdtAmount: "",
    paymentMethod: "",
    paymentScreenshot: null,
    utrNumber: "",
    governmentId: null,
    selfie: null,
    walletAddress: "",
    network: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const paymentScreenshotRef = useRef<HTMLInputElement>(null)
  const governmentIdRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: "paymentScreenshot" | "governmentId" | "selfie", file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }

  const copyUpiId = () => {
    navigator.clipboard.writeText(PAYMENT_DETAILS.upiId)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Save submission to admin dashboard
    await saveSubmission({
      type: "usdt_p2p",
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      details: {
        action: "buy",
        amount: `${formData.usdtAmount} USDT`,
        paymentMethod: formData.paymentMethod,
        utrNumber: formData.utrNumber,
        network: formData.network,
        walletAddress: formData.walletAddress
      }
    })
    
    setIsSubmitting(false)
    setIsComplete(true)
  }

  // Calculate payment amount — always uses live p2pRate
  const usdtAmount  = Number(formData.usdtAmount) || 0
  const totalAmount = usdtAmount * p2pRate

  // Validation for each step
  const canProceedStep1 = formData.fullName && formData.email && formData.phone && formData.usdtAmount
  const canProceedStep2 = formData.paymentMethod // User must select a payment method
  const canProceedStep3 = formData.paymentScreenshot && formData.utrNumber
  const canProceedStep4 = formData.governmentId && formData.selfie
  const canProceedStep5 = formData.walletAddress && formData.network

  // Sell USDT — fixed pricing: ₹90 below 50 USDT, ₹93–₹95 for 50+ USDT (max ₹95)
  const sellAmount   = Number(sellUsdtAmount) || 0
  const SELL_RATE_SMALL = 90                                    // below 50 USDT
  const SELL_RATE_LARGE = Math.min(95, Math.max(93, p2pRate - 20)) // 50+ USDT: ₹93–₹95
  const sellRate     = sellAmount > 0 && sellAmount < 50 ? SELL_RATE_SMALL : SELL_RATE_LARGE
  const sellTotalINR = sellAmount * sellRate

  // Step labels for progress indicator
  const stepLabels = [
    { icon: User, label: "Details" },
    { icon: QrCode, label: "Payment" },
    { icon: Receipt, label: "Confirm" },
    { icon: FileCheck, label: "Verify" },
    { icon: CheckCircle, label: "Complete" },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <NoticeTicker />

      <main className="flex-1 mt-20">
        {/* Hero Section */}
        <section className="pt-12 pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Verified & Secure</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
                SAFE <span className="text-primary">USDT P2P</span> EXCHANGE
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                I provide safe funds and I am a tax payer. USDT prices may fluctuate depending on market demand and supply. 
                When demand is high, the price may increase. When supply is high, the price may decrease.
              </p>
            </div>

            {/* Buy/Sell/History Tabs */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex rounded-xl bg-secondary p-1">
                <button
                  onClick={() => { setActiveTab("buy"); setStep(0); setIsComplete(false); }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === "buy"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buy USDT
                </button>
                <button
                  onClick={() => { setActiveTab("sell"); setStep(0); setIsComplete(false); }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === "sell"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sell USDT
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "history"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </div>
            </div>

            {/* History Card — shown directly below tab bar when History tab is active */}
            {activeTab === "history" && (
              <div className="max-w-2xl mx-auto mb-12">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  {/* Card header */}
                  <div className="flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
                  </div>

                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : historyRecords.length === 0 ? (
                    /* No data at all */
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                        <History className="w-7 h-7 text-muted-foreground/50" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-base font-bold text-foreground">No Trade History Yet</p>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                          Your completed and pending USDT transactions will appear here once you make a trade.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Sub-tabs with colored dots */}
                      <div className="flex gap-1 p-1 rounded-xl bg-secondary/60 border border-border mb-5">
                        {(["pending", "completed", "cancelled"] as const).map(tab => {
                          const count = tab === "pending"
                            ? historyRecords.filter(r => ["pending","accepted","processing"].includes(r.status)).length
                            : tab === "completed"
                            ? historyRecords.filter(r => ["completed","approved"].includes(r.status)).length
                            : historyRecords.filter(r => ["cancelled","rejected"].includes(r.status)).length
                          const dotColor = tab === "pending" ? "bg-amber-400" : tab === "completed" ? "bg-emerald-400" : "bg-red-400"
                          return (
                            <button
                              key={tab}
                              onClick={() => setHistoryTab(tab)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${historyTab === tab ? "bg-background text-foreground border border-border shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                              <span className="capitalize">{tab}</span>
                              <span className="text-xs font-bold text-muted-foreground">({count})</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Per-tab records */}
                      {(() => {
                        const filtered = historyRecords.filter(r => {
                          if (historyTab === "pending")   return ["pending","accepted","processing"].includes(r.status)
                          if (historyTab === "completed") return ["completed","approved"].includes(r.status)
                          return ["cancelled","rejected"].includes(r.status)
                        })
                        const statusColor: Record<string, string> = {
                          pending:    "bg-amber-500/10 text-amber-400 border-amber-500/30",
                          accepted:   "bg-blue-500/10 text-blue-400 border-blue-500/30",
                          processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                          completed:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                          approved:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                          cancelled:  "bg-red-500/10 text-red-400 border-red-500/30",
                          rejected:   "bg-red-500/10 text-red-400 border-red-500/30",
                        }
                        if (filtered.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-secondary/30 border border-border gap-2">
                              <Clock className="w-8 h-8 text-muted-foreground/40" />
                              <p className="text-sm font-medium text-muted-foreground">No {historyTab} transactions</p>
                            </div>
                          )
                        }
                        return (
                          <div className="rounded-xl border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border bg-secondary/40">
                                    {["Name","Amount","Type","Status","Date"].map(h => (
                                      <th key={h} className="text-left py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {filtered.map((r, i) => {
                                    const d = new Date(r.createdAt)
                                    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                    const amount = r.type === "buy" ? (r.amountUsdt ?? "—") : (r.usdtAmount ?? "—")
                                    return (
                                      <tr key={r.id} className={`border-b border-border/40 hover:bg-secondary/20 transition-colors ${i % 2 !== 0 ? "bg-secondary/10" : ""}`}>
                                        <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">{r.name || "—"}</td>
                                        <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">{amount} USDT</td>
                                        <td className="py-2.5 px-3">
                                          <span className={`inline-flex px-2 py-0.5 rounded border font-medium ${r.type === "buy" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}>
                                            {r.type === "buy" ? "Buy" : "Sell"}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <span className={`inline-flex px-2 py-0.5 rounded border font-medium capitalize ${statusColor[r.status] ?? "bg-secondary text-foreground border-border"}`}>
                                            {r.status}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{date}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      })()}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Buy USDT Section */}
            {activeTab === "buy" && (
              <>
                {/* Rate Display */}
                <div className="max-w-2xl mx-auto mb-12">
                  <div className="p-6 rounded-2xl bg-card border border-border">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Live USDT Buy Rates</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-secondary/50 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Other Exchange USDT Rate</p>
                        {mounted ? (
                          <p
                            className="text-2xl font-bold text-foreground transition-all duration-500"
                            style={{ opacity: rateFlash ? 0.3 : 1, transform: rateFlash ? "scale(0.95)" : "scale(1)" }}
                          >
                            ₹{exchangeRate}
                          </p>
                        ) : (
                          <div className="h-8 w-16 mx-auto rounded bg-secondary animate-pulse" />
                        )}
                      </div>
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                        <p className="text-sm text-primary mb-1">Your P2P Rate</p>
                        {mounted ? (
                          <p
                            className="text-2xl font-bold text-primary transition-all duration-500"
                            style={{ opacity: rateFlash ? 0.3 : 1, transform: rateFlash ? "scale(0.95)" : "scale(1)" }}
                          >
                            ₹{p2pRate}
                          </p>
                        ) : (
                          <div className="h-8 w-16 mx-auto rounded bg-primary/20 animate-pulse" />
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <p className="text-sm text-muted-foreground text-center mb-3">
                        Our rates include tax, transaction cost, and margin.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <span className="text-sm font-medium">Minimum Order:</span>
                        <span className="font-bold">50 USDT</span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200">
                          If someone buys below 50 USDT, the rate increases to <strong>₹115 – ₹120 per USDT</strong> due to taxes and transaction fees.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button or Form */}
                {step === 0 && !isComplete && (
                  <div className="flex flex-col items-center gap-3">
                    <Button
                      onClick={() => setStep(1)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6"
                    >
                      Buy USDT Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <button
                      onClick={() => { setHelpMode("buy"); setHelpOpen(true) }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help / Support
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Sell USDT Section */}
            {activeTab === "sell" && (
              <div className="max-w-2xl mx-auto">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Sell USDT</h3>
                    </div>
                    <button
                      onClick={() => { setHelpMode("sell"); setHelpOpen(true) }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Help
                    </button>
                  </div>

                  {/* Pricing Tiers Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-xl border text-center transition-colors ${
                      sellAmount > 0 && sellAmount < 50 
                        ? "bg-primary/10 border-primary/50" 
                        : "bg-secondary/50 border-border"
                    }`}>
                      <p className="text-sm text-muted-foreground mb-1">Below 50 USDT</p>
                      <p className={`text-2xl font-bold ${
                        sellAmount > 0 && sellAmount < 50 ? "text-primary" : "text-foreground"
                      }`}>₹90 <span className="text-sm font-normal">per USDT</span></p>
                    </div>
                    <div className={`p-4 rounded-xl border text-center transition-colors ${
                      sellAmount >= 50 
                        ? "bg-primary/10 border-primary/50" 
                        : "bg-secondary/50 border-border"
                    }`}>
                      <p className="text-sm text-muted-foreground mb-1">50 USDT or Above</p>
                      <p className={`text-2xl font-bold ${
                        sellAmount >= 50 ? "text-primary" : "text-foreground"
                      }`}>₹93 – ₹95 <span className="text-sm font-normal">per USDT</span></p>
                    </div>
                  </div>

                  {/* USDT Amount Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">Enter USDT Amount</label>
                    <input
                      type="number"
                      value={sellUsdtAmount}
                      onChange={(e) => setSellUsdtAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
                      placeholder="Enter amount of USDT to sell"
                      min="1"
                    />
                  </div>

                  {/* Rate Message */}
                  {sellAmount > 0 && (
                    <div className={`p-4 rounded-xl mb-6 ${
                      sellAmount < 50 
                        ? "bg-amber-500/10 border border-amber-500/30" 
                        : "bg-green-500/10 border border-green-500/30"
                    }`}>
                      <div className="flex items-start gap-3">
                        {sellAmount < 50 ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200">
                              Small trade rate will apply because the amount is below 50 USDT.
                            </p>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-green-200">
                              Standard market rate will apply for 50 USDT or above.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Calculation Results */}
                  {sellAmount > 0 && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">USDT Amount:</span>
                          <span className="text-foreground font-medium">{sellAmount} USDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Sell Rate:</span>
                          <span className="text-foreground font-medium">₹{sellRate} per USDT</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-border">
                          <span className="font-semibold text-foreground">Estimated INR:</span>
                          <span className="text-2xl font-bold text-primary">₹{sellTotalINR.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transparency Note */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border mb-6">
                    <p className="text-xs text-muted-foreground text-center">
                      Smaller trades may have a slightly lower rate due to transaction fees, GST, and processing costs.
                    </p>
                  </div>

                  {/* Sell USDT Now CTA — initial state */}
                  {sellStep === -1 && (
                    <div className="flex flex-col items-center gap-3">
                      <Button
                        onClick={() => setSellStep(0)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6"
                      >
                        Sell USDT Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <button
                        onClick={() => { setHelpMode("sell"); setHelpOpen(true) }}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Help / Support
                      </button>
                    </div>
                  )}

                  {/* Method Selection */}
                  {sellStep === 0 && (
                    <div>
                      <h4 className="text-center text-sm font-medium text-foreground mb-4">Choose Sell Method</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                          asChild
                          variant="outline"
                          className="h-auto py-4 px-6 border-border hover:border-primary/50 hover:bg-primary/5"
                        >
                          <a href={BINANCE_P2P_LINK} target="_blank" rel="noopener noreferrer">
                            <div className="flex flex-col items-center gap-2">
                              <ExternalLink className="w-6 h-6 text-primary" />
                              <span className="font-semibold text-foreground">Binance P2P</span>
                              <span className="text-xs text-muted-foreground">Sell on Binance</span>
                            </div>
                          </a>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setSellStep(1)}
                          className="h-auto py-4 px-6 border-border hover:border-primary/50 hover:bg-primary/5"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Wallet className="w-6 h-6 text-primary" />
                            <span className="font-semibold text-foreground">KAAL P2P</span>
                            <span className="text-xs text-muted-foreground">Direct transfer</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* KAAL P2P Form */}
                  {sellStep === 1 && (
                    <div>
                      <Button
                        variant="ghost"
                        onClick={() => setSellStep(0)}
                        className="mb-4 text-muted-foreground"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to methods
                      </Button>

                      <h4 className="text-lg font-semibold text-foreground mb-6">KAAL P2P - Sell USDT</h4>

                      {/* Step 1 — Network selection */}
                      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                          <h5 className="font-semibold text-foreground">Select network and send USDT</h5>
                        </div>

                        {/* Network picker */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {(["bep20", "trc20", "binance"] as const).map(net => (
                            <button
                              key={net}
                              type="button"
                              onClick={() => setSellNetwork(net)}
                              className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                                sellNetwork === net
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border text-foreground hover:border-primary/50"
                              }`}
                            >
                              {KAAL_WALLETS[net].label}
                            </button>
                          ))}
                        </div>

                        {/* Address display */}
                        {sellNetwork ? (
                          <div className="space-y-2">
                            <div className="p-3 rounded-lg bg-background border border-border flex items-start justify-between gap-3">
                              <p className="text-sm font-mono text-foreground break-all">{KAAL_WALLETS[sellNetwork].address}</p>
                              <button
                                onClick={handleCopyNetworkAddress}
                                className="shrink-0 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                              >
                                {copiedNetwork ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedNetwork ? "Copied!" : KAAL_WALLETS[sellNetwork].copyLabel}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Only send via <span className="text-foreground font-medium">{KAAL_WALLETS[sellNetwork].label}</span>. Sending on wrong network will result in permanent loss.
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">Select a network above to see the destination address.</p>
                        )}
                      </div>

                      {/* Step 2 */}
                      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                          <h5 className="font-semibold text-foreground">Upload transaction screenshot</h5>
                        </div>
                        <input
                          type="file"
                          ref={sellScreenshotRef}
                          accept="image/*"
                          onChange={(e) => setSellFormData(prev => ({ ...prev, screenshot: e.target.files?.[0] || null }))}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => sellScreenshotRef.current?.click()}
                          className="w-full justify-center border-dashed border-border hover:border-primary/50"
                        >
                          {sellFormData.screenshot ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-500" />
                              {sellFormData.screenshot.name}
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Screenshot
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Step 3 - Payment Method Selection */}
                      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                          <h5 className="font-semibold text-foreground">Where do you want to receive payment?</h5>
                        </div>
                        
                        {/* Payment Method Type Selection */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { value: "upi", label: "UPI" },
                            { value: "imps", label: "IMPS/Bank" },
                            { value: "gpay", label: "Google Pay" },
                          ].map((method) => (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => setSellFormData(prev => ({ ...prev, paymentMethodType: method.value as "upi" | "imps" | "gpay" }))}
                              className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                                sellFormData.paymentMethodType === method.value
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border text-foreground hover:border-primary/50"
                              }`}
                            >
                              {method.label}
                            </button>
                          ))}
                        </div>

                        {/* UPI Details */}
                        {sellFormData.paymentMethodType === "upi" && (
                          <div className="space-y-4 p-4 rounded-xl bg-background border border-border">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">UPI ID</label>
                              <input
                                type="text"
                                value={sellFormData.upiId}
                                onChange={(e) => setSellFormData(prev => ({ ...prev, upiId: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="e.g., yourname@upi"
                              />
                            </div>
                          </div>
                        )}

                        {/* IMPS/Bank Details */}
                        {sellFormData.paymentMethodType === "imps" && (
                          <div className="space-y-4 p-4 rounded-xl bg-background border border-border">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Account Holder Name</label>
                              <input
                                type="text"
                                value={sellFormData.accountHolderName}
                                onChange={(e) => setSellFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Enter account holder name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Account Number</label>
                              <input
                                type="text"
                                value={sellFormData.accountNumber}
                                onChange={(e) => setSellFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Enter account number"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">IFSC Code</label>
                              <input
                                type="text"
                                value={sellFormData.ifscCode}
                                onChange={(e) => setSellFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="e.g., SBIN0001234"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Bank Name</label>
                              <input
                                type="text"
                                value={sellFormData.bankName}
                                onChange={(e) => setSellFormData(prev => ({ ...prev, bankName: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Enter bank name"
                              />
                            </div>
                          </div>
                        )}

                        {/* Google Pay Details */}
                        {sellFormData.paymentMethodType === "gpay" && (
                          <div className="space-y-4 p-4 rounded-xl bg-background border border-border">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Google Pay Number</label>
                              <input
                                type="tel"
                                value={sellFormData.gpayNumber}
                                onChange={(e) => setSellFormData(prev => ({ ...prev, gpayNumber: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Enter your Google Pay number"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step 4 - Contact Details */}
                      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
                          <h5 className="font-semibold text-foreground">Contact Details</h5>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                            <input
                              type="text"
                              value={sellFormData.name}
                              onChange={(e) => setSellFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                            <input
                              type="tel"
                              value={sellFormData.phone}
                              onChange={(e) => setSellFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="Enter your phone number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Telegram Username</label>
                            <input
                              type="text"
                              value={sellFormData.telegram}
                              onChange={(e) => setSellFormData(prev => ({ ...prev, telegram: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="@yourusername"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={async () => {
                          // Derive UPI ID and UPI Name from selected payment method
                          const upiId = sellFormData.paymentMethodType === "upi"
                            ? sellFormData.upiId
                            : sellFormData.paymentMethodType === "gpay"
                            ? sellFormData.gpayNumber
                            : ""
                          const upiName = sellFormData.paymentMethodType === "upi"
                            ? sellFormData.upiId
                            : sellFormData.paymentMethodType === "imps"
                            ? sellFormData.accountHolderName
                            : sellFormData.gpayNumber

                          // Save to usdt_sell_requests table directly (returns id)
                          let requestId = "N/A"
                          try {
                            const sellRes = await fetch("/api/admin/usdt-sell", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                name:               sellFormData.name || "Sell Request",
                                phone:              sellFormData.phone,
                                telegram:           sellFormData.telegram,
                                usdtAmount:         `${sellAmount}`,
                                upiId,
                                upiName,
                                paymentMethodType:  sellFormData.paymentMethodType,
                                walletAddress:      sellNetwork ? KAAL_WALLETS[sellNetwork as keyof typeof KAAL_WALLETS].address : "",
                              }),
                            })
                            const sellJson = await sellRes.json()
                            if (sellJson.ok && sellJson.id) {
                              requestId = String(sellJson.id).slice(0, 8).toUpperCase()
                            }
                          } catch { /* silent */ }

                          // Also save to admin_submissions + fire Telegram notification
                          await saveSubmission({
                            type: "usdt_p2p",
                            name: sellFormData.name || "Sell Request",
                            telegram: sellFormData.telegram,
                            phone: sellFormData.phone,
                            details: {
                              action: "sell",
                              amount: `${sellAmount} USDT`,
                              rate: `₹${sellRate} per USDT`,
                              network: sellNetwork ? KAAL_WALLETS[sellNetwork as keyof typeof KAAL_WALLETS].label : "",
                              upiId,
                              upiName,
                              accountHolderName: sellFormData.accountHolderName,
                              requestId,
                              paymentMethodType: sellFormData.paymentMethodType,
                            }
                          })
                          setSellStep(2)
                        }}
                        disabled={
                          !sellNetwork ||
                          !sellFormData.screenshot ||
                          !sellFormData.name ||
                          !sellFormData.phone || 
                          !sellFormData.telegram ||
                          !sellFormData.paymentMethodType ||
                          (sellFormData.paymentMethodType === "upi" && !sellFormData.upiId) ||
                          (sellFormData.paymentMethodType === "imps" && (!sellFormData.accountNumber || !sellFormData.ifscCode || !sellFormData.bankName || !sellFormData.accountHolderName)) ||
                          (sellFormData.paymentMethodType === "gpay" && !sellFormData.gpayNumber)
                        }
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
                      >
                        Submit Sell Request
                        <Send className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Success State */}
                  {sellStep === 2 && (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h4 className="text-2xl font-bold text-foreground mb-3">Request Received!</h4>
                      <p className="text-muted-foreground mb-6">
                        Your request has been received.<br />
                        Payment will be processed within 30 minutes.
                      </p>

                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-200 text-left">
                            If payment is not received within 30 minutes, please contact on Telegram using the link below.
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8"
                      >
                        <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
                          Contact on Telegram
                          <ExternalLink className="w-5 h-5 ml-2" />
                        </a>
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSellStep(-1)
                          setSellNetwork("")
                          setSellFormData({ paymentMethodType: "", upiId: "", accountNumber: "", ifscCode: "", bankName: "", accountHolderName: "", gpayNumber: "", name: "", phone: "", telegram: "", screenshot: null })
                          setSellUsdtAmount("")
                        }}
                        className="mt-4 text-muted-foreground"
                      >
                        Start New Request
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Multi-Step Form (Buy) - 5 Steps */}
            {activeTab === "buy" && step > 0 && !isComplete && (
              <div className="max-w-2xl mx-auto">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
                  {stepLabels.map((s, index) => {
                    const stepNum = index + 1
                    const Icon = s.icon
                    return (
                      <div key={stepNum} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              step >= stepNum 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {step > stepNum ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </div>
                          <span className={`text-xs font-medium ${step >= stepNum ? "text-primary" : "text-muted-foreground"}`}>
                            {s.label}
                          </span>
                        </div>
                        {stepNum < 5 && (
                          <div className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 rounded ${step > stepNum ? "bg-primary" : "bg-secondary"}`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
                  {/* Step 1 - User Details */}
                  {step === 1 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">User Details</h3>
                          <p className="text-sm text-muted-foreground">Enter your personal information and USDT amount</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Amount of USDT to Buy</label>
                          <input
                            type="number"
                            value={formData.usdtAmount}
                            onChange={(e) => handleInputChange("usdtAmount", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter amount (min 50 USDT recommended)"
                            min="1"
                          />
                          {formData.usdtAmount && Number(formData.usdtAmount) < 50 && (
                            <p className="text-amber-500 text-sm mt-2">
                              Orders below 50 USDT will be charged at ₹115-₹120 per USDT
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between mt-8">
                        <Button
                          variant="ghost"
                          onClick={() => setStep(0)}
                          className="text-muted-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          onClick={() => setStep(2)}
                          disabled={!canProceedStep1}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Next Step
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2 - Payment Instructions */}
                  {step === 2 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Payment Instructions</h3>
                          <p className="text-sm text-muted-foreground">Complete payment using the details below</p>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 mb-6">
                        <h4 className="font-semibold text-foreground mb-3">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">USDT Amount:</span>
                            <span className="text-foreground font-medium">{formData.usdtAmount} USDT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">P2P Rate:</span>
                            <span className="text-foreground font-medium">₹{p2pRate} per USDT</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border">
                            <span className="font-semibold text-foreground">Total to Pay:</span>
                            <span className="text-xl font-bold text-primary">₹{totalAmount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-foreground mb-3">Select Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: "upi", label: "UPI" },
                            { value: "imps", label: "IMPS" },
                            { value: "erupee", label: "e-Rupee" },
                          ].map((method) => (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => handleInputChange("paymentMethod", method.value)}
                              className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                                formData.paymentMethod === method.value
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-secondary border-border text-foreground hover:border-primary/50"
                              }`}
                            >
                              {method.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Payment Details */}
                      {formData.paymentMethod && (
                        <div className="space-y-4">
                          {/* QR Code - Only for UPI and e-Rupee, NOT for IMPS */}
                          {(formData.paymentMethod === "upi" || formData.paymentMethod === "erupee") && (
                            <div className="p-6 rounded-xl bg-secondary/50 border border-border text-center">
                              <p className="text-sm text-muted-foreground mb-4">
                                {formData.paymentMethod === "erupee" 
                                  ? "Scan QR Code to Pay via Digital Rupee" 
                                  : "Scan QR Code to Pay via UPI"}
                              </p>
                              <div className="w-64 mx-auto bg-white rounded-xl overflow-hidden mb-4">
                                <img 
                                  src={formData.paymentMethod === "erupee" 
                                    ? PAYMENT_DETAILS.erupeeQrCodeUrl 
                                    : PAYMENT_DETAILS.upiQrCodeUrl}
                                  alt={formData.paymentMethod === "erupee" ? "e-Rupee QR Code" : "UPI QR Code"}
                                  className="w-full h-auto"
                                />
                              </div>
                              <p className="text-sm font-medium text-foreground">Amount: ₹{totalAmount.toLocaleString()}</p>
                            </div>
                          )}

                          {/* UPI ID - Show for UPI */}
                          {formData.paymentMethod === "upi" && (
                            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                              <p className="text-sm text-muted-foreground mb-2">Or pay to UPI ID:</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 p-3 rounded-lg bg-background border border-border font-mono text-sm text-foreground">
                                  {PAYMENT_DETAILS.upiId}
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={copyUpiId}
                                  className="shrink-0"
                                >
                                  {copiedUpi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* IMPS Bank Details - Show for IMPS */}
                          {formData.paymentMethod === "imps" && (
                            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                              <div className="flex justify-between items-center mb-3">
                                <p className="text-sm text-muted-foreground">Bank Transfer Details (IMPS/NEFT):</p>
                                <p className="text-sm font-medium text-primary">Amount: ₹{totalAmount.toLocaleString()}</p>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Account Holder</span>
                                    <span className="font-medium text-foreground">{PAYMENT_DETAILS.imps.accountHolder}</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(PAYMENT_DETAILS.imps.accountHolder)
                                    }}
                                    className="shrink-0"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Account Number</span>
                                    <span className="font-mono font-medium text-foreground">{PAYMENT_DETAILS.imps.accountNumber}</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(PAYMENT_DETAILS.imps.accountNumber)
                                    }}
                                    className="shrink-0"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                                  <div>
                                    <span className="text-xs text-muted-foreground block">IFSC Code</span>
                                    <span className="font-mono font-medium text-foreground">{PAYMENT_DETAILS.imps.ifsc}</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(PAYMENT_DETAILS.imps.ifsc)
                                    }}
                                    className="shrink-0"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Bank Name</span>
                                    <span className="font-medium text-foreground">{PAYMENT_DETAILS.imps.bankName}</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(PAYMENT_DETAILS.imps.bankName)
                                    }}
                                    className="shrink-0"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Important Note */}
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-sm text-amber-200">
                                {formData.paymentMethod === "erupee"
                                  ? "Complete the payment using the Digital Rupee QR code above. After payment, you will need to upload proof in the next step."
                                  : formData.paymentMethod === "imps"
                                  ? "Complete the bank transfer using the account details above. After payment, you will need to upload proof in the next step."
                                  : "Complete the payment using the QR code or UPI ID above. After payment, you will need to upload proof in the next step."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between mt-8">
                        <Button
                          variant="ghost"
                          onClick={() => setStep(1)}
                          className="text-muted-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          onClick={() => setStep(3)}
                          disabled={!canProceedStep2}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          I Have Paid
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 - Payment Confirmation */}
                  {step === 3 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Payment Confirmation</h3>
                          <p className="text-sm text-muted-foreground">Upload proof of payment</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Payment Screenshot Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Upload Payment Screenshot</label>
                          <input
                            ref={paymentScreenshotRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange("paymentScreenshot", e.target.files?.[0] || null)}
                          />
                          <button
                            type="button"
                            onClick={() => paymentScreenshotRef.current?.click()}
                            className={`w-full p-6 rounded-xl border-2 border-dashed transition-colors ${
                              formData.paymentScreenshot
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {formData.paymentScreenshot ? (
                              <div className="flex flex-col items-center gap-2">
                                <Check className="w-8 h-8 text-primary" />
                                <span className="text-sm text-primary font-medium">{formData.paymentScreenshot.name}</span>
                                <span className="text-xs text-muted-foreground">Click to change</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload payment screenshot</span>
                                <span className="text-xs text-muted-foreground">JPG, PNG or PDF</span>
                              </div>
                            )}
                          </button>
                        </div>

                        {/* UTR Number */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">UTR / Transaction ID</label>
                          <input
                            type="text"
                            value={formData.utrNumber}
                            onChange={(e) => handleInputChange("utrNumber", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter UTR number or Transaction ID"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            You can find the UTR/Transaction ID in your payment app or bank statement
                          </p>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                          <div className="flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              Please ensure the screenshot clearly shows the payment amount, date, and transaction reference number.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between mt-8">
                        <Button
                          variant="ghost"
                          onClick={() => setStep(2)}
                          className="text-muted-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          onClick={() => setStep(4)}
                          disabled={!canProceedStep3}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Submit Payment Proof
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4 - Identity Verification */}
                  {step === 4 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Identity Verification</h3>
                          <p className="text-sm text-muted-foreground">Upload your identity documents</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Government ID Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Government ID (Passport / Aadhaar / Driving License)
                          </label>
                          <input
                            ref={governmentIdRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange("governmentId", e.target.files?.[0] || null)}
                          />
                          <button
                            type="button"
                            onClick={() => governmentIdRef.current?.click()}
                            className={`w-full p-6 rounded-xl border-2 border-dashed transition-colors ${
                              formData.governmentId
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {formData.governmentId ? (
                              <div className="flex flex-col items-center gap-2">
                                <Check className="w-8 h-8 text-primary" />
                                <span className="text-sm text-primary font-medium">{formData.governmentId.name}</span>
                                <span className="text-xs text-muted-foreground">Click to change</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <CreditCard className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload Government ID</span>
                                <span className="text-xs text-muted-foreground">JPG, PNG or PDF</span>
                              </div>
                            )}
                          </button>
                        </div>

                        {/* Selfie Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Selfie Verification</label>
                          <input
                            ref={selfieRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange("selfie", e.target.files?.[0] || null)}
                          />
                          <button
                            type="button"
                            onClick={() => selfieRef.current?.click()}
                            className={`w-full p-6 rounded-xl border-2 border-dashed transition-colors ${
                              formData.selfie
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {formData.selfie ? (
                              <div className="flex flex-col items-center gap-2">
                                <Check className="w-8 h-8 text-primary" />
                                <span className="text-sm text-primary font-medium">{formData.selfie.name}</span>
                                <span className="text-xs text-muted-foreground">Click to change</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <User className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload a clear selfie</span>
                                <span className="text-xs text-muted-foreground">Face should be clearly visible</span>
                              </div>
                            )}
                          </button>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              Your documents are securely encrypted and used only for identity verification. We comply with all data protection regulations.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between mt-8">
                        <Button
                          variant="ghost"
                          onClick={() => setStep(3)}
                          className="text-muted-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          onClick={() => setStep(5)}
                          disabled={!canProceedStep4}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Next Step
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 5 - Wallet Details & Final Confirmation */}
                  {step === 5 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Wallet Details</h3>
                          <p className="text-sm text-muted-foreground">Enter where to receive your USDT</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Network Selection */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Network</label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: "trc20", label: "TRC20" },
                              { value: "bep20", label: "BEP20" },
                              { value: "binance", label: "Binance ID" },
                            ].map((network) => (
                              <button
                                key={network.value}
                                type="button"
                                onClick={() => handleInputChange("network", network.value)}
                                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                                  formData.network === network.value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-secondary border-border text-foreground hover:border-primary/50"
                                }`}
                              >
                                {network.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Wallet Address */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {formData.network === "binance" ? "Binance ID" : "Wallet Address"}
                          </label>
                          <input
                            type="text"
                            value={formData.walletAddress}
                            onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                            placeholder={formData.network === "binance" ? "Enter your Binance ID" : "Enter your wallet address"}
                          />
                        </div>

                        {/* Order Summary */}
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                          <h4 className="font-semibold text-foreground mb-3">Order Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">USDT Amount:</span>
                              <span className="text-foreground font-medium">{formData.usdtAmount} USDT</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">P2P Rate:</span>
                              <span className="text-foreground font-medium">₹{p2pRate} per USDT</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Amount:</span>
                              <span className="text-foreground font-medium">₹{totalAmount.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">UTR Number:</span>
                              <span className="text-foreground font-medium">{formData.utrNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Network:</span>
                              <span className="text-foreground font-medium uppercase">{formData.network}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between mt-8">
                        <Button
                          variant="ghost"
                          onClick={() => setStep(4)}
                          className="text-muted-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={isSubmitting || !canProceedStep5}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Order
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success State (Buy) */}
            {activeTab === "buy" && isComplete && (
              <div className="max-w-lg mx-auto text-center">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Submission Received!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your payment and identity verification are under review. Once approved, USDT will be released to your wallet.
                  </p>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border mb-6">
                    <p className="text-sm text-muted-foreground">
                      Processing time: Usually within 30 minutes. If there is any delay, please contact us on Telegram.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  >
                    <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Contact on Telegram
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Payment Liability & Legal Notice */}
      <section className="border-t border-border bg-[#0B0E11] px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FCD535]" />
            Payment Liability &amp; Legal Notice
          </h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            If any user submits a payment that results in suspicious transactions, fraud complaints, chargeback fraud, bank investigation, or account freeze, the responsibility will lie entirely with the user making the payment. If the website owner&apos;s bank account, payment system, or crypto wallet is affected due to such activity, legal action may be taken against the responsible user.
          </p>

          <p className="text-xs font-semibold text-foreground mb-2">Applicable Laws &amp; Sections</p>
          <ul className="text-xs text-muted-foreground space-y-1 mb-5 list-none">
            {[
              "Information Technology Act Section 66C – Identity Theft",
              "Information Technology Act Section 66D – Cheating by Personation using Computer Resources",
              "Information Technology Act Section 43 – Unauthorized access or damage to systems",
              "Indian Penal Code Section 420 – Cheating and Fraud",
              "Indian Penal Code Section 406 – Criminal Breach of Trust",
              "Indian Penal Code Section 468 – Forgery for the purpose of cheating",
            ].map((law) => (
              <li key={law} className="flex items-start gap-2">
                <span className="text-[#FCD535] mt-0.5 shrink-0">•</span>
                {law}
              </li>
            ))}
          </ul>

          <p className="text-xs font-semibold text-foreground mb-1">Penalty Clause</p>
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
            If the website owner&apos;s account or financial system is affected due to a user&apos;s transaction, the responsible user will be required to pay a penalty of{" "}
            <span className="text-[#FCD535] font-semibold">5x the payment amount</span>.{" "}
            Example: If the payment amount is ₹1,000, the penalty will be ₹5,000.
          </p>

          <p className="text-xs font-semibold text-foreground mb-1">Legal Cost Liability</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The responsible user will also be required to pay any additional legal expenses, investigation costs, or charges incurred while resolving the issue.
          </p>
        </div>
      </section>

      <UsdtHelpModal mode={helpMode} isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      <Footer />
    </div>
  )
}
