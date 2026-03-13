import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

function sb() {
  // Always use SUPABASE_URL (direct project URL) — never the pooled/public URL.
  // The pooled endpoint has a stale PostgREST schema cache that causes PGRST205.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  return createServiceClient(
    url!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: "public" } },
  )
}

// Each dataset maps to a table + optional type filter on admin_submissions
type DatasetConfig = {
  table: string
  typeFilter?: string   // exact match on `type` column
  searchCols: string[]  // columns to ilike-search
}

const DATASETS: Record<string, DatasetConfig> = {
  "usdt-buy":   { table: "usdt_buy_requests",  searchCols: ["email", "name", "phone", "user_id"] },
  "usdt-sell":  { table: "usdt_sell_requests",  searchCols: ["email", "name", "phone", "user_id"] },
  "mentorship": { table: "admin_submissions",   typeFilter: "mentorship",    searchCols: ["email", "name", "phone", "user_id"] },
  "vip":        { table: "admin_submissions",   typeFilter: "vip_membership", searchCols: ["email", "name", "phone", "user_id"] },
  "users":      { table: "dashboard_users",     searchCols: ["user_id", "email", "full_name", "username"] },
  "community":  { table: "community_posts",     searchCols: ["author_id", "author_name", "content"] },
  "journal":    { table: "trading_journal",     searchCols: ["user_id", "user_email", "pair"] },
}

export async function GET(req: NextRequest) {
  const dataset = req.nextUrl.searchParams.get("dataset") ?? ""
  const search  = req.nextUrl.searchParams.get("search") ?? ""
  const from    = req.nextUrl.searchParams.get("from") ?? ""
  const to      = req.nextUrl.searchParams.get("to") ?? ""

  const cfg = DATASETS[dataset]
  if (!cfg) return NextResponse.json({ ok: false, error: "Unknown dataset" }, { status: 400 })

  const client = sb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = client.from(cfg.table).select("*").order("created_at", { ascending: false }).limit(500)

  // Type filter (for admin_submissions multi-type table)
  if (cfg.typeFilter) {
    query = query.eq("type", cfg.typeFilter)
  }

  // Date range
  if (from) query = query.gte("created_at", from)
  if (to)   query = query.lte("created_at", to + "T23:59:59Z")

  // Search across relevant columns
  if (search) {
    const orFilter = cfg.searchCols
      .map(col => `${col}.ilike.%25${encodeURIComponent(search)}%25`)
      .join(",")
    query = query.or(cfg.searchCols.map(col => `${col}.ilike.%${search}%`).join(","))
    void orFilter // avoid unused var
  }

  const { data, error } = await query
  if (error) {
    console.error("[api/admin/data] query error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}

// PATCH — update status on any dataset table
export async function PATCH(req: NextRequest) {
  const { id, dataset, status } = await req.json()
  const cfg = DATASETS[dataset]
  if (!cfg || !id || !status) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 })
  }

  const { error } = await sb().from(cfg.table).update({ status }).eq("id", id)
  if (error) {
    console.error("[api/admin/data] patch error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE — remove a record
export async function DELETE(req: NextRequest) {
  const { id, dataset } = await req.json()
  const cfg = DATASETS[dataset]
  if (!cfg || !id) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 })
  }

  const { error } = await sb().from(cfg.table).delete().eq("id", id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
