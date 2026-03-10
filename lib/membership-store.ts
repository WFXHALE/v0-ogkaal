// Membership and user dashboard data — Supabase-backed
// All column names match the LIVE database schema exactly.
import { createClient } from "@/lib/supabase/client"

export type MembershipPlan = "VIP" | "Mentorship" | "VIP Group" | "Free"
export type MembershipStatus = "active" | "pending" | "expired" | "none"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Membership {
  id: string
  userId: string
  userEmail: string
  userName: string
  plan: MembershipPlan
  status: MembershipStatus
  joinDate: string       // maps to joined_at
  expiryDate: string | null // maps to expires_at
  amountPaid?: string    // maps to amount
  notes?: string
  createdAt: string
}

export interface VipSignal {
  id: string
  pair: string
  entry: string
  stopLoss: string      // maps to stop_loss
  takeProfit: string    // maps to take_profit (single col)
  direction: "BUY" | "SELL"
  status: "active" | "hit_tp" | "hit_sl" | "cancelled"
  result?: string
  pips?: number
  source?: string
  notes?: string
  createdAt: string
}

export interface PerformanceStat {
  id: string
  month: string         // "Jan", "Feb", etc — maps to month col
  year: number          // maps to year col
  profitPercent: number // maps to profit_pct
  winRate: number       // maps to win_rate
  totalTrades: number   // maps to total_trades
  wins: number          // maps to wins
  losses: number        // maps to losses
  notes?: string
  createdAt: string
}

export interface UserPerformanceOverride {
  id: string
  userEmail: string      // maps to user_email
  fundedPassed: number   // maps to funded_passed
  fundedBreached: number // maps to funded_breached
  totalPayouts: number   // maps to total_payouts
  totalReturn: number    // maps to total_return
  avgWinRate: number     // maps to avg_win_rate
  totalTrades: number    // maps to total_trades
  updatedAt: string
}

export interface Certificate {
  id: string
  userEmail: string  // maps to user_email
  title: string
  description?: string
  imageUrl: string   // maps to image_url
  createdAt: string
}

export interface TradingAccount {
  id: string
  userId: string
  userEmail: string
  brokerName: string      // maps to broker_name
  accountType: string     // maps to account_type
  accountBalance: number  // maps to account_balance
  initialDeposit: number  // maps to initial_deposit
  currentProfit: number   // maps to current_profit
  profitTarget: number    // maps to profit_target
  notes?: string
  createdAt: string
}

export interface JournalEntry {
  id: string
  userId: string
  userEmail: string
  pair: string
  entryPrice: number    // maps to entry_price
  exitPrice?: number    // maps to exit_price
  profitLoss?: number   // maps to profit_loss
  tradeNotes?: string   // maps to trade_notes
  screenshotUrl?: string // maps to screenshot_url
  tradeDate: string     // maps to trade_date
  createdAt: string
}

// ── Memberships ───────────────────────────────────────────────────────────────

export async function getMemberships(): Promise<Membership[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) { console.error("[membership-store] getMemberships:", error); return [] }
  return (data || []).map(mapMembership)
}

export async function getMembershipByEmail(email: string): Promise<Membership | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return data ? mapMembership(data) : null
}

export async function getMembershipByUserId(userId: string): Promise<Membership | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return data ? mapMembership(data) : null
}

export async function updateMembershipStatus(id: string, status: MembershipStatus, expiresAt?: string, joinedAt?: string): Promise<boolean> {
  const supabase = createClient()
  const updates: Record<string, unknown> = { status }
  if (expiresAt) updates.expires_at = expiresAt
  if (joinedAt)  updates.joined_at  = joinedAt
  const { error } = await supabase.from("memberships").update(updates).eq("id", id)
  if (error) { console.error("[membership-store] updateMembershipStatus:", error); return false }
  return true
}

// ── Approve payment → activate membership with correct dates ──────────────────

const PLAN_DURATIONS_MONTHS: Record<string, number> = {
  "VIP":           1,
  "VIP Group":     1,
  "Mentorship 1.0": 2,
  "Mentorship 2.0": 3,
  "Mentorship":    2, // default fallback for generic mentorship
}

export async function approveMembership(
  membershipId: string,
  plan: string,
  submissionId?: string,
): Promise<{ joinedAt: string; expiresAt: string } | null> {
  const supabase = createClient()
  const now = new Date()
  const joinedAt = now.toISOString()

  const durationMonths = PLAN_DURATIONS_MONTHS[plan] ?? 1
  const exp = new Date(now)
  exp.setMonth(exp.getMonth() + durationMonths)
  const expiresAt = exp.toISOString()

  const { error } = await supabase
    .from("memberships")
    .update({ status: "active", joined_at: joinedAt, expires_at: expiresAt })
    .eq("id", membershipId)

  if (error) { console.error("[membership-store] approveMembership:", error); return null }

  // Also mark the admin_submission as approved if provided
  if (submissionId) {
    await supabase
      .from("admin_submissions")
      .update({ status: "approved" })
      .eq("id", submissionId)
  }

  return { joinedAt, expiresAt }
}

