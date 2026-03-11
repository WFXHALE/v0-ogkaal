"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Building2, ChevronDown, ChevronUp, Check, X,
  AlertCircle, Search, Filter, ExternalLink, Copy, CheckCheck, Tag,
} from "lucide-react"

// ── Featured / Recommended Firms ──────────────────────────────────────────────

type FeaturedFirm = {
  id: string
  name: string
  rating: number
  description: string
  referralLink: string
  discountCode?: string
  logoUrl?: string
  logoAlt?: string
}

const FEATURED_FIRMS: FeaturedFirm[] = [
  {
    id:           "fundingpips",
    name:         "FundingPips",
    rating:       4.3,
    description:  "Two-step and rapid challenges with trader-friendly static drawdown rules, no consistency rule, and bi-weekly payouts.",
    referralLink: "https://app.fundingpips.com/register?ref=2d35d78b",
    discountCode: "2d35d78b",
    logoUrl:      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-11%20at%202.07.29%E2%80%AFPM-Fll2JdGmjy43ZO2BP9QKWzCPHglqcf.png",
    logoAlt:      "FundingPips logo",
  },
  {
    id:           "goatfunded",
    name:         "Goat Funded Trader",
    rating:       4.54,
    description:  "1-Step, 2-Step and Instant models with 100% refundable fees, on-demand payouts, and up to 100% profit split.",
    referralLink: "https://checkout.goatfundedtrader.com/aff/swargakai@gmail.com/",
    logoUrl:      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-11%20at%202.07.38%E2%80%AFPM-Asm8LaMbSgw3VDJOPdJ7aLLJmDxihM.png",
    logoAlt:      "Goat Funded Trader logo",
  },
  {
    id:           "blueberry",
    name:         "Blueberry Funded",
    rating:       3.8,
    description:  "Broker-backed prop firm with 2-Step, 1-Step and Instant Elite models. No consistency rule, weekend holding allowed.",
    referralLink: "https://blueberryfunded.com/?utm_source=affiliate&ref=6538",
    logoUrl:      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-11%20at%202.07.11%E2%80%AFPM-pUuxSCUjpCyGlmrY2OQ8EBEwhwyJha.png",
    logoAlt:      "Blueberry Funded logo",
  },
]

// ── FeaturedFirmCard ───────────────────────────────────────────────────────────

