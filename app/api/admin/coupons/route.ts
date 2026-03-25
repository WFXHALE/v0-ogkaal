import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function normalize(r: Record<string, unknown>) {
  return {
    id:             r.id,
    code:           r.code           ?? "",
    description:    r.description    ?? "",
    discountType:   r.discount_type  ?? "percent",
    discountPct:    r.discount_pct   ?? 0,
    discountAmount: r.discount_amount ?? null,
    appliesTo:      r.applies_to     ?? [],
    isActive:       r.is_active      ?? false,
    startDate:      r.start_date     ?? null,
    expiryDate:     r.expiry_date    ?? null,
    maxUses:        r.max_uses       ?? null,
    usageCount:     r.usage_count    ?? 0,
    pushNotify:     r.push_notify    ?? false,
    emailNotify:    r.email_notify   ?? false,
    createdAt:      r.created_at,
  }
}

/** GET /api/admin/coupons — list all coupons */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("discount_campaigns")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ ok: true, data: (data ?? []).map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** POST /api/admin/coupons — create coupon */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("discount_campaigns")
      .insert({
        code:            String(b.code ?? "").trim().toUpperCase(),
        description:     b.description    ?? "",
        discount_type:   b.discountType   ?? "percent",
        discount_pct:    Number(b.discountPct ?? 0),
        discount_amount: b.discountAmount  ?? null,
        applies_to:      b.appliesTo       ?? [],
        is_active:       b.isActive        ?? true,
        start_date:      b.startDate       ?? null,
        expiry_date:     b.expiryDate      ?? null,
        max_uses:        b.maxUses         ?? null,
        usage_count:     0,
        push_notify:     b.pushNotify      ?? false,
        email_notify:    b.emailNotify     ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, data: normalize(data as Record<string, unknown>) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/admin/coupons — update coupon */
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })

    const supabase = await createClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (b.code           !== undefined) updates.code            = String(b.code).trim().toUpperCase()
    if (b.description    !== undefined) updates.description     = b.description
    if (b.discountType   !== undefined) updates.discount_type   = b.discountType
    if (b.discountPct    !== undefined) updates.discount_pct    = Number(b.discountPct)
    if (b.discountAmount !== undefined) updates.discount_amount = b.discountAmount
    if (b.appliesTo      !== undefined) updates.applies_to      = b.appliesTo
    if (b.isActive       !== undefined) updates.is_active       = b.isActive
    if (b.startDate      !== undefined) updates.start_date      = b.startDate
    if (b.expiryDate     !== undefined) updates.expiry_date     = b.expiryDate
    if (b.maxUses        !== undefined) updates.max_uses        = b.maxUses
    if (b.pushNotify     !== undefined) updates.push_notify     = b.pushNotify
    if (b.emailNotify    !== undefined) updates.email_notify    = b.emailNotify

    const { data, error } = await supabase
      .from("discount_campaigns")
      .update(updates)
      .eq("id", b.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, data: normalize(data as Record<string, unknown>) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** DELETE /api/admin/coupons — delete coupon */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase.from("discount_campaigns").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
