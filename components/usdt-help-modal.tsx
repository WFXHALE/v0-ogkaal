"use client"

import { useState, useRef } from "react"
import {
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Upload,
  AlertTriangle,
  CheckCircle,
  Send,
  Phone,
  MessageCircle,
  Instagram,
  Mail,
  Wallet,
  CreditCard,
} from "lucide-react"
import { saveSubmission } from "@/lib/admin-submissions"

// ── Types ─────────────────────────────────────────────────────────────────────

type IssueType = "payment_not_received" | "usdt_not_received" | null
type FlowStep = "faq" | "select_issue" | "proof" | "contact" | "fraud_warning" | "success"

const EXCHANGES = [
  "Binance", "Bybit", "Bitget", "MEXC", "KuCoin",
  "CoinDCX", "Delta Exchange", "Trust Wallet", "MetaMask", "Phantom Wallet",
  "Other Wallet (Enter Name)",
]

interface HelpModalProps {
  mode: "buy" | "sell"
  isOpen: boolean
  onClose: () => void
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setOpen(v => !v)}
      className="w-full text-left rounded-xl border border-border bg-secondary/30 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <span className="text-sm font-semibold text-foreground">{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
          {answer}
        </div>
      )}
    </button>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function UsdtHelpModal({ mode, isOpen, onClose }: HelpModalProps) {
  const [flowStep, setFlowStep] = useState<FlowStep>("faq")
  const [issueType, setIssueType] = useState<IssueType>(null)

  // Proof fields
  const [bankStatement, setBankStatement]   = useState<File | null>(null)
  const [upiScreenshot, setUpiScreenshot]   = useState<File | null>(null)
  const [screenRecording, setScreenRecording] = useState<File | null>(null)
  const [walletAddress, setWalletAddress]   = useState("")
  const [exchange, setExchange]             = useState("")
  const [otherWallet, setOtherWallet]       = useState("")

  // Contact fields
  const [phone, setPhone]         = useState("")
  const [telegram, setTelegram]   = useState("")
  const [instagram, setInstagram] = useState("")
  const [email, setEmail]         = useState("")

  const [submitting, setSubmitting] = useState(false)

  const bankRef      = useRef<HTMLInputElement>(null)
  const upiRef       = useRef<HTMLInputElement>(null)
  const recordingRef = useRef<HTMLInputElement>(null)

  const resetAll = () => {
    setFlowStep("faq")
    setIssueType(null)
    setBankStatement(null)
    setUpiScreenshot(null)
    setScreenRecording(null)
    setWalletAddress("")
    setExchange("")
    setOtherWallet("")
    setPhone("")
    setTelegram("")
    setInstagram("")
    setEmail("")
  }

  const handleClose = () => { resetAll(); onClose() }

  const canProceedProof =
    issueType === "payment_not_received"
      ? !!(bankStatement || upiScreenshot || screenRecording)
      : !!(screenRecording && walletAddress && exchange)

  const canProceedContact = !!(phone && telegram)

  const handleSubmit = async () => {
    setSubmitting(true)
    await saveSubmission({
      type: "other",
      name: phone,
      phone,
      telegram,
      details: {
        issueType,
        exchange: exchange === "Other Wallet (Enter Name)" ? otherWallet : exchange,
        walletAddress,
        instagram,
        email,
        mode,
        hasProof: true,
      },
    })
    setSubmitting(false)
    setFlowStep("success")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">
              {mode === "buy" ? "Buy" : "Sell"} USDT — Help & Support
            </span>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1">

          {/* ── STEP: FAQ ─────────────────────────────────────────────────── */}
          {flowStep === "faq" && (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Check the common questions below. If your issue is not resolved within 24 hours, you can submit a dispute.
              </p>

              <div className="space-y-2">
                <FaqItem
                  question="Payment Delay"
                  answer="If your payment has not been received yet, please wait up to 24 hours. Our system may still be processing the transaction due to high volume."
                />
                <FaqItem
                  question="USDT Delay"
                  answer="If your USDT has not arrived yet, please wait. Blockchain confirmations or system processing may take some time. TRC20 / BEP20 confirmations can take a few minutes up to a few hours during peak times."
                />
                <FaqItem
                  question="How do I check my transaction status?"
                  answer="For USDT, use a block explorer (e.g. Tronscan for TRC20, BscScan for BEP20) and enter your wallet address to view incoming transactions."
                />
                <FaqItem
                  question="Wrong wallet address submitted?"
                  answer="Contact us immediately on Telegram @OGKAAL or Instagram @OGKAALTRADER. Do not submit another order. We will attempt to recover the funds if possible."
                />
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
                If your issue persists after 24 hours, tap the button below to submit a dispute with proof.
              </div>

              <button
                onClick={() => setFlowStep("select_issue")}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Problem Still Exists? Submit Dispute
              </button>
            </>
          )}

          {/* ── STEP: SELECT ISSUE ────────────────────────────────────────── */}
          {flowStep === "select_issue" && (
            <>
              <p className="text-sm font-semibold text-foreground">Select your issue type</p>
              <p className="text-sm text-muted-foreground">Choose the issue that best describes your problem.</p>

              <div className="space-y-3 mt-2">
                <button
                  onClick={() => { setIssueType("payment_not_received"); setFlowStep("proof") }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Payment Not Received</p>
                    <p className="text-xs text-muted-foreground mt-0.5">I sent payment but did not receive USDT / INR</p>
                  </div>
                </button>

                <button
                  onClick={() => { setIssueType("usdt_not_received"); setFlowStep("proof") }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">USDT Not Received</p>
                    <p className="text-xs text-muted-foreground mt-0.5">My USDT has not arrived in my wallet or exchange</p>
                  </div>
                </button>
              </div>

              <button onClick={() => setFlowStep("faq")} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
                Back to FAQ
              </button>
            </>
          )}

          {/* ── STEP: PROOF ───────────────────────────────────────────────── */}
          {flowStep === "proof" && (
            <>
              <p className="text-sm font-semibold text-foreground">
                {issueType === "payment_not_received" ? "Payment Not Received — Upload Proof" : "USDT Not Received — Upload Proof"}
              </p>

              {issueType === "payment_not_received" && (
                <>
                  <p className="text-sm text-muted-foreground">Upload at least one of the following:</p>

                  {/* Bank Statement */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bank Statement Screenshot</label>
                    <div
                      onClick={() => bankRef.current?.click()}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-secondary/20 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{bankStatement ? bankStatement.name : "Tap to upload"}</span>
                    </div>
                    <input ref={bankRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => setBankStatement(e.target.files?.[0] ?? null)} />
                  </div>

                  {/* UPI Screenshot */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">UPI Transaction Screenshot</label>
                    <div
                      onClick={() => upiRef.current?.click()}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-secondary/20 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{upiScreenshot ? upiScreenshot.name : "Tap to upload"}</span>
                    </div>
                    <input ref={upiRef} type="file" accept="image/*" className="hidden" onChange={e => setUpiScreenshot(e.target.files?.[0] ?? null)} />
                  </div>

                  {/* Screen Recording */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Screen Recording of Transaction</label>
                    <div
                      onClick={() => recordingRef.current?.click()}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-secondary/20 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{screenRecording ? screenRecording.name : "Tap to upload"}</span>
                    </div>
                    <input ref={recordingRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => setScreenRecording(e.target.files?.[0] ?? null)} />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Recording must clearly show: (1) the UPI / banking app, (2) transaction details, (3) transaction ID.
                    </p>
                  </div>
                </>
              )}

              {issueType === "usdt_not_received" && (
                <>
                  {/* Exchange / Wallet dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Exchange / Wallet Used</label>
                    <select
                      value={exchange}
                      onChange={e => setExchange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      <option value="">Select exchange or wallet</option>
                      {EXCHANGES.map(ex => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                  </div>

                  {exchange === "Other Wallet (Enter Name)" && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Enter Wallet / Exchange Name</label>
                      <input
                        type="text"
                        value={otherWallet}
                        onChange={e => setOtherWallet(e.target.value)}
                        placeholder="e.g. OKX, Tokenpocket..."
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                  )}

                  {/* Wallet Address */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Wallet Address Used</label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={e => setWalletAddress(e.target.value)}
                      placeholder="Paste your wallet address"
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
                    />
                  </div>

                  {/* Screen Recording */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Screen Recording Upload</label>
                    <div
                      onClick={() => recordingRef.current?.click()}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-secondary/20 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{screenRecording ? screenRecording.name : "Tap to upload recording"}</span>
                    </div>
                    <input ref={recordingRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => setScreenRecording(e.target.files?.[0] ?? null)} />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Recording must show: (1) wallet or exchange dashboard, (2) wallet address used, (3) transaction history proving USDT has not arrived.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setFlowStep("select_issue")}
                  className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setFlowStep("contact")}
                  disabled={!canProceedProof}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* ── STEP: CONTACT ─────────────────────────────────────────────── */}
          {flowStep === "contact" && (
            <>
              <p className="text-sm font-semibold text-foreground">Your Contact Information</p>
              <p className="text-sm text-muted-foreground">
                Please provide your contact information so our team can contact you regarding this issue.
              </p>

              <div className="space-y-3 mt-1">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:ring-2 focus-within:ring-primary/50">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Telegram Username / ID <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:ring-2 focus-within:ring-primary/50">
                    <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@yourusername" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Instagram Username</label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:ring-2 focus-within:ring-primary/50">
                    <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourusername" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:ring-2 focus-within:ring-primary/50">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setFlowStep("proof")} className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back
                </button>
                <button
                  onClick={() => setFlowStep("fraud_warning")}
                  disabled={!canProceedContact}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  Review & Submit
                </button>
              </div>
            </>
          )}

          {/* ── STEP: FRAUD WARNING ───────────────────────────────────────── */}
          {flowStep === "fraud_warning" && (
            <>
              <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-400 text-sm">Important Notice</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      If you are submitting false information or attempting fraud, your account will be immediately frozen, and your case may be reported to Cyber Crime authorities under applicable fraud and digital crime sections.
                    </p>
                    <p className="text-sm text-red-300 mt-2 font-medium">
                      Submitting fake proof or misleading information may lead to legal action.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground text-sm">If this is a mistake or you submitted incorrect information, please contact us immediately on:</p>
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-primary" /> Telegram: <a href="https://t.me/ogkaal" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">@OGKAAL</a></p>
                  <p className="flex items-center gap-2"><Instagram className="w-3.5 h-3.5 text-primary" /> Instagram: <a href="https://instagram.com/ogkaaltrader" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">@OGKAALTRADER</a></p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setFlowStep("contact")} className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? "Submitting..." : (<><Send className="w-4 h-4" /> I Understand, Submit</>)}
                </button>
              </div>
            </>
          )}

          {/* ── STEP: SUCCESS ─────────────────────────────────────────────── */}
          {flowStep === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">Proof Submitted</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Your proof has been submitted successfully.<br />
                  Our team will review the issue and respond within 24 hours.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4 text-sm text-left space-y-2">
                <p className="font-medium text-foreground text-sm">Contact us directly:</p>
                <p className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="w-3.5 h-3.5 text-primary" /> <a href="https://t.me/ogkaal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@OGKAAL on Telegram</a></p>
                <p className="flex items-center gap-2 text-muted-foreground"><Instagram className="w-3.5 h-3.5 text-primary" /> <a href="https://instagram.com/ogkaaltrader" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@OGKAALTRADER on Instagram</a></p>
              </div>

              <button onClick={handleClose} className="w-full py-3 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/70 transition-colors">
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
