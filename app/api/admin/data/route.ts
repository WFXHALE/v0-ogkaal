import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

type DatasetConfig = {
  table:       string
  typeFilter?: string        // exact match on `type` column (OR list separated by |)
  planFilter?: string        // filter on details->>'plan' for mentorship sub-sections
  searchCols:  string[]      // columns to ILIKE-search
}

const DATASETS: Record<string, DatasetConfig> = {
  "usdt-buy":          { table: "usdt_buy_requests", searchCols: ["email", "name", "phone", "user_id"] },
  "usdt-sell":         { table: "usdt_sell_requests", searchCols: ["email", "name", "phone", "user_id"] },
  // Mentorship sub-sections: filtered by type='mentorship' AND details->>'plan'
  "mentorship-1":      { table: "admin_submissions", typeFilter: "mentorship", planFilter: "1.0",    searchCols: ["email", "name", "phone", "user_id"] },
  "mentorship-2":      { table: "admin_submissions", typeFilter: "mentorship", planFilter: "2.0",    searchCols: ["email", "name", "phone", "user_id"] },
  "mentorship-crypto": { table: "admin_submissions", typeFilter: "mentorship", planFilter: "crypto", searchCols: ["email", "name", "phone", "user_id"] },
  // Generic mentorship (legacy)
  "mentorship":        { table: "admin_submissions", typeFilter: "mentorship",                        searchCols: ["email", "name", "phone", "user_id"] },
  // VIP — covers both vip_membership and vip_group types
  "vip":               { table: "admin_submissions", typeFilter: "vip",        searchCols: ["email", "name", "phone", "user_id"] },
  "users":             { table: "dashboard_users",   searchCols: ["user_id", "email", "full_name", "username"] },
}

export async function GET(req: NextRequest) {
  const dataset = req.nextUrl.searchParams.get("dataset") ?? ""
  const search  = req.nextUrl.searchParams.get("search")  ?? ""
  const from    = req.nextUrl.searchParams.get("from")    ?? ""
  const to      = req.nextUrl.searchParams.get("to")      ?? ""

  const cfg = DATASETS[dataset]
  if (!cfg) return NextResponse.json({ ok: false, error: "Unknown dataset" }, { status: 400 })

  const params: unknown[] = []
  const conditions: string[] = []

  if (cfg.typeFilter) {
    params.push(`${cfg.typeFilter}%`)
    conditions.push(`type ILIKE $${params.length}`)
  }
  if (cfg.planFilter) {
    params.push(cfg.planFilter)
    conditions.push(`details->>'plan' ILIKE $${params.length}`)
  }
  if (from) {
    params.push(from)
    conditions.push(`created_at >= $${params.length}`)
  }
  if (to) {
    params.push(to + "T23:59:59Z")
    conditions.push(`created_at <= $${params.length}`)
  }
  if (search) {
    const searchConditions = cfg.searchCols.map(col => {
      params.push(`%${search}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    conditions.push(`(${searchConditions.join(" OR ")})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const sql = `SELECT * FROM ${cfg.table} ${where} ORDER BY created_at DESC LIMIT 500`

  try {
    const data = await query(sql, params)
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error("[api/admin/data] query error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, dataset, status } = await req.json()
    const cfg = DATASETS[dataset]
    if (!cfg || !id || !status) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 })
    }
    await query(`UPDATE ${cfg.table} SET status = $1 WHERE id = $2`, [status, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[api/admin/data] patch error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, dataset } = await req.json()
    const cfg = DATASETS[dataset]
    if (!cfg || !id) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 })
    }
    await query(`DELETE FROM ${cfg.table} WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
