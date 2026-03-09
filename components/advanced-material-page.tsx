"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Lock, CheckCircle, ArrowLeft, ArrowRight, BookOpen, LogIn,
  QrCode, CreditCard, Bitcoin, Upload, Hash, Check, Copy, Clock,
} from "lucide-react"
import {
  type MaterialId,
  type MaterialMeta,
  getSession,
  hasPurchased,
  isPending,
  recordPending,
} from "@/lib/material-store"

// ---- Payment constants (same as VIP flow) ----------------------------------

const PAYMENT_DETAILS = {
  upiId: "cxewankuss@ybl",
  upiQrCodeUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/paytm-uNxomWsKUWCUbHXNJTECcGuJiEsvB9.jpg",
  imps: {
    accountNumber: "259541281829",
    ifsc: "INDB0000136",
    bankName: "Indusind Bank",
    accountHolder: "Shahid Bashir",
  },
}

const CRYPTO_OPTIONS = [
  { key: "bep20",   label: "USDT BEP20",         network: "BEP20",   address: "0xa1540bccbe530fcc92a2b31db5795394053fdad7", isBinance: false },
  { key: "trc20",   label: "USDT TRC20",          network: "TRC20",   address: "TF7gytsAtFPM9f2RQPyiFphd8pasiZ1WQF",       isBinance: false },
  { key: "binance", label: "Binance ID Transfer",  network: "Binance", address: "1125271626",                               isBinance: true  },
]

// ---- Types ------------------------------------------------------------------

interface Props {
  meta: MaterialMeta
  previewContent: React.ReactNode
}

type PayStep = "method" | "details" | "upload" | "review"
type PayMethod = "upi" | "imps" | "crypto"

// ---- Main component ---------------------------------------------------------

