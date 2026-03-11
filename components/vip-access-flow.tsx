"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { saveSubmission } from "@/lib/admin-submissions"
import { useSiteConfig } from "@/lib/use-site-config"
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
  Play,
  Bitcoin,
} from "lucide-react"

const XM_AFFILIATE_LINK = "https://clicks.pipaffiliates.com/c?c=820817&l=en&p=0"

// Admin-replaceable video URL
const INSTRUCTION_VIDEO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vdo-l2LpwT1vHX45Ajs8hW1JIaEt2M5Ut5.MP4"

const VIP_UPI_LINK = "https://payments.cashfree.com/forms/OGMENTOR1"
const ERUPEE_QR = "/erupee-qr.png"

const PRICES = {
  existing: "₹2500 / $30",
  new: "₹3500 / $40",
  funded: "₹4500 / $50",
}

const CRYPTO_OPTIONS = [
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
  {
    key: "binance",
    label: "Binance ID Transfer",
    network: "Binance",
    address: "1125271626",
    isBinance: true,
  },
]

type CardType = "existing" | "new" | "funded" | null
type FlowStep = "card-selection" | "xm-form" | "payment" | "contact" | "success"

const FUNDED_ACCOUNT_SIZES = [
  { value: "10000", label: "$10,000" },
  { value: "25000", label: "$25,000" },
  { value: "50000", label: "$50,000" },
  { value: "100000", label: "$100,000" },
  { value: "200000", label: "$200,000" },
]

interface VipAccessFlowProps {
  isOpen: boolean
  onClose: () => void
  initialUserType?: CardType
}

