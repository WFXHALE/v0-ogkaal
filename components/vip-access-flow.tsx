"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { saveSubmission } from "@/lib/admin-submissions"
import { 
  Check, 
  Copy, 
  X, 
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  AtSign,
  Hash,
  Upload,
  QrCode,
  CreditCard,
  MessageCircle,
  Instagram,
  Wallet,
  DollarSign
} from "lucide-react"

const XM_AFFILIATE_LINK = "https://clicks.pipaffiliates.com/c?c=820817&l=en&p=0"

// Payment details - same as USDT P2P
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

type CardType = "existing" | "new" | "funded" | null
type FlowStep = "card-selection" | "xm-form" | "payment" | "contact" | "success"

const FUNDED_ACCOUNT_SIZES = [
  { value: "10000", label: "$10,000", price: "₹2,500" },
  { value: "25000", label: "$25,000", price: "₹5,000" },
  { value: "50000", label: "$50,000", price: "₹8,000" },
  { value: "100000", label: "$100,000", price: "₹12,000" },
]

interface VipAccessFlowProps {
  isOpen: boolean
  onClose: () => void
  initialUserType?: CardType
}

export function VipAccessFlow({ isOpen, onClose, initialUserType = null }: VipAccessFlowProps) {
  const [step, setStep] = useState<FlowStep>("card-selection")
  const [cardType, setCardType] = useState<CardType>(initialUserType)
  const [copiedUpi, setCopiedUpi] = useState(false)
  
  // XM User Form Data
  const [xmFormData, setXmFormData] = useState({
    traderId: "",
    depositScreenshot: null as File | null,
  })
  
  // Funded Account Data
  const [fundedAccountSize, setFundedAccountSize] = useState("")
  
  // Payment Data
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "imps" | "erupee" | null>(null)
  const [paymentData, setPaymentData] = useState({
    screenshot: null as File | null,
    utr: "",
  })
  
  // Contact Details (Final Step)
  const [contactData, setContactData] = useState({
    telegramId: "",
    instagramId: "",
    phoneNumber: "",
  })

  const depositFileRef = useRef<HTMLInputElement>(null)
  const paymentFileRef = useRef<HTMLInputElement>(null)

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(PAYMENT_DETAILS.upiId)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleCopyImps = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Card 1: XM Existing User
  const handleExistingUserClick = () => {
    setCardType("existing")
    setStep("xm-form")
  }

  // Card 2: XM New User - Redirect to XM first
  const handleNewUserClick = () => {
    window.open(XM_AFFILIATE_LINK, "_blank")
    setCardType("new")
    setStep("xm-form")
  }

  // Card 3: Funded Account
  const handleFundedUserClick = () => {
    setCardType("funded")
    setStep("xm-form") // Goes to account size selection
  }

  const handleXmFormSubmit = () => {
    if (cardType === "funded") {
      if (fundedAccountSize) {
        setStep("payment")
      }
    } else {
      if (xmFormData.traderId && xmFormData.depositScreenshot) {
        setStep("payment")
      }
    }
  }

  const handlePaymentSubmit = () => {
    if (paymentMethod && paymentData.screenshot && paymentData.utr) {
      setStep("contact")
    }
  }

  const handleContactSubmit = async () => {
    if (contactData.telegramId && contactData.phoneNumber) {
      // Save submission
      await saveSubmission({
        type: "vip_membership",
        name: cardType === "funded" ? "Funded Account User" : `XM ${cardType === "new" ? "New" : "Existing"} User`,
        telegram: contactData.telegramId,
        phone: contactData.phoneNumber,
        details: {
          cardType,
          ...(cardType === "funded" 
            ? { accountSize: fundedAccountSize }
            : { traderId: xmFormData.traderId }
          ),
          paymentMethod,
          utr: paymentData.utr,
          instagramId: contactData.instagramId,
        }
      })
      setStep("success")
    }
  }

  const resetFlow = () => {
    setStep("card-selection")
    setCardType(null)
    setXmFormData({ traderId: "", depositScreenshot: null })
    setFundedAccountSize("")
    setPaymentMethod(null)
    setPaymentData({ screenshot: null, utr: "" })
    setContactData({ telegramId: "", instagramId: "", phoneNumber: "" })
  }

  const handleClose = () => {
    resetFlow()
    onClose()
  }

  const getStepNumber = () => {
    if (cardType === "funded") {
      // Funded: Select Size -> Payment -> Contact -> Success
      if (step === "card-selection") return 0
      if (step === "xm-form") return 1
      if (step === "payment") return 2
      if (step === "contact") return 3
      return 4
    } else {
      // XM Users: Form -> Payment -> Contact -> Success
      if (step === "card-selection") return 0
      if (step === "xm-form") return 1
      if (step === "payment") return 2
      if (step === "contact") return 3
      return 4
    }
  }

  const getTotalSteps = () => 4

  const getSelectedAccountPrice = () => {
    const account = FUNDED_ACCOUNT_SIZES.find(a => a.value === fundedAccountSize)
    return account?.price || ""
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

        {/* Progress Bar */}
        {step !== "card-selection" && (
          <div className="px-6 pt-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              {Array.from({ length: getTotalSteps() }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    getStepNumber() > i 
                      ? "bg-primary text-primary-foreground" 
                      : getStepNumber() === i + 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {getStepNumber() > i ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < getTotalSteps() - 1 && (
                    <div className={`w-8 h-0.5 ${getStepNumber() > i + 1 ? "bg-primary" : "bg-secondary"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Card Selection */}
          {step === "card-selection" && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">VIP Membership</h2>
              <p className="text-muted-foreground mb-8">Choose your membership type</p>
              
              <div className="grid gap-4">
                {/* Card 1: XM Existing User */}
                <button
                  onClick={handleExistingUserClick}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">XM Existing User</span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground">For users who already have an XM trading account</p>
                </button>

                {/* Card 2: XM New User */}
                <button
                  onClick={handleNewUserClick}
                  className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary hover:border-primary/80 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">XM New User</span>
                    <ExternalLink className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Create a new XM account using our partner link</p>
                  <span className="inline-block px-2 py-0.5 rounded bg-primary/20 text-xs text-primary font-medium">Opens XM Registration</span>
                </button>

                {/* Card 3: Funded Account */}
                <button
                  onClick={handleFundedUserClick}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">Funded Account User</span>
                    <Wallet className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground">For traders using funded accounts</p>
                </button>
              </div>
            </div>
          )}

          {/* XM Form Step (For Existing and New Users) */}
          {step === "xm-form" && cardType !== "funded" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {cardType === "new" ? "XM Account Verification" : "Submit Your Details"}
                </h2>
                <p className="text-muted-foreground">
                  {cardType === "new" 
                    ? "Create your XM account and deposit the required amount. After depositing, submit your Trader ID and deposit screenshot."
                    : "If you already have an XM trading account, please deposit the minimum amount and submit your Trader ID and deposit screenshot."
                  }
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                <p className="text-sm text-amber-200 text-center">
                  Minimum deposit requirement: <span className="font-bold">$50</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Hash className="w-4 h-4 text-primary" />
                    XM Trader ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={xmFormData.traderId}
                    onChange={(e) => setXmFormData({ ...xmFormData, traderId: e.target.value })}
                    placeholder="Enter your XM Trader ID"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Upload className="w-4 h-4 text-primary" />
                    Deposit Screenshot <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    ref={depositFileRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setXmFormData({ ...xmFormData, depositScreenshot: e.target.files[0] })
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => depositFileRef.current?.click()}
                    className="w-full border-dashed border-border hover:border-primary py-8"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {xmFormData.depositScreenshot ? xmFormData.depositScreenshot.name : "Upload Deposit Screenshot"}
                  </Button>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setStep("card-selection")}
                    variant="outline"
                    className="flex-1 border-border"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleXmFormSubmit}
                    disabled={!xmFormData.traderId || !xmFormData.depositScreenshot}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Funded Account Size Selection */}
          {step === "xm-form" && cardType === "funded" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Account Size</h2>
                <p className="text-muted-foreground">Choose your funded account size</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {FUNDED_ACCOUNT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFundedAccountSize(size.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      fundedAccountSize === size.value
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="text-lg font-bold text-foreground">{size.label}</div>
                    <div className="text-sm text-primary font-medium">{size.price}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("card-selection")}
                  variant="outline"
                  className="flex-1 border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleXmFormSubmit}
                  disabled={!fundedAccountSize}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {step === "payment" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Payment</h2>
                <p className="text-muted-foreground">Complete your payment</p>
                {cardType === "funded" && (
                  <div className="mt-3 text-2xl font-bold text-primary">{getSelectedAccountPrice()}</div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { value: "upi", label: "UPI", icon: QrCode },
                  { value: "imps", label: "IMPS/Bank", icon: CreditCard },
                  { value: "erupee", label: "e-Rupee", icon: DollarSign },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value as "upi" | "imps" | "erupee")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === method.value
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <method.icon className={`w-6 h-6 ${paymentMethod === method.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Payment Details based on method */}
              {paymentMethod === "upi" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                  <p className="text-sm text-muted-foreground mb-3 text-center">Scan QR Code to Pay via UPI</p>
                  <div className="w-56 mx-auto bg-white rounded-xl overflow-hidden mb-4">
                    <img 
                      src={PAYMENT_DETAILS.upiQrCodeUrl}
                      alt="UPI QR Code"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
                    <span className="text-sm text-muted-foreground">UPI ID:</span>
                    <code className="flex-1 font-mono font-medium text-foreground">{PAYMENT_DETAILS.upiId}</code>
                    <Button size="sm" variant="ghost" onClick={handleCopyUpi}>
                      {copiedUpi ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {paymentMethod === "imps" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                  <p className="text-sm text-muted-foreground mb-3">Bank Transfer Details (IMPS/NEFT):</p>
                  <div className="space-y-2">
                    {[
                      { label: "Account Holder", value: PAYMENT_DETAILS.imps.accountHolder },
                      { label: "Account Number", value: PAYMENT_DETAILS.imps.accountNumber },
                      { label: "IFSC Code", value: PAYMENT_DETAILS.imps.ifsc },
                      { label: "Bank Name", value: PAYMENT_DETAILS.imps.bankName },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div>
                          <span className="text-xs text-muted-foreground block">{item.label}</span>
                          <span className="font-medium text-foreground">{item.value}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyImps(item.value)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === "erupee" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                  <p className="text-sm text-muted-foreground mb-3 text-center">Scan QR Code to Pay via Digital Rupee</p>
                  <div className="w-56 mx-auto bg-white rounded-xl overflow-hidden">
                    <img 
                      src={PAYMENT_DETAILS.erupeeQrCodeUrl}
                      alt="e-Rupee QR Code"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Payment Proof Upload */}
              {paymentMethod && (
                <div className="space-y-4 p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                  <h3 className="font-bold text-foreground">Upload Payment Proof</h3>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Upload className="w-4 h-4 text-primary" />
                      Payment Screenshot <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      ref={paymentFileRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPaymentData({ ...paymentData, screenshot: e.target.files[0] })
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => paymentFileRef.current?.click()}
                      className="w-full border-dashed border-border hover:border-primary"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {paymentData.screenshot ? paymentData.screenshot.name : "Upload Screenshot"}
                    </Button>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Hash className="w-4 h-4 text-primary" />
                      UTR / Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentData.utr}
                      onChange={(e) => setPaymentData({ ...paymentData, utr: e.target.value })}
                      placeholder="Enter UTR or Transaction ID"
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("xm-form")}
                  variant="outline"
                  className="flex-1 border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={!paymentMethod || !paymentData.screenshot || !paymentData.utr}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Contact Details Step (Common for all 3 cards) */}
          {step === "contact" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Contact Details</h2>
                <p className="text-muted-foreground">Please provide your contact information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Telegram ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactData.telegramId}
                    onChange={(e) => setContactData({ ...contactData, telegramId: e.target.value })}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Instagram className="w-4 h-4 text-primary" />
                    Instagram ID
                  </label>
                  <input
                    type="text"
                    value={contactData.instagramId}
                    onChange={(e) => setContactData({ ...contactData, instagramId: e.target.value })}
                    placeholder="@yourinstagram"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contactData.phoneNumber}
                    onChange={(e) => setContactData({ ...contactData, phoneNumber: e.target.value })}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setStep("payment")}
                    variant="outline"
                    className="flex-1 border-border"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleContactSubmit}
                    disabled={!contactData.telegramId || !contactData.phoneNumber}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                  >
                    Submit
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Request Submitted!</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Your request has been submitted successfully. Our team will verify your details and add you to the VIP system shortly.
              </p>
              <Button
                onClick={handleClose}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-6 text-lg"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function useVipAccessFlow() {
  const [isOpen, setIsOpen] = useState(false)
  const [initialUserType, setInitialUserType] = useState<CardType>(null)

  const openFlow = (userType?: CardType) => {
    setInitialUserType(userType || null)
    setIsOpen(true)
  }

  const closeFlow = () => {
    setIsOpen(false)
    setInitialUserType(null)
  }

  return { isOpen, initialUserType, openFlow, closeFlow }
}