export function AdvancedMaterialPage({ meta, previewContent }: Props) {
  const [session,   setSession]   = useState<{ id: string; fullName: string } | null>(null)
  const [purchased, setPurchased] = useState(false)
  const [pending,   setPending]   = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [showFlow,  setShowFlow]  = useState(false)

  useEffect(() => {
    setSession(getSession())
    setPurchased(hasPurchased(meta.id as MaterialId))
    setPending(isPending(meta.id as MaterialId))
    setMounted(true)
  }, [meta.id])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <main className="pt-24 pb-20 px-4">
          <div className="max-w-3xl mx-auto animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded-xl w-1/2" />
            <div className="h-4 bg-secondary rounded w-3/4" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">

          <Link
            href="/material"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Materials
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{meta.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">{meta.description}</p>
            </div>
          </div>

          {/* ---- PURCHASED ---- */}
          {purchased ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                You have full access to this material.
              </div>
              {previewContent}
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                Full lesson content will appear here once lessons are uploaded by the instructor.
              </div>
            </div>
          ) : (
            <>
              {previewContent}

              <div className="mt-10 rounded-2xl border border-border bg-card overflow-hidden">
                {/* Blurred teaser */}
                <div className="relative h-24 overflow-hidden select-none pointer-events-none">
                  <div className="px-6 py-4 space-y-2 opacity-30 blur-sm">
                    <div className="h-3 bg-muted-foreground/40 rounded w-3/4" />
                    <div className="h-3 bg-muted-foreground/40 rounded w-2/3" />
                    <div className="h-3 bg-muted-foreground/40 rounded w-1/2" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>

                <div className="px-6 pb-8 pt-2 text-center">
                  {/* ---- PENDING REVIEW ---- */}
                  {pending ? (
                    <div className="py-6 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Payment Status: Under Review</p>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                          Your payment is under review. Access will be granted once the payment is verified.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-7 h-7 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-2">Unlock Advanced Material</h2>
                      <p className="text-muted-foreground text-sm mb-1">One-time payment for lifetime access.</p>

                      {/* Prices */}
                      <div className="flex items-center justify-center gap-6 mt-4 mb-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">UPI / IMPS</p>
                          <span className="text-3xl font-extrabold text-primary">
                            ₹{meta.priceINR.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="w-px h-10 bg-border" />
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Crypto (USDT)</p>
                          <span className="text-3xl font-extrabold text-primary">
                            ${meta.priceUSD}
                          </span>
                        </div>
                      </div>

                      {!session ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Please sign in to unlock this material.</p>
                          <Link
                            href="/community"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                          >
                            <LogIn className="w-4 h-4" />
                            Sign In
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowFlow(true)}
                          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                          Unlock Now
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Payment flow modal */}
      {showFlow && (
        <PaymentFlow
          meta={meta}
          onClose={() => setShowFlow(false)}
          onSubmitted={() => {
            recordPending(meta.id as MaterialId)
            setPending(true)
            setShowFlow(false)
          }}
        />
      )}
    </div>
  )
}

// ---- Payment Flow Modal -----------------------------------------------------

function PaymentFlow({
  meta,
  onClose,
  onSubmitted,
}: {
  meta: MaterialMeta
  onClose: () => void
  onSubmitted: () => void
}) {
  const [step,         setStep]         = useState<PayStep>("method")
  const [method,       setMethod]       = useState<PayMethod | null>(null)
  const [cryptoOption, setCryptoOption] = useState<string | null>(null)
  const [screenshot,   setScreenshot]   = useState<File | null>(null)
  const [utr,          setUtr]          = useState("")
  const [copiedUpi,    setCopiedUpi]    = useState(false)
  const [copiedImps,   setCopiedImps]   = useState<string | null>(null)
  const [copiedCrypto, setCopiedCrypto] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const copyText = (text: string, setter: (v: any) => void, val: any, timeout = 2000) => {
    navigator.clipboard.writeText(text)
    setter(val)
    setTimeout(() => setter(typeof val === "boolean" ? false : null), timeout)
  }

  const price = method === "crypto" ? `$${meta.priceUSD} USDT` : `₹${meta.priceINR.toLocaleString("en-IN")}`

  const canProceedToUpload = () => {
    if (!method) return false
    if (method === "crypto") return !!cryptoOption
    return true
  }

  const canSubmit = () => {
    if (!screenshot) return false
    if (method === "crypto") return true
    return !!utr.trim()
  }

  const stepIndex = { method: 1, details: 2, upload: 3, review: 4 }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground rotate-180" />
          <span className="sr-only">Close</span>
        </button>

        {/* Progress */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((n, i) => (
              <div key={n} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  stepIndex[step] > n ? "bg-primary text-primary-foreground"
                  : stepIndex[step] === n ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
                }`}>
                  {stepIndex[step] > n ? <Check className="w-4 h-4" /> : n}
                </div>
                {i < 2 && (
                  <div className={`w-10 h-0.5 ${stepIndex[step] > n ? "bg-primary" : "bg-secondary"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Price badge */}
          <div className="text-center mb-2">
            <span className="inline-block px-5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm font-bold text-primary">
              {price}
            </span>
          </div>
        </div>

        <div className="p-6 pt-2">

          {/* ---- STEP 1: Choose method ---- */}
          {step === "method" && (
            <div>
              <h2 className="text-xl font-bold text-foreground text-center mb-1">Select Payment Method</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {meta.title} — One-time purchase
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {([
                  { value: "upi",    label: "UPI",    icon: QrCode    },
                  { value: "imps",   label: "IMPS",   icon: CreditCard },
                  { value: "crypto", label: "Crypto", icon: Bitcoin    },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setMethod(value); setCryptoOption(null) }}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      method === value
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${method === value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {value === "crypto" ? `$${meta.priceUSD}` : `₹${meta.priceINR.toLocaleString("en-IN")}`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Crypto sub-options */}
              {method === "crypto" && (
                <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-sm font-medium text-foreground mb-3">Choose network:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {CRYPTO_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setCryptoOption(opt.key)}
                        className={`p-3 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                          cryptoOption === opt.key
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border/50 hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep("details")}
                disabled={!canProceedToUpload()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---- STEP 2: Payment details ---- */}
          {step === "details" && (
            <div>
              <h2 className="text-xl font-bold text-foreground text-center mb-1">Send Payment</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Send exactly <span className="text-foreground font-semibold">{price}</span> using the details below
              </p>

              {/* UPI */}
              {method === "upi" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
                  <p className="text-sm text-muted-foreground text-center">Scan QR Code or copy UPI ID</p>
                  <div className="w-52 mx-auto bg-white rounded-xl overflow-hidden">
                    <img src={PAYMENT_DETAILS.upiQrCodeUrl} alt="UPI QR Code" className="w-full h-auto" />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
                    <span className="text-sm text-muted-foreground shrink-0">UPI ID:</span>
                    <code className="flex-1 font-mono text-sm font-medium text-foreground">{PAYMENT_DETAILS.upiId}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyText(PAYMENT_DETAILS.upiId, setCopiedUpi, true)}>
                      {copiedUpi ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* IMPS */}
              {method === "imps" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                  <p className="text-sm text-muted-foreground mb-1">Bank Transfer (IMPS/NEFT):</p>
                  {[
                    { key: "holder",  label: "Account Holder", value: PAYMENT_DETAILS.imps.accountHolder },
                    { key: "account", label: "Account Number", value: PAYMENT_DETAILS.imps.accountNumber },
                    { key: "ifsc",    label: "IFSC Code",      value: PAYMENT_DETAILS.imps.ifsc          },
                    { key: "bank",    label: "Bank Name",      value: PAYMENT_DETAILS.imps.bankName       },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div>
                        <span className="text-xs text-muted-foreground block">{item.label}</span>
                        <span className="font-mono font-medium text-foreground text-sm">{item.value}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyText(item.value, setCopiedImps, item.key)}>
                        {copiedImps === item.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Crypto */}
              {method === "crypto" && cryptoOption && (() => {
                const opt = CRYPTO_OPTIONS.find(o => o.key === cryptoOption)!
                return (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
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
                        <Button size="sm" variant="ghost" onClick={() => copyText(opt.address, setCopiedCrypto, true)} className="shrink-0">
                          {copiedCrypto ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    {opt.isBinance && (
                      <p className="text-xs text-muted-foreground">Send USDT using Binance Pay or internal Binance transfer.</p>
                    )}
                  </div>
                )
              })()}

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setStep("method")} variant="outline" className="flex-1 border-border">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep("upload")} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                  I have paid <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ---- STEP 3: Upload proof ---- */}
          {step === "upload" && (
            <div>
              <h2 className="text-xl font-bold text-foreground text-center mb-1">Upload Payment Proof</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {method === "crypto"
                  ? "Upload your payment screenshot."
                  : "Upload your payment screenshot and enter the UTR number."}
              </p>

              <div className="space-y-4 p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Upload className="w-4 h-4 text-primary" />
                    Payment Screenshot <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    ref={fileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) setScreenshot(e.target.files[0]) }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-dashed border-border hover:border-primary py-6"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {screenshot ? screenshot.name : "Click to upload screenshot"}
                  </Button>
                </div>

                {(method === "upi" || method === "imps") && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Hash className="w-4 h-4 text-primary" />
                      UTR / Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter UTR or Transaction ID"
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep("details")} variant="outline" className="flex-1 border-border">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={onSubmitted}
                  disabled={!canSubmit()}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
                >
                  Submit <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
