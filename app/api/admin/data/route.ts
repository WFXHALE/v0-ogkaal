import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

function sb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

const TABLE_MAP: Record<string, string> = {
  "usdt-buy":    "usdt_buy_requests",
  "usdt-sell":   "usdt_sell_requests",
  "mentorship":  "admin_submissions",
  "vip":         "admin_submissions",
  "users":       "dashboard_users",
  "community":   "community_posts",
  "journal":     "trading_journal",
}

export async function GET(req: NextRequest) {
  const dataset = req.nextUrl.searchParams.get("dataset") ?? ""
  const search  = req.nextUrl.searchParams.get("search") ?? ""
  const from    = req.nextUrl.searchParams.get("from") ?? ""
  const to      = req.nextUrl.searchParams.get("to") ?? ""

  const table = TABLE_MAP[dataset]
  if (!table) return NextResponse.json({ ok: false, error: "Unknown dataset" }, { status: 400 })

  const client = sb()
  let query = client.from(table).select("*").order("created_at", { ascending: false }).limit(500)

  // Filter mentorship/vip by type column in admin_submissions
  if (dataset === "mentorship") query = (query as ReturnType<typeof client.from>).eq("type", "mentorship")
  if (dataset === "vip")        query = (query as ReturnType<typeof client.from>).ilike("type", "%vip%")

  // Date range
  if (from) query = (query as ReturnType<typeof client.from>).gte("created_at", from)
  if (to)   query = (query as ReturnType<typeof client.from>).lte("created_at", to + "T23:59:59Z")

  // Search — broad ilike across common text fields
  if (search) {
    const s = `%${search}%`
    if (["usdt-buy", "usdt-sell"].includes(dataset)) {
      query = (query as ReturnType<typeof client.from>).or(
        `user_id.ilike.${s},email.ilike.${s},name.ilike.${s},phone.ilike.${s}`,
      )
    } else if (dataset === "users") {
      query = (query as ReturnType<typeof client.from>).or(
        `user_id.ilike.${s},email.ilike.${s},full_name.ilike.${s},username.ilike.${s}`,
      )
    } else if (dataset === "community") {
      query = (query as ReturnType<typeof client.from>).or(
        `author_id.ilike.${s},author_name.ilike.${s},content.ilike.${s}`,
      )
    } else if (dataset === "journal") {
      query = (query as ReturnType<typeof client.from>).or(
        `user_id.ilike.${s},user_email.ilike.${s},pair.ilike.${s}`,
      )
    } else {
      query = (query as ReturnType<typeof client.from>).or(
        `email.ilike.${s},name.ilike.${s},phone.ilike.${s}`,
      )
    }
  }

  const { data, error } = await query
  if (error) {
    console.error("[api/admin/data] query error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}

// PATCH — update status on usdt_buy_requests / usdt_sell_requests / admin_submissions
export async function PATCH(req: NextRequest) {
  const { id, dataset, status } = await req.json()
  const table = TABLE_MAP[dataset]
  if (!table || !id || !status) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 })
  }

  const { error } = await sb().from(table).update({ status }).eq("id", id)
  if (error) {
    console.error("[api/admin/data] patch error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE — remove a record
export async function DELETE(req: NextRequest) {
  const { id, dataset } = await req.json()
  const table = TABLE_MAP[dataset]
  if (!table || !id) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 })
  }

  const { error } = await sb().from(table).delete().eq("id", id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