function FeaturedFirmCard({ firm }: { firm: FeaturedFirm }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!firm.discountCode) return
    navigator.clipboard.writeText(firm.discountCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="relative flex flex-col rounded-2xl border border-primary/20 bg-card overflow-hidden shadow-md shadow-black/10 transition-shadow hover:shadow-lg hover:shadow-black/20">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <div className="h-32 bg-secondary/30 flex items-center justify-center overflow-hidden border-b border-border/50">
        {firm.logoUrl ? (
          <img src={firm.logoUrl} alt={firm.logoAlt ?? firm.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Building2 className="w-8 h-8 text-primary/50" />
            <span className="text-xs text-muted-foreground font-medium">{firm.name}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 gap-3 p-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-foreground text-base leading-tight">{firm.name}</h3>
            <StarRating rating={firm.rating} />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{firm.description}</p>
        </div>
        {firm.discountCode && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
            <Tag className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Code</span>
            <span className="flex-1 font-mono text-xs font-bold text-primary tracking-wider">{firm.discountCode}</span>
          </div>
        )}
        <div className="flex flex-col gap-2 mt-auto pt-1">
          <a
            href={firm.referralLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[.98] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buy Account
          </a>
          {firm.discountCode && (
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/8 text-primary text-sm font-semibold hover:bg-primary/15 active:scale-[.98] transition-all"
            >
              {copied
                ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</>
                : <><Copy className="w-3.5 h-3.5" /> Copy Discount Code</>}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountModel = {
  profitTarget:   string | null
  dailyDrawdown:  string
  maxDrawdown:    string
  minTradingDays: number           // 0 = no minimum
  timeLimit:      string           // "No limit", "30 days", etc.
  drawdownType:   "Static" | "Trailing" | "Both"
}

// Per-size pricing: size label → { price, promoCode? }
type SizePricing = Record<string, { price: string; promoCode?: string }>

type PropFirmData = {
  id: string
  name: string
  website: string
  rating?: number
  accountSizes: string[]
  profitSplit: string
  payoutFrequency: string
  drawdownType: "Static" | "Trailing" | "Both"   // overall/firm level badge
  consistencyRule: boolean
  weekendHolding: boolean
  overnightHolding: boolean
  twoStep:        AccountModel | null
  oneStep:        AccountModel | null
  instantFunding: AccountModel | null
  // Pricing per account size, per model type
  pricing: {
    twoStep?:        SizePricing
    oneStep?:        SizePricing
    instantFunding?: SizePricing
  }
}

// ── Data ──────────────────────────────────────────────────────────────────────
// Sources: official firm websites. Last verified March 2026.
// Rules and prices change — always confirm on the firm's site before purchasing.

const FIRMS: PropFirmData[] = [

  // ── FTMO ──────────────────────────────────────────────────────────────────
  // ftmo.com — 2-Step and new 1-Step models.
  // 2-Step: Phase 1 10% / Phase 2 5%, 5% daily (static), 10% max (static), 4 min days.
  // 1-Step: 10% target, 5% daily, 10% max (trailing from balance), 4 min days.
  // Pricing source: ftmo.com/en/get-funded/ (approximate, varies by currency)
  {
    id: "ftmo",
    name: "FTMO",
    website: "https://ftmo.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand (14-day min)",
    drawdownType: "Both",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "5% (Static, balance-based)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 4,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Static, balance-based)",
      maxDrawdown:    "10% (Trailing from balance)",
      minTradingDays: 4,
      timeLimit:      "No limit",
      drawdownType:   "Both",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$10K":  { price: "$155" },
        "$25K":  { price: "$250" },
        "$50K":  { price: "$345" },
        "$100K": { price: "$540" },
        "$200K": { price: "$1,080" },
      },
      oneStep: {
        "$10K":  { price: "$99" },
        "$25K":  { price: "$199" },
        "$50K":  { price: "$299" },
        "$100K": { price: "$499" },
        "$200K": { price: "$999" },
      },
    },
  },

  // ── The 5%ers ─────────────────────────────────────────────────────────────
  // the5ers.com — Hyper Growth (1-Step) & High Stakes (2-Step).
  // Trailing stop-out (not daily drawdown) — 6% from highest equity.
  // No Instant Funding model.
  {
    id: "the5ers",
    name: "The 5%ers",
    rating: 4.8,
    website: "https://the5ers.com",
    accountSizes: ["$5K", "$10K", "$20K"],
    profitSplit: "Up to 100%",
    payoutFrequency: "On demand (after 14 days)",
    drawdownType: "Trailing",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "3% (Daily trading pause)",
      maxDrawdown:    "6% (Trailing stop-out from equity)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "3% (Daily trading pause)",
      maxDrawdown:    "6% (Trailing stop-out from equity)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$5K":  { price: "$95" },
        "$10K": { price: "$165" },
        "$20K": { price: "$270" },
      },
      oneStep: {
        "$5K":  { price: "$75" },
        "$10K": { price: "$130" },
        "$20K": { price: "$215" },
      },
    },
  },

  // ── E8 Markets ────────────────────────────────────────────────────────────
  // e8markets.com — E8 Evaluation (1-Step only).
  // 8% profit target, 5% trailing daily, 8% trailing max drawdown.
  // Consistency rule: no single day > 50% of total profit.
  {
    id: "e8markets",
    name: "E8 Markets",
    rating: 4.8,
    website: "https://e8markets.com",
    accountSizes: ["$25K", "$50K", "$100K", "$200K", "$400K"],
    profitSplit: "Up to 80%",
    payoutFrequency: "On demand (after 8 days)",
    drawdownType: "Trailing",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: null,
    oneStep: {
      profitTarget:   "8%",
      dailyDrawdown:  "5% (Trailing from balance)",
      maxDrawdown:    "8% (Trailing from balance)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    instantFunding: null,
    pricing: {
      oneStep: {
        "$25K":  { price: "$148" },
        "$50K":  { price: "$228" },
        "$100K": { price: "$388" },
        "$200K": { price: "$688" },
        "$400K": { price: "$1,288" },
      },
    },
  },

  // ── FundingPips ───────────────────────────────────────────────────────────
  // fundingpips.com — Standard (2-Step) and Rapid (1-Step).
  // 2-Step: 8%/5% targets, 4% daily, 8% max (Static). No min trading days.
  // 1-Step: 10% target, 5% daily, 10% max (Static). No min trading days.
  {
    id: "fundingpips",
    name: "FundingPips",
    rating: 4.3,
    website: "https://fundingpips.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 5% P2",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$5K":   { price: "$32", promoCode: "2d35d78b" },
        "$10K":  { price: "$59", promoCode: "2d35d78b" },
        "$25K":  { price: "$119", promoCode: "2d35d78b" },
        "$50K":  { price: "$199", promoCode: "2d35d78b" },
        "$100K": { price: "$349", promoCode: "2d35d78b" },
      },
      oneStep: {
        "$5K":   { price: "$49", promoCode: "2d35d78b" },
        "$10K":  { price: "$89", promoCode: "2d35d78b" },
        "$25K":  { price: "$169", promoCode: "2d35d78b" },
        "$50K":  { price: "$289", promoCode: "2d35d78b" },
        "$100K": { price: "$499", promoCode: "2d35d78b" },
      },
    },
  },

  // ── BrightFunded ──────────────────────────────────────────────────────────
  // brightfunded.com — 2-Step Standard Challenge only.
  {
    id: "brightfunded",
    name: "BrightFunded",
    website: "https://brightfunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 100%",
    payoutFrequency: "14 days (1st: 30 days)",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 5% P2",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 5,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: null,
    instantFunding: null,
    pricing: {
      twoStep: {
        "$5K":   { price: "$39" },
        "$10K":  { price: "$69" },
        "$25K":  { price: "$139" },
        "$50K":  { price: "$259" },
        "$100K": { price: "$459" },
        "$200K": { price: "$849" },
      },
    },
  },

  // ── Alpha Capital ─────────────────────────────────────────────────────────
  // alphacapitalgroup.uk — 2-Step Evaluation.
  // 10%/5% targets, 5% daily (static), 10% max (static). Min 1 trading day.
  {
    id: "alphacapital",
    name: "Alpha Capital",
    rating: 4.4,
    website: "https://alphacapitalgroup.uk",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 1,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: null,
    instantFunding: null,
    pricing: {
      twoStep: {
        "$10K":  { price: "$79" },
        "$25K":  { price: "$149" },
        "$50K":  { price: "$249" },
        "$100K": { price: "$399" },
        "$200K": { price: "$699" },
      },
    },
  },

  // ── FundedNext ────────────────────────────────────────────────────────────
  // fundednext.com — Stellar 2-Step and Express 1-Step.
  // 2-Step: 10%/5%, 5% daily (from balance), 10% max trailing on funded.
  // 1-Step: 10%, 5% daily (from balance), 10% max trailing.
  // 30% consistency rule (no single day > 30% of total profit).
  {
    id: "fundednext",
    name: "FundedNext",
    rating: 4.4,
    website: "https://fundednext.com",
    accountSizes: ["$6K", "$15K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 95%",
    payoutFrequency: "On demand (after 5 days)",
    drawdownType: "Trailing",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "5% (from balance)",
      maxDrawdown:    "10% (Trailing on funded account)",
      minTradingDays: 5,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (from balance)",
      maxDrawdown:    "10% (Trailing)",
      minTradingDays: 5,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$6K":   { price: "$39" },
        "$15K":  { price: "$89" },
        "$25K":  { price: "$129" },
        "$50K":  { price: "$219" },
        "$100K": { price: "$379" },
        "$200K": { price: "$699" },
      },
      oneStep: {
        "$6K":   { price: "$49" },
        "$15K":  { price: "$109" },
        "$25K":  { price: "$159" },
        "$50K":  { price: "$269" },
        "$100K": { price: "$459" },
        "$200K": { price: "$849" },
      },
    },
  },

  // ── Goat Funded Trader ────────────────────────────────────────────────────
  // goatfundedtrader.com — 1-Step (Goat Blitz), 2-Step (Standard), Instant.
  // Verified pricing from official site (March 2026, discounted prices shown).
  // 1-Step: 10% target, 4% daily, 6% max (Static). Bi-weekly payouts, 80% split.
  // 2-Step: 8% P1 / 6% P2, 4% daily, 10% max (Static). Up to 100% split.
  // Instant: No target, 4% daily, 6% max (Static).
  {
    id: "goatfunded",
    name: "Goat Funded Trader",
    rating: 4.54,
    website: "https://goatfundedtrader.com",
    accountSizes: ["$5K", "$10K", "$15K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 100%",
    payoutFrequency: "Bi-weekly (add-on: on demand)",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 6% P2",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "6% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: {
      profitTarget:   null,
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "6% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    pricing: {
      twoStep: {
        "$5K":   { price: "$17" },
        "$10K":  { price: "$36" },
        "$15K":  { price: "$49" },
        "$25K":  { price: "$85" },
        "$50K":  { price: "$158" },
        "$100K": { price: "$295" },
        "$200K": { price: "$549" },
      },
      oneStep: {
        "$15K":  { price: "$115" },
        "$25K":  { price: "$161" },
        "$50K":  { price: "$232" },
        "$100K": { price: "$440" },
        "$200K": { price: "$713" },
      },
      instantFunding: {
        "$5K":   { price: "$25" },
        "$10K":  { price: "$45" },
        "$15K":  { price: "$65" },
        "$25K":  { price: "$99" },
        "$50K":  { price: "$175" },
        "$100K": { price: "$325" },
        "$200K": { price: "$599" },
      },
    },
  },

  // ── Blueberry Funded ──────────────────────────────────────────────────────
  // blueberryfunded.com — Prime (2-Step), 1-Step, Instant Elite.
  // 2-Step Prime: 8% P1 / 6% P2, 4% daily, 10% max (Static). 5 min days.
  // 1-Step: 10% target, 4% daily, 6% max (Static). 3 min days.
  // Instant Elite: No target, 2% daily, 3% trailing max. 20% consistency score.
  // 80% profit split. No news trading restriction. Weekend holding allowed.
  {
    id: "blueberryfunded",
    name: "Blueberry Funded",
    rating: 3.8,
    website: "https://blueberryfunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "80%",
    payoutFrequency: "14 days",
    drawdownType: "Both",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 6% P2",
      dailyDrawdown:  "4% (Static, balance/equity)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 5,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "6% (Static)",
      minTradingDays: 3,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: {
      profitTarget:   null,
      dailyDrawdown:  "2% (Static, balance/equity)",
      maxDrawdown:    "3% (Trailing from highest equity)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    pricing: {
      twoStep: {
        "$5K":   { price: "$39" },
        "$10K":  { price: "$69" },
        "$25K":  { price: "$139" },
        "$50K":  { price: "$239" },
        "$100K": { price: "$419" },
        "$200K": { price: "$749" },
      },
      oneStep: {
        "$5K":   { price: "$49" },
        "$10K":  { price: "$89" },
        "$25K":  { price: "$169" },
        "$50K":  { price: "$299" },
        "$100K": { price: "$519" },
        "$200K": { price: "$929" },
      },
      instantFunding: {
        "$5K":   { price: "$35" },
        "$10K":  { price: "$60" },
        "$25K":  { price: "$120" },
        "$50K":  { price: "$210" },
        "$100K": { price: "$370" },
        "$200K": { price: "$660" },
      },
    },
  },

  // ── Maven Trading ─────────────────────────────────────────────────────────
  // maventrading.com — verified directly from official site (March 2026).
  // 1-Step: 8% target, 3% daily, 5% trailing (from highest equity). 0 min days. $15/$19 by size.
  // 2-Step: 8%/5% targets, 4% daily, 8% static max. 3 min profitable days. $19/$22 by size.
  // Instant: 3% min withdraw, 2% daily, 3% trailing max. 20% consistency score. $15 for $2K.
  // Mini: No challenge, 2% daily, consistency score. Payout available after purchase.
  // All models: 80% split, 10 business day payouts, 75:1 leverage.
  {
    id: "maventrading",
    name: "Maven Trading",
    rating: 4.3,
    website: "https://maventrading.com",
    accountSizes: ["$2K", "$5K", "$10K", "$20K", "$50K", "$100K"],
    profitSplit: "80%",
    payoutFrequency: "10 Business Days",
    drawdownType: "Both",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 5% P2",
      dailyDrawdown:  "4% (Static, balance/equity at EOD)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 3,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "8%",
      dailyDrawdown:  "3% (Static, balance/equity at EOD)",
      maxDrawdown:    "5% (Trailing from highest equity)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Both",
    },
    instantFunding: {
      profitTarget:   null,
      dailyDrawdown:  "2% (Static, balance/equity at EOD)",
      maxDrawdown:    "3% (Trailing from highest equity)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Both",
    },
    pricing: {
      twoStep: {
        "$2K":   { price: "$19" },
        "$5K":   { price: "$19" },
        "$10K":  { price: "$19" },
        "$20K":  { price: "$22" },
        "$50K":  { price: "$35" },
        "$100K": { price: "$49" },
      },
      oneStep: {
        "$2K":   { price: "$15" },
        "$5K":   { price: "$15" },
        "$10K":  { price: "$15" },
        "$20K":  { price: "$19" },
        "$50K":  { price: "$29" },
        "$100K": { price: "$39" },
      },
      instantFunding: {
        "$2K":   { price: "$13" },
        "$5K":   { price: "$13" },
        "$10K":  { price: "$15" },
        "$20K":  { price: "$15" },
        "$50K":  { price: "$19" },
        "$100K": { price: "$25" },
      },
    },
  },

  // ── Blue Guardian ─────────────────────────────────────────────────────────
  // blueguardian.com — Instant, 1-Step, 2-Step, 3-Step.
  // Verified pricing from official site (March 2026).
  // Instant $5K: $59, $10K: $81, $25K: $169, $50K: $263. Up to 90% split.
  // Promo code active: FEB (45% OFF $5K–$50K) / FEB35 (35% OFF $100K–$400K).
  {
    id: "blueguardian",
    name: "Blue Guardian",
    website: "https://blueguardian.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K", "$300K", "$400K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Instant / On demand",
    drawdownType: "Both",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 5% P2",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: {
      profitTarget:   null,
      dailyDrawdown:  "3% (Static)",
      maxDrawdown:    "6% (Trailing from highest equity)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Both",
    },
    pricing: {
      instantFunding: {
        "$5K":   { price: "$59",   promoCode: "FEB" },
        "$10K":  { price: "$81",   promoCode: "FEB" },
        "$25K":  { price: "$169",  promoCode: "FEB" },
        "$50K":  { price: "$263",  promoCode: "FEB" },
        "$100K": { price: "$399",  promoCode: "FEB35" },
        "$200K": { price: "$699",  promoCode: "FEB35" },
        "$300K": { price: "$999",  promoCode: "FEB35" },
        "$400K": { price: "$1,299", promoCode: "FEB35" },
      },
      oneStep: {
        "$5K":   { price: "$69",  promoCode: "FEB" },
        "$10K":  { price: "$99",  promoCode: "FEB" },
        "$25K":  { price: "$199", promoCode: "FEB" },
        "$50K":  { price: "$329", promoCode: "FEB" },
        "$100K": { price: "$499", promoCode: "FEB35" },
        "$200K": { price: "$899", promoCode: "FEB35" },
      },
      twoStep: {
        "$5K":   { price: "$49",  promoCode: "FEB" },
        "$10K":  { price: "$79",  promoCode: "FEB" },
        "$25K":  { price: "$159", promoCode: "FEB" },
        "$50K":  { price: "$269", promoCode: "FEB" },
        "$100K": { price: "$399", promoCode: "FEB35" },
        "$200K": { price: "$749", promoCode: "FEB35" },
      },
    },
  },

  // ── Instant Funding ───────────────────────────────────────────────────────
  // instantfunding.io — Instant-only (no evaluation).
  {
    id: "instantfunding",
    name: "Instant Funding",
    rating: 3.8,
    website: "https://instantfunding.io",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand",
    drawdownType: "Static",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: null,
    oneStep: null,
    instantFunding: {
      profitTarget:   null,
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    pricing: {
      instantFunding: {
        "$5K":   { price: "$39" },
        "$10K":  { price: "$69" },
        "$25K":  { price: "$129" },
        "$50K":  { price: "$219" },
        "$100K": { price: "$379" },
      },
    },
  },

  // ── FXIFY ─────────────────────────────────────────────────────────────────
  // fxify.com — 1-Phase, 2-Phase, Instant Funding.
  // 2-Phase: 10%/5%, 5% daily, 10% max. On-demand payouts from day 1 funded.
  // 1-Phase: 10%, 5% daily, 10% max. No consistency rule. Weekend holding OK.
  // Instant: No target, no daily limit stated, 10% max.
  {
    id: "fxify",
    name: "FXIFY",
    website: "https://fxify.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K", "$400K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand (from day 1 funded)",
    drawdownType: "Both",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "5% (Static or Trailing — choice at purchase)",
      maxDrawdown:    "10% (Static or Trailing — choice at purchase)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Both",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Static or Trailing — choice at purchase)",
      maxDrawdown:    "10% (Static or Trailing — choice at purchase)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Both",
    },
    instantFunding: {
      profitTarget:   null,
      dailyDrawdown:  "No stated daily limit",
      maxDrawdown:    "10%",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    pricing: {
      twoStep: {
        "$5K":   { price: "$49" },
        "$10K":  { price: "$89" },
        "$25K":  { price: "$179" },
        "$50K":  { price: "$299" },
        "$100K": { price: "$499" },
        "$200K": { price: "$899" },
        "$400K": { price: "$1,699" },
      },
      oneStep: {
        "$5K":   { price: "$59" },
        "$10K":  { price: "$109" },
        "$25K":  { price: "$219" },
        "$50K":  { price: "$369" },
        "$100K": { price: "$619" },
        "$200K": { price: "$1,099" },
        "$400K": { price: "$2,099" },
      },
      instantFunding: {
        "$5K":   { price: "$79" },
        "$10K":  { price: "$149" },
        "$25K":  { price: "$299" },
        "$50K":  { price: "$499" },
        "$100K": { price: "$849" },
        "$200K": { price: "$1,499" },
        "$400K": { price: "$2,799" },
      },
    },
  },

  // ── Aqua Funded ───────────────────────────────────────────────────────────
  {
    id: "aquafunded",
    name: "Aqua Funded",
    website: "https://aquafunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 5% P2",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$5K":   { price: "$39" },
        "$10K":  { price: "$69" },
        "$25K":  { price: "$129" },
        "$50K":  { price: "$229" },
        "$100K": { price: "$399" },
      },
      oneStep: {
        "$5K":   { price: "$49" },
        "$10K":  { price: "$89" },
        "$25K":  { price: "$169" },
        "$50K":  { price: "$289" },
        "$100K": { price: "$499" },
      },
    },
  },

  // ── TopTier Trader ────────────────────────────────────────────────────────
  {
    id: "toptiertrader",
    name: "TopTier Trader",
    website: "https://toptiertrader.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Trailing",
    consistencyRule: true,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "5% (Trailing)",
      maxDrawdown:    "10% (Trailing)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Trailing)",
      maxDrawdown:    "10% (Trailing)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Trailing",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$5K":   { price: "$49" },
        "$10K":  { price: "$89" },
        "$25K":  { price: "$169" },
        "$50K":  { price: "$299" },
        "$100K": { price: "$499" },
        "$200K": { price: "$899" },
      },
      oneStep: {
        "$5K":   { price: "$59" },
        "$10K":  { price: "$109" },
        "$25K":  { price: "$199" },
        "$50K":  { price: "$349" },
        "$100K": { price: "$599" },
        "$200K": { price: "$1,099" },
      },
    },
  },

  // ── Finotive Funding ──────────────────────────────────────────────────────
  {
    id: "finotive",
    name: "Finotive Funding",
    website: "https://finotivefunding.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Monthly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 5% P2",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "8%",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: {
      profitTarget:   null,
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    pricing: {
      twoStep: {
        "$5K":   { price: "$29" },
        "$10K":  { price: "$55" },
        "$25K":  { price: "$119" },
        "$50K":  { price: "$199" },
        "$100K": { price: "$349" },
        "$200K": { price: "$649" },
      },
      oneStep: {
        "$5K":   { price: "$39" },
        "$10K":  { price: "$69" },
        "$25K":  { price: "$149" },
        "$50K":  { price: "$249" },
        "$100K": { price: "$449" },
        "$200K": { price: "$849" },
      },
      instantFunding: {
        "$5K":   { price: "$59" },
        "$10K":  { price: "$99" },
        "$25K":  { price: "$199" },
        "$50K":  { price: "$349" },
        "$100K": { price: "$599" },
        "$200K": { price: "$1,099" },
      },
    },
  },

  // ── For Traders ───────────────────────────────────────────────────────────
  {
    id: "fortraders",
    name: "For Traders",
    website: "https://fortraders.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: null,
    instantFunding: null,
    pricing: {
      twoStep: {
        "$10K":  { price: "$89" },
        "$25K":  { price: "$169" },
        "$50K":  { price: "$299" },
        "$100K": { price: "$499" },
        "$200K": { price: "$899" },
      },
    },
  },

  // ── Breakout Prop ─────────────────────────────────────────────────────────
  {
    id: "breakout",
    name: "Breakout Prop",
    website: "https://breakoutprop.com",
    accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 4% P2",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "8%",
      dailyDrawdown:  "4% (Static)",
      maxDrawdown:    "8% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$10K":  { price: "$79" },
        "$25K":  { price: "$149" },
        "$50K":  { price: "$259" },
        "$100K": { price: "$449" },
        "$200K": { price: "$799" },
      },
      oneStep: {
        "$10K":  { price: "$99" },
        "$25K":  { price: "$189" },
        "$50K":  { price: "$329" },
        "$100K": { price: "$569" },
        "$200K": { price: "$999" },
      },
    },
  },

  // ── Funded Elite ──────────────────────────────────────────────────────────
  {
    id: "fundedelite",
    name: "Funded Elite",
    website: "https://fundedelite.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "8% P1 / 5% P2",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$5K":   { price: "$39" },
        "$10K":  { price: "$69" },
        "$25K":  { price: "$139" },
        "$50K":  { price: "$249" },
        "$100K": { price: "$429" },
        "$200K": { price: "$779" },
      },
      oneStep: {
        "$5K":   { price: "$49" },
        "$10K":  { price: "$89" },
        "$25K":  { price: "$169" },
        "$50K":  { price: "$299" },
        "$100K": { price: "$519" },
        "$200K": { price: "$949" },
      },
    },
  },

  // ── QT Funded ─────────────────────────────────────────────────────────────
  {
    id: "qtfunded",
    name: "QT Funded",
    rating: 3.9,
    website: "https://qtfunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K"],
    profitSplit: "Up to 85%",
    payoutFrequency: "Bi-weekly",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: {
      profitTarget:   "10% P1 / 5% P2",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    oneStep: {
      profitTarget:   "10%",
      dailyDrawdown:  "5% (Static)",
      maxDrawdown:    "10% (Static)",
      minTradingDays: 0,
      timeLimit:      "No limit",
      drawdownType:   "Static",
    },
    instantFunding: null,
    pricing: {
      twoStep: {
        "$5K":   { price: "$39" },
        "$10K":  { price: "$69" },
        "$25K":  { price: "$129" },
        "$50K":  { price: "$219" },
        "$100K": { price: "$379" },
      },
      oneStep: {
        "$5K":   { price: "$49" },
        "$10K":  { price: "$89" },
        "$25K":  { price: "$169" },
        "$50K":  { price: "$289" },
        "$100K": { price: "$499" },
      },
    },
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full    = Math.floor(rating)
  const partial = rating - full
  const empty   = 5 - full - (partial > 0 ? 1 : 0)
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      {partial > 0 && (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id={`partial-${rating}`}>
              <stop offset={`${partial * 100}%`} stopColor="rgb(251 191 36)" />
              <stop offset={`${partial * 100}%`} stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill={`url(#partial-${rating})`} stroke="rgb(251 191 36)" strokeWidth="1.5"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className="w-3.5 h-3.5 text-border" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="none" stroke="currentColor" strokeWidth="1.5"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span className="text-[11px] font-semibold text-amber-400 ml-1">{rating.toFixed(1)}</span>
    </span>
  )
}

const YesNo = ({ value, size = "sm" }: { value: boolean; size?: "sm" | "xs" }) => (
  value
    ? <span className={`inline-flex items-center gap-1 font-semibold text-emerald-400 ${size === "xs" ? "text-[11px]" : "text-xs"}`}>
        <Check className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.5} /> Yes
      </span>
    : <span className={`inline-flex items-center gap-1 font-semibold text-red-400 ${size === "xs" ? "text-[11px]" : "text-xs"}`}>
        <X className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.5} /> No
      </span>
)

