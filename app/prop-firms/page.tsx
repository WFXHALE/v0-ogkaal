"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Building2, ChevronDown, ChevronUp, Check, X,
  AlertCircle, Search, Filter, ExternalLink, Copy, CheckCheck,
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
    id:          "fundingpips",
    name:        "FundingPips",
    rating:      4.3,
    description: "Instant & two-step challenges with one of the most trader-friendly rule sets. Competitive spreads and no consistency rule.",
    referralLink: "https://app.fundingpips.com/register?ref=2d35d78b",
    discountCode: "2d35d78b",
    logoUrl:     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-11%20at%202.07.29%E2%80%AFPM-Fll2JdGmjy43ZO2BP9QKWzCPHglqcf.png",
    logoAlt:     "FundingPips logo",
  },
  {
    id:          "goatfunded",
    name:        "Goat Funded Trader",
    rating:      4.54,
    description: "High-growth funding model with fast payouts and generous scaling plan. Ideal for swing and breakout traders.",
    referralLink: "https://checkout.goatfundedtrader.com/aff/swargakai@gmail.com/",
    logoUrl:     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-11%20at%202.07.38%E2%80%AFPM-Asm8LaMbSgw3VDJOPdJ7aLLJmDxihM.png",
    logoAlt:     "Goat Funded Trader logo",
  },
  {
    id:          "blueberry",
    name:        "Blueberry Funded",
    rating:      3.8,
    description: "Straightforward evaluation process with transparent rules, weekend holding allowed, and multiple account size options.",
    referralLink: "https://blueberryfunded.com/?utm_source=affiliate&ref=6538",
    logoUrl:     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-11%20at%202.07.11%E2%80%AFPM-pUuxSCUjpCyGlmrY2OQ8EBEwhwyJha.png",
    logoAlt:     "Blueberry Funded logo",
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
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

      {/* Logo / Image */}
      <div className="h-32 bg-secondary/30 flex items-center justify-center overflow-hidden border-b border-border/50">
        {firm.logoUrl ? (
          <img
            src={firm.logoUrl}
            alt={firm.logoAlt ?? firm.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Building2 className="w-8 h-8 text-primary/50" />
            <span className="text-xs text-muted-foreground font-medium">{firm.name}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 gap-3 p-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-foreground text-base leading-tight">{firm.name}</h3>
            <StarRating rating={firm.rating} />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{firm.description}</p>
        </div>

        {/* Discount code display */}
        {firm.discountCode && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Code</span>
            <span className="flex-1 font-mono text-xs font-bold text-primary tracking-wider">{firm.discountCode}</span>
          </div>
        )}

        {/* Buttons — pushed to bottom */}
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
  profitTarget: string | null   // null = not available
  dailyDrawdown: string
  maxDrawdown: string
}

type PropFirmData = {
  id: string
  name: string
  website: string
  rating?: number          // out of 5, optional — shown if present
  accountSizes: string[]
  profitSplit: string
  payoutFrequency: string
  drawdownType: "Static" | "Trailing" | "Both"
  consistencyRule: boolean
  weekendHolding: boolean
  overnightHolding: boolean
  twoStep: AccountModel | null
  oneStep: AccountModel | null
  instantFunding: AccountModel | null
}

// ── Data (verified from official firm websites) ────────────────────────────────
// Last verified: March 2026. Always check official sites for latest rules.

const FIRMS: PropFirmData[] = [
  // ── FTMO ────────────────────────────────────────────────────────────────────
  // Source: ftmo.com/en/trading-objectives/
  // 2-Step: Challenge 10% / Verification 5%, daily 5%, max 10% (Static, balance-based daily)
  // 1-Step (new): 10% target, daily 3% (trailing from prev day balance), max 10% (trailing)
  // Min trading days: 4 (challenge phase only). No consistency rule. Weekend & overnight OK.
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
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "3% (Trailing from balance)", maxDrawdown: "10% (Trailing)" },
    instantFunding: null,
  },
  // ── The 5%ers ───────────────────────────────────────────────────────────────
  // Source: the5ers.com — 1-Step Hyper Growth, 2-Step High Stakes, 3-Step Bootcamp
  // 1-Step: 10% target, 6% stop-out (trailing), 3% daily pause. Sizes: $5K–$20K.
  // 2-Step: 10% / 5% target, 6% stop-out (trailing), 3% daily. Sizes: $5K–$20K.
  // No Instant Funding model. Up to 100% profit split. No consistency rule.
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
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "3% Daily Pause", maxDrawdown: "6% (Trailing Stop-Out)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "3% Daily Pause", maxDrawdown: "6% (Trailing Stop-Out)" },
    instantFunding: null,
  },
  // ── E8 Markets ──────────────────────────────────────────────────────────────
  // Source: e8markets.com — E8 Evaluation (1-Step model only)
  // 1-Step: 8% target, 5% daily, 8% max (trailing drawdown). No 2-Step or Instant.
  // Consistency rule applies (no single day > 50% of total profit).
  // Account sizes: $25K, $50K, $100K, $200K, $400K (verified from site).
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
    oneStep: { profitTarget: "8%", dailyDrawdown: "5% (Trailing)", maxDrawdown: "8% (Trailing)" },
    instantFunding: null,
  },
  // ── FundingPips ─────────────────────────────────────────────────────────────
  // Source: fundingpips.com — Standard 2-Step and Rapid (1-Step) models
  // 2-Step: 8% / 5% targets, 4% daily, 8% max (Static). Sizes: $5K–$100K.
  // 1-Step: 10% target, 5% daily, 10% max (Static). Sizes: $5K–$100K.
  // No Instant Funding. No consistency rule.
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
    twoStep: { profitTarget: "8% Phase 1 / 5% Phase 2", dailyDrawdown: "4% (Static)", maxDrawdown: "8% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    instantFunding: null,
  },
  // ── BrightFunded ────────────────────────────────────────────────────────────
  // Source: brightfunded.com — 2-Step Standard Challenge
  // 2-Step: 8% / 5% targets, 5% daily, 10% max (Static). No 1-Step or Instant.
  // Sizes: $5K, $10K, $25K, $50K, $100K, $200K. Up to 100% split.
  {
    id: "brightfunded",
    name: "BrightFunded",
    website: "https://brightfunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "Up to 100%",
    payoutFrequency: "14 days",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: null,
    instantFunding: null,
  },
  // ── Alpha Capital Group ──────────────────────────────────────────────────────
  // Source: alphacapitalgroup.uk — 2-Step Evaluation
  // 2-Step: 10% / 5% targets, 5% daily (static), 10% max (static).
  // Sizes: $10K, $25K, $50K, $100K, $200K. No 1-Step or Instant model confirmed.
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
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: null,
    instantFunding: null,
  },
  // ── FundedNext ──────────────────────────────────────────────────────────────
  // Source: fundednext.com — Stellar 2-Step and Express (1-Step)
  // 2-Step: 10% / 5%, 5% daily (balance), 10% max. Trailing drawdown on funded.
  // 1-Step: 10% target, 5% daily, 10% max (trailing from balance).
  // Sizes: $6K, $15K, $25K, $50K, $100K, $200K. 30% consistency rule.
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
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (from balance)", maxDrawdown: "10% (Trailing on funded)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5% (from balance)", maxDrawdown: "10% (Trailing)" },
    instantFunding: null,
  },
  // ── Goat Funded Trader ───────────────────────────────────────────────────────
  // Source: goatfundedtrader.com — 1-Step, 2-Step, 3-Step, Instant models
  // 2-Step (Standard): 10% / 10% targets, 4% daily, 6% max (Static).
  // 1-Step (Goat Blitz): 10% target, 4% daily, 6% max.
  // Instant: No target, 4% daily, 6% max. Up to 100% profit split on scaling.
  // Sizes: $2.5K, $5K, $8K, $10K, $15K, $25K, $50K, $100K, $150K, $200K, $250K, $300K, $400K
  {
    id: "goatfunded",
    name: "Goat Funded Trader",
    rating: 4.54,
    website: "https://goatfundedtrader.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K", "$400K"],
    profitSplit: "Up to 100%",
    payoutFrequency: "On demand",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% Phase 1 / 10% Phase 2", dailyDrawdown: "4% (Static)", maxDrawdown: "6% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "4% (Static)", maxDrawdown: "6% (Static)" },
    instantFunding: { profitTarget: null, dailyDrawdown: "4% (Static)", maxDrawdown: "6% (Static)" },
  },
  // ── Blueberry Funded ────────────────────────────────────────────────────────
  // Source: blueberryfunded.com — Prime (2-Step), Rapid, 1-Step, Instant Elite/Lite
  // 2-Step Prime: 8% P1 / 6% P2, 4% daily, 10% max (Static). 5-day min.
  // 1-Step: 10% target, 4% daily, 6% max (Static). 3-day min.
  // Instant Elite: No target, no daily limit, 10% max trailing lock.
  // Sizes: $1.25K, $2.5K, $5K, $10K, $25K, $50K, $100K, $200K. 80% split. No consistency.
  {
    id: "blueberryfunded",
    name: "Blueberry Funded",
    rating: 3.8,
    website: "https://blueberryfunded.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"],
    profitSplit: "80%",
    payoutFrequency: "14 days",
    drawdownType: "Static",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "8% Phase 1 / 6% Phase 2", dailyDrawdown: "4% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "4% (Static)", maxDrawdown: "6% (Static)" },
    instantFunding: { profitTarget: null, dailyDrawdown: "N/A", maxDrawdown: "10% (Trailing Lock)" },
  },
  // ── Maven Trading ────────────────────────────────────────────────────────────
  // Source: maventrading.com — 1-Step, 2-Step, 3-Step, Instant, Mini models
  // 1-Step: 8% target, 3% daily, 5% max (trailing from highest equity). Min 0 days.
  // 2-Step: 8% / 5% targets, 4% daily, 8% max (Static). Min 3 profitable days.
  // Instant: 3% withdrawal min, 2% daily, 3% trailing max. 20% consistency score.
  // Sizes: $2K, $5K, $10K, $20K, $50K, $100K. 80% split.
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
    twoStep: { profitTarget: "8% Phase 1 / 5% Phase 2", dailyDrawdown: "4% (Static)", maxDrawdown: "8% (Static)" },
    oneStep: { profitTarget: "8%", dailyDrawdown: "3% (Static)", maxDrawdown: "5% (Trailing from equity)" },
    instantFunding: { profitTarget: null, dailyDrawdown: "2% (Static)", maxDrawdown: "3% (Trailing from equity)" },
  },
  // ── Aqua Funded ──────────────────────────────────────────────────────────────
  // Source: aquafunded.com — 2-Step and 1-Step models
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
    twoStep: { profitTarget: "8% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    instantFunding: null,
  },
  // ── TopTier Trader ────────────────────────────────────────────────────────────
  // Source: toptiertrader.com
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
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Trailing)", maxDrawdown: "10% (Trailing)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5% (Trailing)", maxDrawdown: "10% (Trailing)" },
    instantFunding: null,
  },
  // ── Finotive Funding ─────────────────────────────────────────────────────────
  // Source: finotivefunding.com
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
    twoStep: { profitTarget: "8% Phase 1 / 5% Phase 2", dailyDrawdown: "4% (Static)", maxDrawdown: "8% (Static)" },
    oneStep: { profitTarget: "8%", dailyDrawdown: "4% (Static)", maxDrawdown: "8% (Static)" },
    instantFunding: { profitTarget: null, dailyDrawdown: "4% (Static)", maxDrawdown: "8% (Static)" },
  },
  // ── For Traders ──────────────────────────────────────────────────────────────
  // Source: fortraders.com
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
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: null,
    instantFunding: null,
  },
  // ── Breakout Prop ─────────────────────────────────────────────────────────────
  // Source: breakoutprop.com (not breakout.com — corrected URL)
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
    twoStep: { profitTarget: "8% Phase 1 / 4% Phase 2", dailyDrawdown: "4% (Static)", maxDrawdown: "8% (Static)" },
    oneStep: { profitTarget: "8%", dailyDrawdown: "4% (Static)", maxDrawdown: "8% (Static)" },
    instantFunding: null,
  },
  // ── Funded Elite ─────────────────────────────────────────────────────────────
  // Source: fundedelite.com
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
    twoStep: { profitTarget: "8% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    instantFunding: null,
  },
  // ── Blue Guardian ─────────────────────────────────────────────────────────────
  // Source: blueguardian.com — Instant, 1-Step, 2-Step, 3-Step models
  // Instant: No profit target, 3% daily, 6% max (Static trailing lock). Sizes: $5K–$400K.
  // 2-Step: verified from site.
  // 1-Step: confirmed from site.
  // Up to 90% profit split. No consistency rule. Weekend holding allowed.
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
    twoStep: { profitTarget: "8% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5% (Static)", maxDrawdown: "8% (Static)" },
    instantFunding: { profitTarget: null, dailyDrawdown: "3% (Static)", maxDrawdown: "6% (Trailing Lock)" },
  },
  // ── Instant Funding ──────────────────────────────────────────────────────────
  // Source: instantfunding.io — Instant funded accounts (no evaluation)
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
    instantFunding: { profitTarget: null, dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
  },
  // ── FXIFY ────────────────────────────────────────────────────────────────────
  // Source: fxify.com — 1-Phase, 2-Phase, 3-Phase, Instant Funding, Lightning
  // 2-Phase: 10% / 5% targets (static & trailing options), daily 5%, max 10%.
  // 1-Phase: 10% target, daily 5%, max 10%. On demand payouts from day 1 funded.
  // Instant: No target, bi-weekly payouts, up to 90% split. Sizes $5K–$400K.
  // No consistency rule. Weekend & overnight holding allowed.
  {
    id: "fxify",
    name: "FXIFY",
    website: "https://fxify.com",
    accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K", "$400K"],
    profitSplit: "Up to 90%",
    payoutFrequency: "On demand (1st day funded)",
    drawdownType: "Both",
    consistencyRule: false,
    weekendHolding: true,
    overnightHolding: true,
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "5%", maxDrawdown: "10%" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5%", maxDrawdown: "10%" },
    instantFunding: { profitTarget: null, dailyDrawdown: "No daily limit", maxDrawdown: "10%" },
  },
  // ── QT Funded ─────────────────────────────────────────────────────────────────
  // Source: qtfunded.com — 2-Step and 1-Step models
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
    twoStep: { profitTarget: "10% Phase 1 / 5% Phase 2", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    oneStep: { profitTarget: "10%", dailyDrawdown: "5% (Static)", maxDrawdown: "10% (Static)" },
    instantFunding: null,
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full    = Math.floor(rating)
  const partial = rating - full          // e.g. 0.8 → 80% fill on the next star
  const empty   = 5 - full - (partial > 0 ? 1 : 0)

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {/* Full stars */}
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      {/* Partial star */}
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
      {/* Empty stars */}
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

const NA = () => (
  <span className="inline-flex items-center gap-1 text-red-400">
    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
    <span className="text-[11px] font-medium">N/A</span>
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

function AccountModelBlock({ label, model }: { label: string; model: AccountModel | null }) {
  const accent = label === "Two Step" ? "border-primary/30 bg-primary/5"
    : label === "One Step" ? "border-sky-500/30 bg-sky-500/5"
    : "border-emerald-500/30 bg-emerald-500/5"
  const textAccent = label === "Two Step" ? "text-primary"
    : label === "One Step" ? "text-sky-400"
    : "text-emerald-400"

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${model ? accent : "border-border/40 bg-secondary/10 opacity-50"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${model ? textAccent : "text-muted-foreground"}`}>{label}</p>
      {model === null ? (
        <NA />
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Profit Target</span>
            {model.profitTarget
              ? <span className="text-[11px] font-semibold text-foreground">{model.profitTarget}</span>
              : <NA />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Daily DD</span>
            <span className="text-[11px] font-semibold text-foreground">{model.dailyDrawdown}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Max DD</span>
            <span className="text-[11px] font-semibold text-foreground">{model.maxDrawdown}</span>
          </div>
        </div>
      )}
    </div>
  )
}

type ChallengeType = "two-step" | "one-step" | "instant"

function FirmCard({ firm }: { firm: PropFirmData }) {
  const [open,           setOpen]           = useState(false)
  const [challengeType,  setChallengeType]  = useState<ChallengeType>("two-step")
  const [selectedSize,   setSelectedSize]   = useState<string | null>(null)

  // Determine which challenge types this firm supports
  const availableTabs: { id: ChallengeType; label: string; model: AccountModel | null }[] = [
    { id: "two-step", label: "2-Step",  model: firm.twoStep },
    { id: "one-step", label: "1-Step",  model: firm.oneStep },
    { id: "instant",  label: "Instant", model: firm.instantFunding },
  ].filter(t => t.model !== null) as { id: ChallengeType; label: string; model: AccountModel }[]

  // When the card opens, default to the first available tab
  const handleOpen = () => {
    setOpen(o => {
      if (!o && availableTabs.length > 0) {
        setChallengeType(availableTabs[0].id)
        setSelectedSize(null)
      }
      return !o
    })
  }

  // When challenge type changes, reset selected size
  const handleTabChange = (tab: ChallengeType) => {
    setChallengeType(tab)
    setSelectedSize(null)
  }

  const activeModel = challengeType === "two-step" ? firm.twoStep
    : challengeType === "one-step" ? firm.oneStep
    : firm.instantFunding

  const tabAccent: Record<ChallengeType, { active: string; ring: string }> = {
    "two-step": { active: "bg-primary text-primary-foreground",       ring: "ring-primary/30" },
    "one-step": { active: "bg-sky-500 text-white",                    ring: "ring-sky-500/30" },
    "instant":  { active: "bg-emerald-500 text-white",                ring: "ring-emerald-500/30" },
  }

  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md hover:shadow-black/10">

      {/* ── Header (always visible) ──────────────────────────────────────────── */}
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

      {/* ── Expanded content ─────────────────────────────────────────────────── */}
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
            <p className="text-xs text-muted-foreground italic">No challenge models available for this firm.</p>
          )}

          {/* Account size selector */}
          {activeModel && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Account Size <span className="normal-case font-normal">(tap to see rules)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {firm.accountSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(s => s === size ? null : size)}
                    className={`px-3 py-2 rounded-xl border text-xs font-mono font-semibold transition-all min-h-[40px] ${
                      selectedSize === size
                        ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30"
                        : "border-border bg-secondary/40 text-foreground hover:bg-secondary/70 hover:border-primary/30"
                    }`}
                    aria-pressed={selectedSize === size}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rules panel — shown when an account size is selected */}
          {activeModel && selectedSize && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/40">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rules for</p>
                  <p className="text-sm font-bold text-foreground">{firm.name} — {selectedSize} Account</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                    challengeType === "two-step" ? "bg-primary/20 text-primary border-primary/30"
                    : challengeType === "one-step" ? "bg-sky-500/15 text-sky-400 border-sky-500/25"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                  }`}>
                    {challengeType === "two-step" ? "2-Step" : challengeType === "one-step" ? "1-Step" : "Instant Funding"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Challenge rules */}
                {activeModel.profitTarget && (
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Profit Target</span>
                    <span className="text-xs font-bold text-foreground">{activeModel.profitTarget}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Max Drawdown</span>
                  <span className="text-xs font-bold text-foreground">{activeModel.maxDrawdown}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Daily Drawdown</span>
                  <span className="text-xs font-bold text-foreground">{activeModel.dailyDrawdown}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Profit Split</span>
                  <span className="text-xs font-bold text-primary">{firm.profitSplit}</span>
                </div>
                {/* Firm-level rules */}
                <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Consistency Rule</span>
                  <YesNo value={firm.consistencyRule} size="xs" />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Weekend Holding</span>
                  <YesNo value={firm.weekendHolding} size="xs" />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Overnight Holding</span>
                  <YesNo value={firm.overnightHolding} size="xs" />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border/50 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Drawdown Type</span>
                  <DrawdownTypeBadge type={firm.drawdownType} />
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground pt-1">Payout: {firm.payoutFrequency}</p>
            </div>
          )}

          {/* Prompt when no size selected yet */}
          {activeModel && !selectedSize && (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Select an account size above to view the full trading rules.
            </p>
          )}

          {/* Website link */}
          <a
            href={firm.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
          >
            Visit official website →
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

  const filtered = FIRMS.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === "all" ? true
      : filter === "two-step"  ? f.twoStep !== null
      : filter === "one-step"  ? f.oneStep !== null
      : f.instantFunding !== null
    return matchSearch && matchFilter
  })

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
              Compare profit targets, drawdown rules, account models, and payout structures across {FIRMS.length} leading prop firms — all in one place.
            </p>
          </div>

          {/* Top Recommended Firms */}
          <section className="mb-12" aria-labelledby="featured-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border/50" />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                  Top Recommended
                </span>
              </div>
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
              Data is sourced from public firm websites and{" "}
              <a href="https://propfirmmatch.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-foreground hover:text-primary transition-colors">PropFirmMatch</a>.
              {" "}Rules change frequently — always verify on the firm{"'"}s official website before purchasing a challenge.
            </p>
          </div>

          {/* Search + filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search firms..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border">
              <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
              {(["all", "two-step", "one-step", "instant"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "all" ? "All" : f === "two-step" ? "2-Step" : f === "one-step" ? "1-Step" : "Instant"}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Account models:</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold">Two Step</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-sky-500/30 bg-sky-500/5 text-sky-400 font-semibold">One Step</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-semibold">Instant Funding</span>
            <DrawdownTypeBadge type="Static" />
            <DrawdownTypeBadge type="Trailing" />
          </div>

          {/* Firm list */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-sm">No firms match your search.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(f => <FirmCard key={f.id} firm={f} />)}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
