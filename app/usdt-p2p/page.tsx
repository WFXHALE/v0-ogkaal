"use client"

import { Header } from "@/components/header"
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
  Send
} from "lucide-react"
import { useState, useRef } from "react"
import { saveSubmission } from "@/lib/admin-submissions"

const TELEGRAM_LINK = "https://t.me/ogkaaltrader"

type PaymentMethod = "upi" | "imps" | "erupee"
type Network = "trc20" | "bep20" | "binance"

interface FormData {
  // Step 1 - User Details
  fullName: string
  email: string
  phone: string
  paymentMethod: PaymentMethod | ""
  // Step 2 - Identity Verification
  panNumber: string
  aadhaarNumber: string
  panCard: File | null
  aadhaarCard: File | null
  selfie: File | null
  // Step 3 - Wallet Details
  walletAddress: string
  network: Network | ""
  usdtAmount: string
}

export default function UsdtP2PPage() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [step, setStep] = useState(0) // 0 = info, 1-4 = form steps
  const [sellUsdtAmount, setSellUsdtAmount] = useState("")
  
  // Sell flow state
  const [sellStep, setSellStep] = useState(0) // 0 = method selection, 1 = kaal form, 2 = success
  const [sellFormData, setSellFormData] = useState({
    upiOrBank: "",
    phone: "",
    telegram: "",
    screenshot: null as File | null,
  })
  const sellScreenshotRef = useRef<HTMLInputElement>(null)

  const BINANCE_P2P_LINK = "https://www.binance.com/en/p2p"
  const KAAL_WALLET_ADDRESS = "TRC20: TYourWalletAddressHere"

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    paymentMethod: "",
    panNumber: "",
    aadhaarNumber: "",
    panCard: null,
    aadhaarCard: null,
    selfie: null,
    walletAddress: "",
    network: "",
    usdtAmount: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const panCardRef = useRef<HTMLInputElement>(null)
  const aadhaarCardRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: "panCard" | "aadhaarCard" | "selfie", file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }))
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
        network: formData.network,
        walletAddress: formData.walletAddress
      }
    })
    
    setIsSubmitting(false)
    setIsComplete(true)
  }

  const canProceedStep1 = formData.fullName && formData.email && formData.phone && formData.paymentMethod
  const canProceedStep2 = formData.panNumber && formData.aadhaarNumber && formData.panCard && formData.aadhaarCard && formData.selfie
  const canProceedStep3 = formData.walletAddress && formData.network && formData.usdtAmount

  // Sell USDT pricing tiers
  const getSellRate = (amount: number): { min: number; max: number } => {
    if (amount < 50) return { min: 90, max: 90 }
    return { min: 92, max: 93 }
  }

  const sellAmount = Number(sellUsdtAmount) || 0
  const sellRateRange = getSellRate(sellAmount)
  const sellTotalINRMin = sellAmount * sellRateRange.min
  const sellTotalINRMax = sellAmount * sellRateRange.max

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 sm:py-24">
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

            {/* Buy/Sell Tabs */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex rounded-xl bg-secondary p-1">
                <button
                  onClick={() => { setActiveTab("buy"); setStep(0); setIsComplete(false); }}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === "buy"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buy USDT
                </button>
                <button
                  onClick={() => { setActiveTab("sell"); setStep(0); setIsComplete(false); }}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === "sell"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sell USDT
                </button>
              </div>
            </div>

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
                        <p className="text-sm text-muted-foreground mb-1">Internet USDT Rate</p>
                        <p className="text-2xl font-bold text-foreground">₹91</p>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                        <p className="text-sm text-primary mb-1">Our P2P Rate</p>
                        <p className="text-2xl font-bold text-primary">₹93 – ₹94</p>
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
                  <div className="text-center">
                    <Button
                      onClick={() => setStep(1)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6"
                    >
                      Buy USDT Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Sell USDT Section */}
            {activeTab === "sell" && (
              <div className="max-w-2xl mx-auto">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Sell USDT</h3>
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
                      }`}>₹92–₹93 <span className="text-sm font-normal">per USDT</span></p>
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
                          <span className="text-muted-foreground">Applicable Rate:</span>
                          <span className="text-foreground font-medium">
                            {sellRateRange.min === sellRateRange.max 
                              ? `₹${sellRateRange.min}` 
                              : `₹${sellRateRange.min}–₹${sellRateRange.max}`} per USDT
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-border">
                          <span className="font-semibold text-foreground">Estimated INR:</span>
                          <span className="text-2xl font-bold text-primary">
                            {sellTotalINRMin === sellTotalINRMax 
                              ? `₹${sellTotalINRMin.toLocaleString()}`
                              : `₹${sellTotalINRMin.toLocaleString()}–₹${sellTotalINRMax.toLocaleString()}`}
                          </span>
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

                  {/* Method Selection - Only show if no method selected and not in form/success */}
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

                      {/* Step 1 */}
                      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                          <h5 className="font-semibold text-foreground">Send USDT to this wallet address</h5>
                        </div>
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <p className="text-sm font-mono text-foreground break-all">{KAAL_WALLET_ADDRESS}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Network: TRC20</p>
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

                      {/* Step 3 */}
                      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                          <h5 className="font-semibold text-foreground">Enter your details</h5>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">UPI ID or Bank Account Details</label>
                            <input
                              type="text"
                              value={sellFormData.upiOrBank}
                              onChange={(e) => setSellFormData(prev => ({ ...prev, upiOrBank: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="e.g., yourname@upi or Account Number + IFSC"
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
                          await saveSubmission({
                            type: "usdt_p2p",
                            name: "Sell Request",
                            telegram: sellFormData.telegram,
                            phone: sellFormData.phone,
                            details: {
                              action: "sell",
                              amount: `${sellAmount} USDT`,
                              rate: `₹${sellRateRange.min}-₹${sellRateRange.max}`,
                              upiOrBank: sellFormData.upiOrBank
                            }
                          })
                          setSellStep(2)
                        }}
                        disabled={!sellFormData.screenshot || !sellFormData.upiOrBank || !sellFormData.phone || !sellFormData.telegram}
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
                          setSellStep(0)
                          setSellFormData({ upiOrBank: "", phone: "", telegram: "", screenshot: null })
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

            {/* Multi-Step Form (Buy) */}
            {activeTab === "buy" && step > 0 && !isComplete && (
              <div className="max-w-2xl mx-auto">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                          step >= s 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {step > s ? <Check className="w-5 h-5" /> : s}
                      </div>
                      {s < 4 && (
                        <div className={`w-12 sm:w-20 h-1 mx-2 rounded ${step > s ? "bg-primary" : "bg-secondary"}`} />
                      )}
                    </div>
                  ))}
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
                          <p className="text-sm text-muted-foreground">Enter your personal information</p>
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
                          <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
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

                  {/* Step 2 - Identity Verification */}
                  {step === 2 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Identity Verification</h3>
                          <p className="text-sm text-muted-foreground">Upload your KYC documents</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">PAN Number</label>
                          <input
                            type="text"
                            value={formData.panNumber}
                            onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                            placeholder="ABCDE1234F"
                            maxLength={10}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Aadhaar Number</label>
                          <input
                            type="text"
                            value={formData.aadhaarNumber}
                            onChange={(e) => handleInputChange("aadhaarNumber", e.target.value.replace(/\D/g, ""))}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="1234 5678 9012"
                            maxLength={12}
                          />
                        </div>

                        {/* File Uploads */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* PAN Card Upload */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Upload PAN Card</label>
                            <input
                              ref={panCardRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange("panCard", e.target.files?.[0] || null)}
                            />
                            <button
                              type="button"
                              onClick={() => panCardRef.current?.click()}
                              className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors ${
                                formData.panCard
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {formData.panCard ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Check className="w-6 h-6 text-primary" />
                                  <span className="text-xs text-primary truncate max-w-full">{formData.panCard.name}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="w-6 h-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">PAN Card</span>
                                </div>
                              )}
                            </button>
                          </div>

                          {/* Aadhaar Card Upload */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Upload Aadhaar</label>
                            <input
                              ref={aadhaarCardRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange("aadhaarCard", e.target.files?.[0] || null)}
                            />
                            <button
                              type="button"
                              onClick={() => aadhaarCardRef.current?.click()}
                              className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors ${
                                formData.aadhaarCard
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {formData.aadhaarCard ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Check className="w-6 h-6 text-primary" />
                                  <span className="text-xs text-primary truncate max-w-full">{formData.aadhaarCard.name}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="w-6 h-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Aadhaar</span>
                                </div>
                              )}
                            </button>
                          </div>

                          {/* Selfie Upload */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Upload Selfie</label>
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
                              className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors ${
                                formData.selfie
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {formData.selfie ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Check className="w-6 h-6 text-primary" />
                                  <span className="text-xs text-primary truncate max-w-full">{formData.selfie.name}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="w-6 h-6 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Selfie</span>
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

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
                          Next Step
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 - Wallet Details */}
                  {step === 3 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Wallet Details</h3>
                          <p className="text-sm text-muted-foreground">Enter your crypto wallet information</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">USDT Amount</label>
                          <input
                            type="number"
                            value={formData.usdtAmount}
                            onChange={(e) => handleInputChange("usdtAmount", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter amount (min 50 USDT)"
                            min="1"
                          />
                          {formData.usdtAmount && Number(formData.usdtAmount) < 50 && (
                            <p className="text-amber-500 text-sm mt-2">
                              Orders below 50 USDT will be charged at ₹115-₹120 per USDT
                            </p>
                          )}
                        </div>
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
                        {formData.usdtAmount && (
                          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                            <h4 className="font-semibold text-foreground mb-3">Order Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">USDT Amount:</span>
                                <span className="text-foreground font-medium">{formData.usdtAmount} USDT</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Rate:</span>
                                <span className="text-foreground font-medium">
                                  {Number(formData.usdtAmount) < 50 ? "₹115 - ₹120" : "₹93 - ₹94"}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-border">
                                <span className="text-muted-foreground">Estimated Total:</span>
                                <span className="text-primary font-bold">
                                  ₹{Number(formData.usdtAmount) < 50 
                                    ? (Number(formData.usdtAmount) * 117.5).toLocaleString() 
                                    : (Number(formData.usdtAmount) * 93.5).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
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
                          Review Order
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4 - Review & Submit */}
                  {step === 4 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Review & Submit</h3>
                          <p className="text-sm text-muted-foreground">Confirm your order details</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* User Details Summary */}
                        <div className="p-4 rounded-xl bg-secondary/50">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" /> User Details
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="text-foreground">{formData.fullName}</span>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="text-foreground">{formData.email}</span>
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="text-foreground">{formData.phone}</span>
                            <span className="text-muted-foreground">Payment:</span>
                            <span className="text-foreground uppercase">{formData.paymentMethod}</span>
                          </div>
                        </div>

                        {/* Identity Summary */}
                        <div className="p-4 rounded-xl bg-secondary/50">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Identity Verification
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">PAN:</span>
                            <span className="text-foreground">{formData.panNumber}</span>
                            <span className="text-muted-foreground">Aadhaar:</span>
                            <span className="text-foreground">{formData.aadhaarNumber}</span>
                            <span className="text-muted-foreground">Documents:</span>
                            <span className="text-primary">3 files uploaded</span>
                          </div>
                        </div>

                        {/* Wallet Summary */}
                        <div className="p-4 rounded-xl bg-secondary/50">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Wallet Details
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="text-foreground">{formData.usdtAmount} USDT</span>
                            <span className="text-muted-foreground">Network:</span>
                            <span className="text-foreground uppercase">{formData.network}</span>
                            <span className="text-muted-foreground">Address:</span>
                            <span className="text-foreground font-mono text-xs break-all">{formData.walletAddress}</span>
                          </div>
                        </div>

                        {/* Final Amount */}
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">Total Amount to Pay:</span>
                            <span className="text-2xl font-bold text-primary">
                              ₹{Number(formData.usdtAmount) < 50 
                                ? (Number(formData.usdtAmount) * 117.5).toLocaleString() 
                                : (Number(formData.usdtAmount) * 93.5).toLocaleString()}
                            </span>
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
                          onClick={handleSubmit}
                          disabled={isSubmitting}
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
                  <h3 className="text-2xl font-bold text-foreground mb-4">Order Submitted Successfully!</h3>
                  <p className="text-muted-foreground mb-6">
                    Details received. Please wait up to 30 minutes. Your USDT will arrive shortly. 
                    If there is any delay, please contact us on Telegram.
                  </p>
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
    </div>
  )
}
