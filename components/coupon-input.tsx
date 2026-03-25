"use client"

import { useState } from "react"
import { Tag, Check, X, Loader2 } from "lucide-react"

export interface AppliedCoupon {
  id:             string
  code:           string
  description:    string
  discountType:   "percent" | "fixed"
  discountPct:    number
  discountAmount: number | null
}

interface CouponInputProps {
  /** e.g. "mentorship" | "vip" — passed to the validate API */
  appliesTo: string
  onApply:   (coupon: AppliedCoupon | null) => void
}

export function CouponInput({ appliesTo, onApply }: CouponInputProps) {
  const [code,    setCode]    = useState("")
  const [status,  setStatus]  = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [applied, setApplied] = useState<AppliedCoupon | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return
    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/coupons/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: code.trim(), applies_to: appliesTo }),
      })
      const json = await res.json()

      if (json.ok) {
        const coupon = json.coupon as AppliedCoupon
        setApplied(coupon)
        setStatus("success")
        setMessage(coupon.description || "Coupon applied successfully!")
        onApply(coupon)
      } else {
        setStatus("error")
        setMessage(json.error || "Invalid coupon code")
        setApplied(null)
        onApply(null)
      }
    } catch {
      setStatus("error")
      setMessage("Could not verify coupon. Please try again.")
      setApplied(null)
      onApply(null)
    }
  }

  const handleRemove = () => {
    setCode("")
    setStatus("idle")
    setMessage("")
    setApplied(null)
    onApply(null)
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-400">
              {applied.code}
              {" — "}
              {applied.discountType === "fixed"
                ? `₹${applied.discountAmount} off`
                : `${applied.discountPct}% off`}
            </p>
            {applied.description && (
              <p className="text-xs text-muted-foreground truncate">{applied.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          aria-label="Remove coupon"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setStatus("idle"); setMessage("") }}
            onKeyDown={e => e.key === "Enter" && handleApply()}
            placeholder="Coupon code (e.g. NEWYEAR50)"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
              status === "error"
                ? "border-red-500/60 focus:ring-red-500/30"
                : "border-border focus:ring-primary/30"
            }`}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || status === "loading"}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Apply
        </button>
      </div>
      {message && (
        <p className={`text-xs flex items-center gap-1.5 ${status === "error" ? "text-red-400" : "text-green-400"}`}>
          {status === "error" ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          {message}
        </p>
      )}
    </div>
  )
}

/**
 * Parse a price string like "₹6,500" or "₹2500 / $30" into a number.
 * Returns 0 if parsing fails.
 */
export function parsePrice(raw: string | undefined | null): number {
  if (!raw) return 0
  // Take the part before "/" to ignore the USD portion
  const inrPart = raw.split("/")[0]
  // Strip everything except digits and dots
  const numeric = inrPart.replace(/[^\d.]/g, "")
  const n = parseFloat(numeric)
  return isNaN(n) ? 0 : n
}

/**
 * Calculate the final price after applying a coupon.
 * `baseAmount` should be a numeric value in INR.
 * Returns { finalAmount, savings }
 */
export function applyDiscount(baseAmount: number, coupon: AppliedCoupon | null) {
  if (!coupon) return { finalAmount: baseAmount, savings: 0 }
  if (coupon.discountType === "fixed" && coupon.discountAmount) {
    const savings = Math.min(coupon.discountAmount, baseAmount)
    return { finalAmount: Math.max(0, baseAmount - savings), savings }
  }
  if (coupon.discountType === "percent" && coupon.discountPct > 0) {
    const savings = Math.round((baseAmount * coupon.discountPct) / 100)
    return { finalAmount: Math.max(0, baseAmount - savings), savings }
  }
  return { finalAmount: baseAmount, savings: 0 }
}