function mapMembership(row: Record<string, unknown>): Membership {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    userEmail: String(row.email ?? ""),
    userName: String(row.name ?? ""),
    plan: (row.plan as MembershipPlan) ?? "Free",
    status: (row.status as MembershipStatus) ?? "none",
    joinDate: String(row.joined_at ?? row.created_at ?? ""),
    expiryDate: row.expires_at ? String(row.expires_at) : null,
    amountPaid: row.amount ? String(row.amount) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? ""),
  }
}

// ── VIP Signals ───────────────────────────────────────────────────────────────

export async function getVipSignals(): Promise<VipSignal[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("vip_signals")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) { console.error("[membership-store] getVipSignals:", error); return [] }
  return (data || []).map(mapSignal)
}

export async function createSignal(s: Omit<VipSignal, "id" | "createdAt">): Promise<VipSignal | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("vip_signals")
    .insert({
      pair: s.pair,
      entry: s.entry,
      stop_loss: s.stopLoss,
      take_profit: s.takeProfit,
      direction: s.direction,
      status: s.status ?? "active",
      result: s.result,
      pips: s.pips,
      source: s.source,
      notes: s.notes,
    })
    .select()
    .single()
  if (error) { console.error("[membership-store] createSignal:", error); return null }
  return data ? mapSignal(data) : null
}

export async function updateSignalStatus(id: string, status: VipSignal["status"], result?: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from("vip_signals")
    .update({ status, result })
    .eq("id", id)
  return !error
}

export async function deleteSignal(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("vip_signals").delete().eq("id", id)
  return !error
}

function mapSignal(row: Record<string, unknown>): VipSignal {
  return {
    id: String(row.id),
    pair: String(row.pair ?? ""),
    entry: String(row.entry ?? ""),
    stopLoss: String(row.stop_loss ?? ""),
    takeProfit: String(row.take_profit ?? ""),
    direction: (row.direction as "BUY" | "SELL") ?? "BUY",
    status: (row.status as VipSignal["status"]) ?? "active",
    result: row.result ? String(row.result) : undefined,
    pips: row.pips != null ? Number(row.pips) : undefined,
    source: row.source ? String(row.source) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? ""),
  }
}

// ── Performance Stats ─────────────────────────────────────────────────────────

export async function getPerformanceStats(): Promise<PerformanceStat[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("performance_stats")
    .select("*")
    .order("year", { ascending: true })
  if (error) { console.error("[membership-store] getPerformanceStats:", error); return [] }
  return (data || []).map(mapStat)
}

export async function upsertPerformanceStat(s: Omit<PerformanceStat, "id" | "createdAt">): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from("performance_stats")
    .upsert({
      month: s.month,
      year: s.year,
      profit_pct: s.profitPercent,
      win_rate: s.winRate,
      total_trades: s.totalTrades,
      wins: s.wins,
      losses: s.losses,
      notes: s.notes,
    }, { onConflict: "month,year" })
  return !error
}

function mapStat(row: Record<string, unknown>): PerformanceStat {
  return {
    id: String(row.id),
    month: String(row.month ?? ""),
    year: Number(row.year ?? new Date().getFullYear()),
    profitPercent: Number(row.profit_pct ?? 0),
    winRate: Number(row.win_rate ?? 0),
    totalTrades: Number(row.total_trades ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? ""),
  }
}

// ── User Performance Overrides ────────────────────────────────────────────────

export async function getUserPerformanceOverride(userEmail: string): Promise<UserPerformanceOverride | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("user_performance_overrides")
    .select("*")
    .eq("user_email", userEmail)
    .single()
  if (error) return null
  return data ? mapOverride(data) : null
}

export async function upsertUserPerformanceOverride(o: Omit<UserPerformanceOverride, "id" | "updatedAt">): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("user_performance_overrides").upsert({
    user_email: o.userEmail,
    funded_passed: o.fundedPassed,
    funded_breached: o.fundedBreached,
    total_payouts: o.totalPayouts,
    total_return: o.totalReturn,
    avg_win_rate: o.avgWinRate,
    total_trades: o.totalTrades,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_email" })
  return !error
}

function mapOverride(row: Record<string, unknown>): UserPerformanceOverride {
  return {
    id: String(row.id),
    userEmail: String(row.user_email ?? ""),
    fundedPassed: Number(row.funded_passed ?? 0),
    fundedBreached: Number(row.funded_breached ?? 0),
    totalPayouts: Number(row.total_payouts ?? 0),
    totalReturn: Number(row.total_return ?? 0),
    avgWinRate: Number(row.avg_win_rate ?? 0),
    totalTrades: Number(row.total_trades ?? 0),
    updatedAt: String(row.updated_at ?? ""),
  }
}

// ── Certificates ──────────────────────────────────────────────────────────────

export async function getCertificates(userEmail: string): Promise<Certificate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false })
  if (error) { console.error("[membership-store] getCertificates:", error); return [] }
  return (data || []).map(mapCertificate)
}

