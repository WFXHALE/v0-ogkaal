// Membership and user dashboard data — Supabase-backed
import { createClient } from "@/lib/supabase/client"

export type MembershipPlan = "VIP" | "Mentorship" | "VIP Group" | "Free"
export type MembershipStatus = "active" | "pending" | "expired" | "none"

export interface Membership {
  id: string
  userId: string
  userEmail: string
  userName: string
  plan: MembershipPlan
  status: MembershipStatus
  joinDate: string
  expiryDate: string | null
  paymentMethod?: string
  amountPaid?: string
  notes?: string
  createdAt: string
}

export interface VipSignal {
  id: string
  pair: string
  entry: string
  stopLoss: string
  takeProfit1: string
  takeProfit2?: string
  takeProfit3?: string
  direction: "BUY" | "SELL"
  status: "active" | "hit_tp" | "hit_sl" | "cancelled"
  result?: string
  notes?: string
  postedAt: string
  createdAt: string
}

export interface PerformanceStat {
  id: string
  month: string      // "2025-01"
  monthLabel: string // "January 2025"
  profitPercent: number
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
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
    .eq("user_email", email)
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

export async function upsertMembership(m: Partial<Membership> & { userEmail: string; plan: MembershipPlan }): Promise<Membership | null> {
  const supabase = createClient()
  const payload: Record<string, unknown> = {
    user_email: m.userEmail,
    user_name: m.userName ?? "",
    plan: m.plan,
    status: m.status ?? "pending",
    join_date: m.joinDate ?? new Date().toISOString(),
    expiry_date: m.expiryDate ?? null,
    payment_method: m.paymentMethod,
    amount_paid: m.amountPaid,
    notes: m.notes,
  }
  if (m.userId) payload.user_id = m.userId
  if (m.id) payload.id = m.id

  const { data, error } = await supabase
    .from("memberships")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single()
  if (error) { console.error("[membership-store] upsertMembership:", error); return null }
  return data ? mapMembership(data) : null
}

export async function updateMembershipStatus(id: string, status: MembershipStatus, expiryDate?: string): Promise<boolean> {
  const supabase = createClient()
  const updates: Record<string, unknown> = { status }
  if (expiryDate) updates.expiry_date = expiryDate
  const { error } = await supabase.from("memberships").update(updates).eq("id", id)
  if (error) { console.error("[membership-store] updateMembershipStatus:", error); return false }
  return true
}

function mapMembership(row: Record<string, unknown>): Membership {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    userEmail: String(row.user_email ?? ""),
    userName: String(row.user_name ?? ""),
    plan: (row.plan as MembershipPlan) ?? "Free",
    status: (row.status as MembershipStatus) ?? "none",
    joinDate: String(row.join_date ?? ""),
    expiryDate: row.expiry_date ? String(row.expiry_date) : null,
    paymentMethod: row.payment_method ? String(row.payment_method) : undefined,
    amountPaid: row.amount_paid ? String(row.amount_paid) : undefined,
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
    .order("posted_at", { ascending: false })
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
      take_profit_1: s.takeProfit1,
      take_profit_2: s.takeProfit2,
      take_profit_3: s.takeProfit3,
      direction: s.direction,
      status: s.status ?? "active",
      result: s.result,
      notes: s.notes,
      posted_at: s.postedAt,
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
    takeProfit1: String(row.take_profit_1 ?? ""),
    takeProfit2: row.take_profit_2 ? String(row.take_profit_2) : undefined,
    takeProfit3: row.take_profit_3 ? String(row.take_profit_3) : undefined,
    direction: (row.direction as "BUY" | "SELL") ?? "BUY",
    status: (row.status as VipSignal["status"]) ?? "active",
    result: row.result ? String(row.result) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    postedAt: String(row.posted_at ?? ""),
    createdAt: String(row.created_at ?? ""),
  }
}

// ── Performance Stats ─────────────────────────────────────────────────────────

export async function getPerformanceStats(): Promise<PerformanceStat[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("performance_stats")
    .select("*")
    .order("month", { ascending: true })
  if (error) { console.error("[membership-store] getPerformanceStats:", error); return [] }
  return (data || []).map(mapStat)
}

export async function upsertPerformanceStat(s: Omit<PerformanceStat, "id" | "createdAt">): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from("performance_stats")
    .upsert({
      month: s.month,
      month_label: s.monthLabel,
      profit_percent: s.profitPercent,
      win_rate: s.winRate,
      total_trades: s.totalTrades,
      winning_trades: s.winningTrades,
      losing_trades: s.losingTrades,
    }, { onConflict: "month" })
  return !error
}

function mapStat(row: Record<string, unknown>): PerformanceStat {
  return {
    id: String(row.id),
    month: String(row.month ?? ""),
    monthLabel: String(row.month_label ?? ""),
    profitPercent: Number(row.profit_percent ?? 0),
    winRate: Number(row.win_rate ?? 0),
    totalTrades: Number(row.total_trades ?? 0),
    winningTrades: Number(row.winning_trades ?? 0),
    losingTrades: Number(row.losing_trades ?? 0),
    createdAt: String(row.created_at ?? ""),
  }
}