const DrawdownTypeBadge = ({ type }: { type: "Static" | "Trailing" | "Both" }) => {
  const map = {
    Static:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
    Trailing: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    Both:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-semibold ${map[type]}`}>{type}</span>
  )
}

// ── RuleRow: a key/value row in the rules panel ────────────────────────────────
function RuleRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-bold text-foreground text-right">{value}</span>
    </div>
  )
}

// ── CopyCode ──────────────────────────────────────────────────────────────────
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-primary text-[11px] font-mono font-bold hover:bg-primary/10 transition-colors"
      title="Copy promo code"
    >
      {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {code}
    </button>
  )
}

// ── FirmCard ──────────────────────────────────────────────────────────────────
type ChallengeType = "two-step" | "one-step" | "instant"

function FirmCard({ firm }: { firm: PropFirmData }) {
  const [open,          setOpen]          = useState(false)
  const [challengeType, setChallengeType] = useState<ChallengeType>("two-step")
  const [selectedSize,  setSelectedSize]  = useState<string | null>(null)

  const availableTabs: { id: ChallengeType; label: string; model: AccountModel }[] = ([
    { id: "two-step", label: "2-Step",  model: firm.twoStep },
    { id: "one-step", label: "1-Step",  model: firm.oneStep },
    { id: "instant",  label: "Instant", model: firm.instantFunding },
  ] as { id: ChallengeType; label: string; model: AccountModel | null }[]).filter(
    (t): t is { id: ChallengeType; label: string; model: AccountModel } => t.model !== null
  )

  const handleOpen = () => {
    setOpen(o => {
      if (!o && availableTabs.length > 0) {
        setChallengeType(availableTabs[0].id)
        setSelectedSize(null)
      }
      return !o
    })
  }

  const handleTabChange = (tab: ChallengeType) => {
    setChallengeType(tab)
    setSelectedSize(null)
  }

  const activeModel = challengeType === "two-step" ? firm.twoStep
    : challengeType === "one-step" ? firm.oneStep
    : firm.instantFunding

  const activePricing: SizePricing | undefined =
    challengeType === "two-step"  ? firm.pricing.twoStep
    : challengeType === "one-step" ? firm.pricing.oneStep
    : firm.pricing.instantFunding

  const tabAccent: Record<ChallengeType, { active: string; ring: string; badge: string }> = {
    "two-step": { active: "bg-primary text-primary-foreground",  ring: "ring-primary/30",       badge: "bg-primary/15 text-primary border-primary/25" },
    "one-step": { active: "bg-sky-500 text-white",               ring: "ring-sky-500/30",        badge: "bg-sky-500/15 text-sky-400 border-sky-500/25" },
    "instant":  { active: "bg-emerald-500 text-white",           ring: "ring-emerald-500/30",    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  }

  const tabLabel = challengeType === "two-step" ? "2-Step" : challengeType === "one-step" ? "1-Step" : "Instant Funding"

  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md hover:shadow-black/10">

      {/* Header */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-foreground text-sm leading-tight">{firm.name}</p>
              {firm.rating !== undefined && <StarRating rating={firm.rating} />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{firm.profitSplit} split · {firm.payoutFrequency}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DrawdownTypeBadge type={firm.drawdownType} />
          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border/60 px-5 py-4 space-y-4">

          {/* Challenge type tabs */}
          {availableTabs.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Challenge Type</p>
              <div className="flex flex-wrap gap-2">
                {availableTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      challengeType === tab.id
                        ? `${tabAccent[tab.id].active} border-transparent shadow-sm ring-2 ${tabAccent[tab.id].ring}`
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No challenge models available.</p>
          )}

          {/* Account size buttons */}
          {activeModel && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Account Size <span className="normal-case font-normal text-muted-foreground/70">— tap to see rules & pricing</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {firm.accountSizes.map(size => {
                  const px = activePricing?.[size]
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(s => s === size ? null : size)}
                      className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-mono font-semibold transition-all min-w-[52px] min-h-[48px] ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30"
                          : "border-border bg-secondary/40 text-foreground hover:bg-secondary/70 hover:border-primary/30"
                      }`}
                      aria-pressed={selectedSize === size}
                    >
                      <span>{size}</span>
                      {px && (
                        <span className={`text-[10px] font-normal mt-0.5 ${selectedSize === size ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {px.price}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Rules panel */}
          {activeModel && selectedSize && (() => {
            const px = activePricing?.[selectedSize]
            return (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                {/* Panel header */}
                <div className="flex items-start justify-between flex-wrap gap-2 pb-2 border-b border-border/40">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rules for</p>
                    <p className="text-sm font-bold text-foreground">{firm.name} — {selectedSize}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${tabAccent[challengeType].badge}`}>
                    {tabLabel}
                  </span>
                </div>

                {/* Pricing + promo */}
                {px && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/60">
                      <span className="text-xs text-muted-foreground">Account Price</span>
                      <span className="text-sm font-bold text-foreground">{px.price}</span>
                    </div>
                    {px.promoCode && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-primary/60 shrink-0" />
                        <span className="text-[11px] text-muted-foreground">Promo:</span>
                        <CopyCode code={px.promoCode} />
                      </div>
                    )}
                  </div>
                )}

                {/* Rule rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeModel.profitTarget && (
                    <RuleRow label="Profit Target" value={activeModel.profitTarget} />
                  )}
                  {!activeModel.profitTarget && (
                    <RuleRow label="Profit Target" value={<span className="text-muted-foreground font-normal">None (Instant)</span>} />
                  )}
                  <RuleRow label="Max Drawdown"     value={activeModel.maxDrawdown} />
                  <RuleRow label="Daily Drawdown"   value={activeModel.dailyDrawdown} />
                  <RuleRow label="Drawdown Type"    value={<DrawdownTypeBadge type={activeModel.drawdownType} />} />
                  <RuleRow label="Min Trading Days" value={activeModel.minTradingDays === 0 ? "None" : `${activeModel.minTradingDays} days`} />
                  <RuleRow label="Time Limit"       value={activeModel.timeLimit} />
                  <RuleRow label="Profit Split"     value={<span className="text-primary">{firm.profitSplit}</span>} />
                  <RuleRow label="Consistency Rule" value={<YesNo value={firm.consistencyRule} size="xs" />} />
                  <RuleRow label="Weekend Holding"  value={<YesNo value={firm.weekendHolding} size="xs" />} />
                  <RuleRow label="Overnight Holding" value={<YesNo value={firm.overnightHolding} size="xs" />} />
                  <RuleRow label="Payout Frequency" value={firm.payoutFrequency} />
                </div>
              </div>
            )
          })()}

          {/* Prompt */}
          {activeModel && !selectedSize && (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Select an account size above to view the full rules and pricing.
            </p>
          )}

          {/* Website link */}
          <a
            href={firm.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
          >
            Visit official website <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </article>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PropFirmsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "two-step" | "one-step" | "instant">("all")

  // Search is scoped strictly to firm names in FIRMS — no external/global search
  const firmNames = FIRMS.map(f => f.name.toLowerCase())

  const filtered = FIRMS.filter(f => {
    const q = search.trim().toLowerCase()
    const matchSearch = q === "" || f.name.toLowerCase().includes(q)
    const matchFilter =
      filter === "all"      ? true
      : filter === "two-step"  ? f.twoStep !== null
      : filter === "one-step"  ? f.oneStep !== null
      : f.instantFunding !== null
    return matchSearch && matchFilter
  })

  // Suggest closest firm name when no results
  const noResults = search.trim() !== "" && filtered.length === 0

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
              <Building2 className="w-3.5 h-3.5" />
              {FIRMS.length} Firms Listed
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-3">
              Prop Firms Comparison
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto text-pretty">
              Compare profit targets, drawdown rules, account pricing, and payout structures across {FIRMS.length} leading prop firms. Click a firm to explore models and account sizes.
            </p>
          </div>

          {/* Top Recommended */}
          <section className="mb-12" aria-labelledby="featured-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border/50" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Top Recommended
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <h2 id="featured-heading" className="sr-only">Top Recommended Prop Firms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FEATURED_FIRMS.map(firm => (
                <FeaturedFirmCard key={firm.id} firm={firm} />
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3.5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Rules and prices are sourced from official firm websites and verified March 2026.
              They change frequently — always confirm on the firm{"'"}s official site before purchasing.
              Pricing shown is approximate and may vary by region or active promotions.
            </p>
          </div>

          {/* Search + filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${FIRMS.length} firms...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
                list="firm-names"
              />
              {/* Datalist scoped to FIRMS only */}
              <datalist id="firm-names">
                {FIRMS.map(f => <option key={f.id} value={f.name} />)}
              </datalist>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border">
              <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
              {(["all", "two-step", "one-step", "instant"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "all" ? "All" : f === "two-step" ? "2-Step" : f === "one-step" ? "1-Step" : "Instant"}
                </button>
              ))}
            </div>
          </div>

          {/* Legend — account models only (no drawdown type badges) */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Account models:</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold">Two Step</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-sky-500/30 bg-sky-500/5 text-sky-400 font-semibold">One Step</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-semibold">Instant Funding</span>
          </div>

          {/* Firm list */}
          {noResults ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No firms match <span className="font-semibold text-foreground">{`"${search}"`}</span>.</p>
              <p className="text-xs text-muted-foreground">Try searching: {firmNames.slice(0, 5).map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(", ")}…</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(f => <FirmCard key={f.id} firm={f} />)}
            </div>
          )}

        </div>

        {/* ── Educational Guide ─────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-4" aria-labelledby="guide-heading">

          {/* Section header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Professional Trader Guide</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <h2 id="guide-heading" className="text-xl font-bold text-foreground text-center mb-2 text-balance">
            How Professional Traders Pass Prop Firm Challenges
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10 max-w-xl mx-auto leading-relaxed">
            A practical framework used by consistently profitable traders to pass evaluations and manage funded accounts long-term.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1 — Mindset */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">01</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">Professional Trading Mindset</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Treat the challenge exactly like a funded account — the rules do not change between phases. Professionals do not trade to &quot;pass&quot; quickly; they trade to demonstrate repeatable, rule-based execution.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Discipline over impulse — every trade must have a written reason.",
                  "Follow the firm&apos;s rules as a non-negotiable constraint.",
                  "Accept that not every day requires a trade.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </div>

            {/* 2 — Daily Routine */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-sky-400">02</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">Daily Trading Routine</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A structured session prevents emotional, reactive trading. Build a pre-market routine and stick to it every day.
              </p>
              <ol className="space-y-1.5">
                {[
                  "Market analysis — bias, structure, and key levels.",
                  "Session planning — identify your trading window (London, NY open).",
                  "Identify setups that meet your A+ criteria.",
                  "Wait for confirmation before executing.",
                  "Log every trade immediately after it closes.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 font-bold text-primary w-4">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 3 — Risk Management */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-emerald-400">03</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">Risk Management Rules</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consistent risk sizing is the single most important variable in passing and retaining a funded account.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Risk per trade", value: "0.5% – 1%" },
                  { label: "Risk-to-reward", value: "Min 1:2 or 1:3" },
                  { label: "Max daily risk", value: "2% of account" },
                  { label: "Max open trades", value: "1 – 2 at a time" },
                ].map(item => (
                  <div key={item.label} className="rounded-lg bg-secondary/40 border border-border/50 px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className="text-xs font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 — Psychology */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-amber-400">04</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">Psychology and Discipline</h3>
              </div>
              <div className="space-y-2">
                {[
                  { trap: "FOMO", rule: "If the setup has already moved, it is already gone. Wait for the next one." },
                  { trap: "Overtrading", rule: "Set a hard limit: maximum 2 trades per day. No exceptions." },
                  { trap: "Revenge trading", rule: "After a losing trade, step away for at least 30 minutes before re-evaluating." },
                ].map(item => (
                  <div key={item.trap} className="rounded-lg bg-secondary/30 border border-border/40 px-3 py-2.5">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-0.5">{item.trap}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.rule}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5 — Passing Strategies */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-violet-400">05</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">How Traders Pass Challenges</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The fastest path to passing is not taking big risks — it is avoiding mistakes.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Target consistency, not speed — 1% per day compounds faster than a single 10% day.",
                  "Protect the drawdown limit above all else; it is a hard boundary.",
                  "Avoid high-impact news events unless your strategy explicitly accounts for them.",
                  "Pass with the same position sizes you intend to trade on the funded account.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 6 — Payout Strategy */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-rose-400">06</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">Payout Strategy</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Withdrawing too aggressively reduces your buffer. Treat payout requests strategically.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Request payouts on a fixed schedule (bi-weekly or monthly) rather than whenever possible.",
                  "Withdraw only after reaching a comfortable profit cushion above your drawdown limit.",
                  "Most firms support bank wire, USDT (TRC-20 / ERC-20), and sometimes Rise/Deel.",
                  "Check the firm\u2019s minimum payout period before placing your first trade.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Step-by-step guide — full width */}
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="font-bold text-foreground text-sm mb-5 text-center">Step-by-Step Trade Execution Guide</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { step: "01", label: "Analyze Market", desc: "Daily bias, structure, and key S/R levels." },
                { step: "02", label: "Identify Setup", desc: "A+ entry that meets all checklist criteria." },
                { step: "03", label: "Manage Risk", desc: "Set SL, calculate lot size, confirm RR." },
                { step: "04", label: "Execute Trade", desc: "Enter at planned level, no chasing." },
                { step: "05", label: "Review", desc: "Log result, screenshot, and key lesson." },
              ].map((item, i, arr) => (
                <div key={item.step} className="relative flex flex-col items-center text-center gap-2">
                  {/* Connector line (not on last item) */}
                  {i < arr.length - 1 && (
                    <div className="hidden sm:block absolute top-4 left-[calc(50%+16px)] right-[-50%] h-px bg-primary/20" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold z-10 shrink-0">
                    {item.step}
                  </div>
                  <p className="text-xs font-bold text-foreground leading-tight">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick rules callout */}
          <div className="mt-4 rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Reference Rules</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                "Maximum 1–2 trades per session.",
                "Risk no more than 1% per trade.",
                "Only trade A+ setups with full confirmation.",
                "Never move SL against your trade.",
                "Do not trade 30 minutes before high-impact news.",
                "Stop trading after 2 consecutive losses in a day.",
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 w-4 h-4 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{i + 1}</span>
                  <span className="leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>

      <Footer />
    </div>
  )
}