export function VipAccessFlow({ isOpen, onClose, initialUserType = null }: VipAccessFlowProps) {
  const siteConfig = useSiteConfig()
  const [step, setStep] = useState<FlowStep>("card-selection")
  const [cardType, setCardType] = useState<CardType>(initialUserType)


  const [xmFormData, setXmFormData] = useState({
    traderId: "",
    depositScreenshot: null as File | null,
  })

  const [fundedAccountSize, setFundedAccountSize] = useState("")

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "crypto" | "erupee" | null>(null)
  const [cryptoOption, setCryptoOption] = useState<string | null>(null)
  const [copiedCrypto, setCopiedCrypto] = useState(false)
  const [paymentData, setPaymentData] = useState({
    screenshot: null as File | null,
    utr: "",
  })

  const [contactData, setContactData] = useState({
    telegramId: "",
    instagramId: "",
    phoneNumber: "",
  })

  const depositFileRef = useRef<HTMLInputElement>(null)
  const paymentFileRef = useRef<HTMLInputElement>(null)

  const handleCopyCrypto = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedCrypto(true)
    setTimeout(() => setCopiedCrypto(false), 2000)
  }

  const handleExistingUserClick = () => {
    setCardType("existing")
    setStep("xm-form")
  }

  const handleNewUserClick = () => {
    window.open(XM_AFFILIATE_LINK, "_blank")
    setCardType("new")
    setStep("xm-form")
  }

  const handleFundedUserClick = () => {
    setCardType("funded")
    setStep("xm-form")
  }

  const handleXmFormSubmit = () => {
    if (cardType === "funded") {
      if (fundedAccountSize) setStep("payment")
    } else {
      if (xmFormData.traderId && xmFormData.depositScreenshot) setStep("payment")
    }
  }

  const handlePaymentSubmit = () => {
    // Crypto only needs screenshot; UPI and IMPS need screenshot + UTR
    if (paymentMethod === "crypto") {
      if (paymentData.screenshot) setStep("contact")
    } else {
      if (paymentMethod && paymentData.screenshot && paymentData.utr) setStep("contact")
    }
  }

  const handleContactSubmit = async () => {
    if (contactData.telegramId && contactData.phoneNumber) {
      await saveSubmission({
        type: "vip_membership",
        name:
          cardType === "funded"
            ? "Funded Account User"
            : `XM ${cardType === "new" ? "New" : "Existing"} User`,
        telegram: contactData.telegramId,
        phone: contactData.phoneNumber,
        details: {
          cardType,
          ...(cardType === "funded"
            ? { accountSize: fundedAccountSize }
            : { traderId: xmFormData.traderId }),
          paymentMethod,
          utr: paymentData.utr,
          instagramId: contactData.instagramId,
        },
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
    setCryptoOption(null)
    setCopiedCrypto(false)
    setPaymentData({ screenshot: null, utr: "" })
    setContactData({ telegramId: "", instagramId: "", phoneNumber: "" })

  }

  const handleClose = () => {
    resetFlow()
    onClose()
  }

  const getStepNumber = () => {
    if (step === "card-selection") return 0
    if (step === "xm-form") return 1
    if (step === "payment") return 2
    if (step === "contact") return 3
    return 4
  }

  const getTotalSteps = () => 4

  const getPaymentPrice = () => {
    if (!cardType) return ""
    // Map each card type to its admin_settings pricing key
    if (cardType === "existing") return siteConfig.vip_signal_xm_existing || PRICES.existing
    if (cardType === "new")      return siteConfig.vip_signal_xm_new      || PRICES.new
    if (cardType === "funded")   return siteConfig.funded_account          || PRICES.funded
    return PRICES[cardType]
  }

  const isPaymentValid = () => {
    if (!paymentMethod || !paymentData.screenshot) return false
    if (paymentMethod === "crypto") return !!cryptoOption
    if (paymentMethod === "erupee") return true
    return !!paymentData.utr // upi requires UTR
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
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
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      getStepNumber() > i + 1 || getStepNumber() === i + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {getStepNumber() > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < getTotalSteps() - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        getStepNumber() > i + 1 ? "bg-primary" : "bg-secondary"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">
          {/* ── CARD SELECTION ── */}
          {step === "card-selection" && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">VIP Membership</h2>
              <p className="text-muted-foreground mb-8">Choose your membership type</p>

              <div className="grid gap-4">
                <button
                  onClick={handleExistingUserClick}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-foreground">XM Existing User</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{siteConfig.vip_signal_xm_existing || PRICES.existing}</span>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">For traders who already have an XM trading account.</p>
                </button>

                <button
                  onClick={handleNewUserClick}
                  className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary hover:border-primary/80 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-foreground">XM New User</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{siteConfig.vip_signal_xm_new || PRICES.new}</span>
                      <ExternalLink className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Create a new XM account using our partner link</p>
                  <span className="inline-block px-2 py-0.5 rounded bg-primary/20 text-xs text-primary font-medium">
                    Opens XM Registration
                  </span>
                </button>

                <button
                  onClick={handleFundedUserClick}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-foreground">Funded Account User</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{siteConfig.funded_account || PRICES.funded}</span>
                      <Wallet className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">For traders using funded accounts</p>
                </button>
              </div>
            </div>
          )}

          {/* ── XM FORM (Existing & New Users) ── */}
          {step === "xm-form" && cardType !== "funded" && (
            <div>
              {/* Video Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-1 text-center">
                  Submit Your Details
                </h2>

                <div className="mt-5 rounded-xl overflow-hidden border border-border bg-black">
                  <div className="p-3 bg-secondary/60 border-b border-border flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Watch This First — Connect Your XM Account
                    </span>
                  </div>
                  <video
                    controls
                    className="w-full"
                    src={INSTRUCTION_VIDEO_URL}
                    preload="metadata"
                  />
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    Before submitting your details, please watch this short video to learn how to
                    connect your XM account under our partner code.
                  </p>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    After watching the video, follow the steps and then submit your Trader ID and
                    deposit proof.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="p-5 rounded-xl bg-secondary/40 border border-border">
                <h3 className="font-bold text-foreground mb-1">Submit Your Details</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  After connecting your account and making the required deposit, please submit your
                  Trader ID and deposit screenshot.
                </p>

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
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
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
                      {xmFormData.depositScreenshot
                        ? xmFormData.depositScreenshot.name
                        : "Upload Deposit Screenshot"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
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
          )}

          {/* ── FUNDED ACCOUNT SIZE SELECTION ── */}
          {step === "xm-form" && cardType === "funded" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Account Size</h2>
                <p className="text-muted-foreground mb-3">Choose your funded account size</p>
                <div className="inline-block px-5 py-2 rounded-xl bg-primary/10 border border-primary/30">
                  <span className="text-lg font-bold text-primary">{PRICES.funded}</span>
                  <span className="text-sm text-muted-foreground ml-2">flat fee</span>
                </div>
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

          {/* ── PAYMENT STEP ── */}
          {step === "payment" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-1">Payment</h2>
                <p className="text-muted-foreground mb-2">Complete your payment to proceed</p>
                <div className="inline-block px-6 py-2 rounded-xl bg-primary/10 border border-primary/30">
                  <span className="text-xl font-bold text-primary">{getPaymentPrice()}</span>
                </div>
              </div>

              {/* Payment Method Selection — filtered by system config */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { value: "upi",     label: "UPI",     icon: QrCode,     enabled: siteConfig.upiEnabled    },
                  { value: "crypto",  label: "Crypto",  icon: Bitcoin,    enabled: siteConfig.cryptoEnabled },
                  { value: "erupee",  label: "E-Rupee", icon: CreditCard, enabled: siteConfig.erupeeEnabled },
                ].filter(m => m.enabled).map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value as "upi" | "crypto" | "erupee")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === method.value
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <method.icon
                      className={`w-6 h-6 ${
                        paymentMethod === method.value ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* UPI Details */}
              {paymentMethod === "upi" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6 text-center space-y-3">
                  <p className="text-sm font-medium text-foreground">Pay via UPI (Cashfree)</p>
                  <p className="text-xs text-muted-foreground">Click below to open the secure payment page. After paying, enter your UTR number and upload the screenshot.</p>
                  <a
                    href={VIP_UPI_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    Open UPI Payment Page
                  </a>
                </div>
              )}

              {/* E-Rupee Details */}
              {paymentMethod === "erupee" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6 text-center space-y-3">
                  <p className="text-sm font-medium text-foreground">Pay via E-Rupee (Digital Rupee)</p>
                  <div className="bg-white rounded-xl overflow-hidden w-56 mx-auto border border-border">
                    <img src={ERUPEE_QR} alt="E-Rupee QR Code — Reserve Bank of India Digital Rupee for Shahid Bashir" className="w-full h-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground">Scan the QR to pay via E-Rupee. After payment, upload your screenshot below.</p>
                </div>
              )}

              {/* Crypto */}
              {paymentMethod === "crypto" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Bitcoin className="w-5 h-5 text-primary" />
                    <p className="text-sm font-medium text-foreground">Choose one payment method</p>
                  </div>

                  {/* Crypto sub-option buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {CRYPTO_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setCryptoOption(opt.key); setCopiedCrypto(false) }}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-center ${
                          cryptoOption === opt.key
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border/50 hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Wallet / ID display */}
                  {cryptoOption && (() => {
                    const opt = CRYPTO_OPTIONS.find(o => o.key === cryptoOption)!
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyCrypto(opt.address)}
                              className="shrink-0"
                            >
                              {copiedCrypto ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {opt.isBinance && (
                          <p className="text-xs text-muted-foreground">
                            Send USDT using Binance Pay or internal Binance transfer.
                          </p>
                        )}
                      </div>
                    )
                  })()}
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
                      {paymentData.screenshot
                        ? paymentData.screenshot.name
                        : "Upload Screenshot"}
                    </Button>
                  </div>

                  {/* UTR only required for UPI */}
                  {paymentMethod === "upi" && (
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
                  )}
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
                  disabled={!isPaymentValid()}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── CONTACT DETAILS ── */}
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
                    <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={contactData.instagramId}
                    onChange={(e) =>
                      setContactData({ ...contactData, instagramId: e.target.value })
                    }
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
                    onChange={(e) =>
                      setContactData({ ...contactData, phoneNumber: e.target.value })
                    }
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

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Payment Submitted</h2>
              <p className="text-lg font-semibold text-primary mb-4">Under Review</p>
              <div className="p-5 rounded-xl bg-secondary/50 border border-border text-center space-y-2 mb-8 max-w-md mx-auto">
                <p className="text-foreground text-sm font-medium">
                  Your payment is being verified. After successful verification, you will be added to the VIP group and granted access shortly.
                </p>
              </div>
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
