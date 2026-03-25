import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function normalize(r: Record<string, unknown>) {
  return {
    id:             r.id,
    code:           r.code           ?? "",
    description:    r.description    ?? "",
    discountType:   r.discount_type  ?? "percent",
    discountPct:    Number(r.discount_pct  ?? 0),
    discountAmount: r.discount_amount ?? null,
    appliesTo:      r.applies_to     ?? [],
    isActive:       r.is_active      ?? false,
    startDate:      r.start_date     ?? null,
    expiryDate:     r.expiry_date    ?? null,
    maxUses:        r.max_uses       ?? null,
    usageCount:     Number(r.usage_count ?? 0),
    pushNotify:     r.push_notify    ?? false,
    emailNotify:    r.email_notify   ?? false,
    createdAt:      r.created_at,
  }
}

/** GET /api/admin/coupons — list all coupons */
export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM discount_campaigns ORDER BY created_at DESC",
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** POST /api/admin/coupons — create coupon */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const code = String(b.code ?? "").trim().toUpperCase()
    if (!code) return NextResponse.json({ ok: false, error: "Code is required" }, { status: 400 })

    const rows = await query<Record<string, unknown>>(
      `INSERT INTO discount_campaigns
        (code, description, discount_type, discount_pct, discount_amount,
         applies_to, is_active, start_date, expiry_date, max_uses,
         usage_count, push_notify, email_notify)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12)
       RETURNING *`,
      [
        code,
        b.description    ?? "",
        b.discountType   ?? "percent",
        Number(b.discountPct ?? 0),
        b.discountAmount ?? null,
        JSON.stringify(b.appliesTo ?? []),
        b.isActive ?? true,
        b.startDate  ?? null,
        b.expiryDate ?? null,
        b.maxUses    ?? null,
        b.pushNotify  ?? false,
        b.emailNotify ?? false,
      ],
    )
    return NextResponse.json({ ok: true, data: normalize(rows[0]) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/admin/coupons — update coupon */
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })

    const sets: string[] = ["updated_at = NOW()"]
    const params: unknown[] = []

    const addField = (col: string, val: unknown) => {
      params.push(val)
      sets.push(`${col} = $${params.length}`)
    }

    if (b.code           !== undefined) addField("code",            String(b.code).trim().toUpperCase())
    if (b.description    !== undefined) addField("description",     b.description)
    if (b.discountType   !== undefined) addField("discount_type",   b.discountType)
    if (b.discountPct    !== undefined) addField("discount_pct",    Number(b.discountPct))
    if (b.discountAmount !== undefined) addField("discount_amount", b.discountAmount)
    if (b.appliesTo      !== undefined) addField("applies_to",      JSON.stringify(b.appliesTo))
    if (b.isActive       !== undefined) addField("is_active",       b.isActive)
    if (b.startDate      !== undefined) addField("start_date",      b.startDate)
    if (b.expiryDate     !== undefined) addField("expiry_date",     b.expiryDate)
    if (b.maxUses        !== undefined) addField("max_uses",        b.maxUses)
    if (b.pushNotify     !== undefined) addField("push_notify",     b.pushNotify)
    if (b.emailNotify    !== undefined) addField("email_notify",    b.emailNotify)

    params.push(b.id)
    const rows = await query<Record<string, unknown>>(
      `UPDATE discount_campaigns SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params,
    )
    if (!rows.length) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true, data: normalize(rows[0]) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** DELETE /api/admin/coupons — delete coupon */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM discount_campaigns WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
