"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Check, 
  Copy, 
  X, 
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  AtSign,
  Upload,
  Wallet,
  QrCode,
  CreditCard,
  MessageCircle,
  Hash
} from "lucide-react"

const VIP_TELEGRAM_LINK = "https://t.me/ogkaaltrader_vip"
const UPI_ID = "ogkaaltrader@upi"
const USDT_ADDRESS = "TXxxxxxxxxxxxxxxxxxxxxxxxxxxx"

type FlowStep = "form" | "payment" | "success"

const ACCOUNT_SIZES = [
  "5K",
  "10K", 
  "15K",
  "20K",
  "25K",
  "50K",
  "100K",
  "200K",
  "Greater than 200K"
]

interface FundedAccountFlowProps {
  isOpen: boolean
  onClose: () => void
}

export function FundedAccountFlow({ isOpen, onClose }: FundedAccountFlowProps) {
  const [step, setStep] = useState<FlowStep>("form")
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    telegramUsername: "",
    telegramScreenshot: null as File | null,
    accountSize: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "crypto" | null>(null)
  const [paymentProof, setPaymentProof] = useState({
    screenshot: null as File | null,
    transactionId: "",
  })
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [copiedUsdt, setCopiedUsdt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const paymentFileInputRef = useRef<HTMLInputElement>(null)

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleCopyUsdt = () => {
    navigator.clipboard.writeText(USDT_ADDRESS)
    setCopiedUsdt(true)
    setTimeout(() => setCopiedUsdt(false), 2000)
  }

  const handleTelegramScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, telegramScreenshot: e.target.files[0] })
    }
  }

  const handlePaymentScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof({ ...paymentProof, screenshot: e.target.files[0] })
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.fullName && formData.email && formData.phone && (formData.telegramUsername || formData.telegramScreenshot) && formData.accountSize) {
      setStep("payment")
    }
  }

  const handlePaymentSubmit = () => {
    if (paymentMethod && (paymentProof.screenshot || paymentProof.transactionId)) {
      setStep("success")
    }
  }

  const handleJoinTelegram = () => {
    window.open(VIP_TELEGRAM_LINK, "_blank")
  }

  const resetFlow = () => {
    setStep("form")
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      telegramUsername: "",
      telegramScreenshot: null,
      accountSize: "",
    })
    setPaymentMethod(null)
    setPaymentProof({ screenshot: null, transactionId: "" })
  }

  const handleClose = () => {
    resetFlow()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Step Indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            {["form", "payment", "success"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" :
                  ["form", "payment", "success"].indexOf(step) > i 
                    ? "bg-primary/30 text-primary" 
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className={`w-12 h-0.5 ${
                  ["form", "payment", "success"].indexOf(step) > i 
                    ? "bg-primary/30" 
                    : "bg-secondary"
                }`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Funded Account Request Form */}
          {step === "form" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Funded Account Request</h2>
                <p className="text-muted-foreground">Please fill in your details to request funded account access</p>
                <div className="mt-3 inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                  <span className="text-primary font-bold">VIP Price: $50</span>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <AtSign className="w-4 h-4 text-primary" />
                    Telegram Username or Screenshot <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground mb-2"
                  />
                  <div className="text-center text-sm text-muted-foreground mb-2">or</div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleTelegramScreenshot}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed border-border hover:border-primary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {formData.telegramScreenshot ? formData.telegramScreenshot.name : "Upload Telegram Screenshot"}
                  </Button>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Hash className="w-4 h-4 text-primary" />
                    Funded Account Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.accountSize}
                    onChange={(e) => setFormData({ ...formData, accountSize: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground"
                    required
                  >
                    <option value="">Select account size</option>
                    {ACCOUNT_SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6 mt-4"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === "payment" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Payment</h2>
                <p className="text-muted-foreground">Select your preferred payment method and submit proof</p>
                <div className="mt-4 text-3xl font-bold text-primary">$50</div>
              </div>

              <div className="grid gap-4 mb-6">
                {/* UPI Payment Option */}
                <button
                  onClick={() => setPaymentMethod("upi")}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === "upi" 
                      ? "border-primary bg-primary/10" 
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">UPI Payment</h3>
                      <p className="text-sm text-muted-foreground">Pay using any UPI app</p>
                    </div>
                    {paymentMethod === "upi" && <Check className="w-6 h-6 text-primary" />}
                  </div>
                  {paymentMethod === "upi" && (
                    <div className="mt-4 p-4 rounded-lg bg-card border border-border">
                      <p className="text-sm text-muted-foreground mb-2">UPI ID:</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-foreground flex-1">{UPI_ID}</p>
                        <Button size="sm" variant="ghost" onClick={handleCopyUpi}>
                          {copiedUpi ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </button>

                {/* Crypto Payment Option */}
                <button
                  onClick={() => setPaymentMethod("crypto")}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === "crypto" 
                      ? "border-primary bg-primary/10" 
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">Crypto Payment (USDT)</h3>
                      <p className="text-sm text-muted-foreground">Pay using USDT TRC20</p>
                    </div>
                    {paymentMethod === "crypto" && <Check className="w-6 h-6 text-primary" />}
                  </div>
                  {paymentMethod === "crypto" && (
                    <div className="mt-4 p-4 rounded-lg bg-card border border-border">
                      <p className="text-sm text-muted-foreground mb-2">USDT TRC20 Address:</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-bold text-foreground break-all flex-1">{USDT_ADDRESS}</p>
                        <Button size="sm" variant="ghost" onClick={handleCopyUsdt}>
                          {copiedUsdt ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </button>
              </div>

              {/* Payment Proof Section */}
              {paymentMethod && (
                <div className="space-y-4 p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                  <h3 className="font-bold text-foreground">Upload Payment Proof</h3>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Upload className="w-4 h-4 text-primary" />
                      Payment Screenshot
                    </label>
                    <input
                      type="file"
                      ref={paymentFileInputRef}
                      onChange={handlePaymentScreenshot}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => paymentFileInputRef.current?.click()}
                      className="w-full border-dashed border-border hover:border-primary"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {paymentProof.screenshot ? paymentProof.screenshot.name : "Upload Payment Screenshot"}
                    </Button>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Hash className="w-4 h-4 text-primary" />
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={paymentProof.transactionId}
                      onChange={(e) => setPaymentProof({ ...paymentProof, transactionId: e.target.value })}
                      placeholder="Enter transaction ID"
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("form")}
                  variant="outline"
                  className="flex-1 border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={!paymentMethod || (!paymentProof.screenshot && !paymentProof.transactionId)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Submit Payment Proof
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Request Submitted!</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Your funded account request and payment proof have been submitted. Our team will contact you on Telegram shortly.
              </p>
              <Button
                onClick={handleJoinTelegram}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-6 text-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Join VIP Group on Telegram
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function useFundedAccountFlow() {
  const [isOpen, setIsOpen] = useState(false)

  const openFlow = () => setIsOpen(true)
  const closeFlow = () => setIsOpen(false)

  return { isOpen, openFlow, closeFlow }
}
