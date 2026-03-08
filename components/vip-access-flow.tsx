"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { saveSubmission } from "@/lib/admin-submissions"
import { 
  Check, 
  Copy, 
  Play, 
  X, 
  AlertTriangle, 
  ExternalLink,
  CreditCard,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  AtSign,
  Hash,
  Wallet,
  QrCode
} from "lucide-react"

const PARTNER_CODE = "XV3F9"
const XM_AFFILIATE_LINK = "https://clicks.pipaffiliates.com/c?c=820817&l=en&p=0"
const VIDEO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vdo-sMvKHoLiu3PNzEk4loSCszeBN71561.MP4"
const VIP_TELEGRAM_LINK = "https://t.me/ogkaaltrader_vip"

type FlowStep = "initial" | "post-signup" | "verification" | "payment" | "success"
type UserType = "new" | "existing" | null

interface VipAccessFlowProps {
  isOpen: boolean
  onClose: () => void
  initialUserType?: UserType
}

export function VipAccessFlow({ isOpen, onClose, initialUserType = null }: VipAccessFlowProps) {
  const [step, setStep] = useState<FlowStep>("initial")
  const [userType, setUserType] = useState<UserType>(initialUserType)
  const [showWarning, setShowWarning] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    telegramUsername: "",
    xmTradingId: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "crypto" | null>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PARTNER_CODE)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleOpenXmAccount = () => {
    window.open(XM_AFFILIATE_LINK, "_blank")
    setUserType("new")
    setStep("post-signup")
  }

  const handleExistingUser = () => {
    setUserType("existing")
    setStep("post-signup")
  }

  const handleAccountCreated = () => {
    if (userType === "new") {
      setStep("verification")
    } else {
      setShowWarning(true)
    }
  }

  const handleExistingUserContinue = () => {
    setStep("verification")
  }

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.fullName && formData.email && formData.telegramUsername && formData.xmTradingId) {
      setStep("payment")
    }
  }

  const handlePaymentConfirm = async () => {
    // Save submission to admin dashboard
    await saveSubmission({
      type: "mentorship",
      name: formData.fullName,
      email: formData.email,
      telegram: formData.telegramUsername,
      details: {
        xmTradingId: formData.xmTradingId,
        userType: userType === "new" ? "New XM Partner" : "Existing XM User",
        paymentMethod: paymentMethod,
        amount: userType === "new" ? "$25" : "$20"
      }
    })
    setPaymentConfirmed(true)
    setStep("success")
  }

  const handleJoinTelegram = () => {
    window.open(VIP_TELEGRAM_LINK, "_blank")
  }

  const resetFlow = () => {
    setStep("initial")
    setUserType(null)
    setShowWarning(false)
    setFormData({ fullName: "", email: "", telegramUsername: "", xmTradingId: "" })
    setPaymentMethod(null)
    setPaymentConfirmed(false)
  }

  const handleClose = () => {
    resetFlow()
    onClose()
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const getPrice = () => {
    return userType === "new" ? "$25" : "$20"
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
            {["initial", "post-signup", "verification", "payment", "success"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" :
                  ["initial", "post-signup", "verification", "payment", "success"].indexOf(step) > i 
                    ? "bg-primary/30 text-primary" 
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                {i < 4 && <div className={`w-8 h-0.5 ${
                  ["initial", "post-signup", "verification", "payment", "success"].indexOf(step) > i 
                    ? "bg-primary/30" 
                    : "bg-secondary"
                }`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Initial - Choose XM Account Type */}
          {step === "initial" && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">XM Partner Account</h2>
              <p className="text-muted-foreground mb-8">Choose your account status to continue</p>
              
              <div className="grid gap-4 max-w-md mx-auto">
                <button
                  onClick={handleOpenXmAccount}
                  className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary hover:border-primary/80 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">Open XM Account</span>
                    <ExternalLink className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">For new users who need to create an XM trading account</p>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    <span>VIP Price: $25</span>
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-xs">Recommended</span>
                  </div>
                </button>

                <button
                  onClick={handleExistingUser}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">Existing XM User</span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">For users who already have an XM trading account</p>
                  <div className="text-primary text-sm font-medium">VIP Price: $20</div>
                </button>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground mb-2">Partner Code:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-bold text-2xl text-primary">{PARTNER_CODE}</span>
                  <Button size="sm" variant="ghost" onClick={handleCopyCode}>
                    {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Post-Signup - Video & Confirmation */}
          {step === "post-signup" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {userType === "new" ? "After Opening XM Account" : "Watch This Video First"}
                </h2>
                <p className="text-muted-foreground">
                  {userType === "new" 
                    ? "After creating your XM trading account, please return to this page and click the button below."
                    : "Learn how to link your account with our partner code"}
                </p>
              </div>

              {/* Video Player */}
              <div className="relative rounded-xl overflow-hidden bg-black mb-6">
                <video
                  ref={videoRef}
                  className="w-full aspect-video"
                  controls
                  playsInline
                  preload="metadata"
                >
                  <source src={VIDEO_URL} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAccountCreated}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
                >
                  I HAVE CREATED THE ACCOUNT
                </Button>
                <Button
                  onClick={handleExistingUserContinue}
                  variant="outline"
                  className="w-full border-primary/50 hover:bg-primary/10 font-bold py-6"
                >
                  I AM AN EXISTING XM USER
                </Button>
                <Button
                  onClick={() => setStep("initial")}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verification Form */}
          {step === "verification" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Trading Account Verification</h2>
                <p className="text-muted-foreground">Please provide your details for verification</p>
              </div>

              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name
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
                    Email Address
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
                    <AtSign className="w-4 h-4 text-primary" />
                    Telegram Username
                  </label>
                  <input
                    type="text"
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Hash className="w-4 h-4 text-primary" />
                    XM Trading Account ID (Trader ID)
                  </label>
                  <input
                    type="text"
                    value={formData.xmTradingId}
                    onChange={(e) => setFormData({ ...formData, xmTradingId: e.target.value })}
                    placeholder="Enter your XM Trading Account ID"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Please enter your XM Trading Account ID so we can verify that the account was created under our partner link.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setStep("post-signup")}
                    variant="outline"
                    className="flex-1 border-border"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === "payment" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">VIP Group Payment</h2>
                <p className="text-muted-foreground">Select your preferred payment method</p>
                <div className="mt-4 text-3xl font-bold text-primary">{getPrice()}</div>
              </div>

              <div className="grid gap-4 mb-6">
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
                    <div>
                      <h3 className="font-bold text-foreground">UPI Payment</h3>
                      <p className="text-sm text-muted-foreground">Pay using any UPI app</p>
                    </div>
                    {paymentMethod === "upi" && <Check className="w-6 h-6 text-primary ml-auto" />}
                  </div>
                  {paymentMethod === "upi" && (
                    <div className="mt-4 p-4 rounded-lg bg-card border border-border">
                      <p className="text-sm text-muted-foreground mb-2">UPI ID:</p>
                      <p className="font-mono font-bold text-foreground">ogkaaltrader@upi</p>
                    </div>
                  )}
                </button>

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
                    <div>
                      <h3 className="font-bold text-foreground">Crypto Payment (USDT)</h3>
                      <p className="text-sm text-muted-foreground">Pay using USDT TRC20</p>
                    </div>
                    {paymentMethod === "crypto" && <Check className="w-6 h-6 text-primary ml-auto" />}
                  </div>
                  {paymentMethod === "crypto" && (
                    <div className="mt-4 p-4 rounded-lg bg-card border border-border">
                      <p className="text-sm text-muted-foreground mb-2">USDT TRC20 Address:</p>
                      <p className="font-mono text-sm font-bold text-foreground break-all">TXxxxxxxxxxxxxxxxxxxxxxxxxxxx</p>
                    </div>
                  )}
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("verification")}
                  variant="outline"
                  className="flex-1 border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePaymentConfirm}
                  disabled={!paymentMethod}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  I Have Made Payment
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-8">
                Your payment has been received. Click the button below to join the VIP group.
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

        {/* Warning Popup */}
        {showWarning && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 rounded-2xl">
            <div className="bg-card p-6 rounded-xl border border-border max-w-sm text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Account Required</h3>
              <p className="text-muted-foreground mb-6">
                Please create your XM account first using the recommended partner link before continuing.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowWarning(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button
                  onClick={() => {
                    setShowWarning(false)
                    handleOpenXmAccount()
                  }}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  Open XM Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function useVipAccessFlow() {
  const [isOpen, setIsOpen] = useState(false)
  const [initialUserType, setInitialUserType] = useState<UserType>(null)

  const openFlow = (userType?: UserType) => {
    setInitialUserType(userType || null)
    setIsOpen(true)
  }

  const closeFlow = () => {
    setIsOpen(false)
    setInitialUserType(null)
  }

  return { isOpen, initialUserType, openFlow, closeFlow }
}