export async function getAllCertificates(): Promise<Certificate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) { console.error("[membership-store] getAllCertificates:", error); return [] }
  return (data || []).map(mapCertificate)
}

export async function createCertificate(c: Omit<Certificate, "id" | "createdAt">): Promise<Certificate | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("certificates")
    .insert({ user_email: c.userEmail, title: c.title, description: c.description, image_url: c.imageUrl })
    .select()
    .single()
  if (error) { console.error("[membership-store] createCertificate:", error); return null }
  return data ? mapCertificate(data) : null
}

export async function deleteCertificate(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("certificates").delete().eq("id", id)
  return !error
}

function mapCertificate(row: Record<string, unknown>): Certificate {
  return {
    id: String(row.id),
    userEmail: String(row.user_email ?? ""),
    title: String(row.title ?? ""),
    description: row.description ? String(row.description) : undefined,
    imageUrl: String(row.image_url ?? ""),
    createdAt: String(row.created_at ?? ""),
  }
}

// ── Trading Accounts ──────────────────────────────────────────────────────────

export async function getTradingAccounts(userId: string): Promise<TradingAccount[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) { console.error("[membership-store] getTradingAccounts:", error); return [] }
  return (data || []).map(mapTradingAccount)
}

export async function createTradingAccount(a: Omit<TradingAccount, "id" | "createdAt">): Promise<TradingAccount | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("trading_accounts")
    .insert({
      user_id: a.userId,
      user_email: a.userEmail,
      broker_name: a.brokerName,
      account_type: a.accountType,
      account_balance: a.accountBalance,
      initial_deposit: a.initialDeposit,
      current_profit: a.currentProfit,
      profit_target: a.profitTarget,
      notes: a.notes,
    })
    .select()
    .single()
  if (error) { console.error("[membership-store] createTradingAccount:", error); return null }
  return data ? mapTradingAccount(data) : null
}

export async function deleteTradingAccount(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("trading_accounts").delete().eq("id", id)
  return !error
}

function mapTradingAccount(row: Record<string, unknown>): TradingAccount {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    userEmail: String(row.user_email ?? ""),
    brokerName: String(row.broker_name ?? ""),
    accountType: String(row.account_type ?? "live"),
    accountBalance: Number(row.account_balance ?? 0),
    initialDeposit: Number(row.initial_deposit ?? 0),
    currentProfit: Number(row.current_profit ?? 0),
    profitTarget: Number(row.profit_target ?? 0),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? ""),
  }
}

// ── Trading Journal ───────────────────────────────────────────────────────────

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("trading_journal")
    .select("*")
    .eq("user_id", userId)
    .order("trade_date", { ascending: false })
  if (error) { console.error("[membership-store] getJournalEntries:", error); return [] }
  return (data || []).map(mapJournalEntry)
}

export async function createJournalEntry(e: Omit<JournalEntry, "id" | "createdAt">): Promise<JournalEntry | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("trading_journal")
    .insert({
      user_id: e.userId,
      user_email: e.userEmail,
      pair: e.pair,
      entry_price: e.entryPrice,
      exit_price: e.exitPrice,
      profit_loss: e.profitLoss,
      trade_notes: e.tradeNotes,
      screenshot_url: e.screenshotUrl,
      trade_date: e.tradeDate,
    })
    .select()
    .single()
  if (error) { console.error("[membership-store] createJournalEntry:", error); return null }
  return data ? mapJournalEntry(data) : null
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("trading_journal").delete().eq("id", id)
  return !error
}

function mapJournalEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    userEmail: String(row.user_email ?? ""),
    pair: String(row.pair ?? ""),
    entryPrice: Number(row.entry_price ?? 0),
    exitPrice: row.exit_price != null ? Number(row.exit_price) : undefined,
    profitLoss: row.profit_loss != null ? Number(row.profit_loss) : undefined,
    tradeNotes: row.trade_notes ? String(row.trade_notes) : undefined,
    screenshotUrl: row.screenshot_url ? String(row.screenshot_url) : undefined,
    tradeDate: String(row.trade_date ?? ""),
    createdAt: String(row.created_at ?? ""),
  }
}
