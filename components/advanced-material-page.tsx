"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Lock, CheckCircle, ArrowLeft, IndianRupee, BookOpen, LogIn } from "lucide-react"
import {
  type MaterialId,
  type MaterialMeta,
  getSession,
  hasPurchased,
  recordPurchase,
} from "@/lib/material-store"

interface Props {
  meta: MaterialMeta
  previewContent: React.ReactNode
}

type PaymentStep = "locked" | "paying" | "success"

export function AdvancedMaterialPage({ meta, previewContent }: Props) {
  const [session, setSession] = useState<{ id: string; fullName: string } | null>(null)
  const [purchased, setPurchased] = useState(false)
  const [step, setStep] = useState<PaymentStep>("locked")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const s = getSession()
    setSession(s)
    setPurchased(hasPurchased(meta.id as MaterialId))
    setMounted(true)
  }, [meta.id])

  function handleUnlock() {
    if (!session) return
    setStep("paying")
  }

  function handlePaymentSuccess() {
    recordPurchase(meta.id as MaterialId)
    setPurchased(true)
    setStep("success")
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <main className="pt-24 pb-20 px-4">
          <div className="max-w-3xl mx-auto animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded-xl w-1/2" />
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-4 bg-secondary rounded w-2/3" />
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

          {/* Back link */}
          <Link
            href="/material"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Materials
          </Link>

          {/* Page header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{meta.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">{meta.description}</p>
            </div>
          </div>

          {/* ---- PURCHASED: show full content ---- */}
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
              {/* Preview content (always visible) */}
              {previewContent}

              {/* ---- LOCK CARD ---- */}
              <div className="mt-10 rounded-2xl border border-border bg-card overflow-hidden">
                {/* Blurred teaser strip */}
                <div className="relative h-24 overflow-hidden select-none pointer-events-none">
                  <div className="px-6 py-4 space-y-2 opacity-30 blur-sm">
                    <div className="h-3 bg-muted-foreground/40 rounded w-3/4" />
                    <div className="h-3 bg-muted-foreground/40 rounded w-2/3" />
                    <div className="h-3 bg-muted-foreground/40 rounded w-1/2" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>

                {/* Lock card body */}
                <div className="px-6 pb-8 pt-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Unlock Advanced Material
                  </h2>
                  <p className="text-muted-foreground text-sm mb-1">
                    One-time payment for lifetime access.
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-center gap-1 mt-4 mb-6">
                    <IndianRupee className="w-6 h-6 text-primary" />
                    <span className="text-4xl font-extrabold text-primary">
                      {meta.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Not logged in */}
                  {!session ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Please sign in to unlock this material.
                      </p>
                      <Link
                        href="/community"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Link>
                    </div>
                  ) : step === "locked" ? (
                    <button
                      onClick={handleUnlock}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      Unlock for ₹{meta.price.toLocaleString("en-IN")}
                    </button>
                  ) : step === "paying" ? (
                    /* Simulated payment UI */
                    <PaymentSimulator price={meta.price} title={meta.title} onSuccess={handlePaymentSuccess} />
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      Payment successful! Refreshing access…
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// ---- Simulated payment UI ---------------------------------------------------

function PaymentSimulator({
  price,
  title,
  onSuccess,
}: {
  price: number
  title: string
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)

  function handlePay() {
    setLoading(true)
    // Simulate payment processing delay then mark as purchased
    setTimeout(() => {
      setLoading(false)
      onSuccess()
    }, 1800)
  }

  return (
    <div className="text-left rounded-xl border border-border bg-background p-5 space-y-4 max-w-sm mx-auto">
      <p className="text-sm font-semibold text-foreground">Complete Payment</p>

      <div className="flex justify-between text-sm text-muted-foreground border-b border-border pb-3">
        <span>{title}</span>
        <span className="text-foreground font-semibold">₹{price.toLocaleString("en-IN")}</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">UPI ID / Payment Method</label>
        <input
          type="text"
          placeholder="yourname@upi"
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Processing…
          </>
        ) : (
          <>Pay ₹{price.toLocaleString("en-IN")}</>
        )}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Payments are verified manually. Access is granted within 24 hours of confirmation.
      </p>
    </div>
  )
}
