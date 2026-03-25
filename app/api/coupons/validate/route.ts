import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * POST /api/coupons/validate
 * Body: { code: string, applies_to: string }
 * Validates a coupon code and returns discount info.
 * Uses service client because discount_campaigns RLS only allows admin access.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, applies_to } = await req.json()
    if (!code || typeof code !== "string") {
      return NextResponse.json({ ok: false, error: "Coupon code is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("discount_campaigns")
      .select("id, code, description, discount_pct, discount_type, discount_amount, applies_to, is_active, expiry_date, usage_count, max_uses")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ ok: false, error: "Invalid coupon code" })
    }

    if (!data.is_active) {
      return NextResponse.json({ ok: false, error: "This coupon is no longer active" })
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      return NextResponse.json({ ok: false, error: "This coupon has expired" })
    }

    if (data.max_uses !== null && data.usage_count >= data.max_uses) {
      return NextResponse.json({ ok: false, error: "This coupon has reached its usage limit" })
    }

    // Check applies_to — if coupon has restrictions, verify the context matches
    if (applies_to && data.applies_to && data.applies_to.length > 0) {
      const matches = data.applies_to.some((a: string) =>
        a.toLowerCase() === applies_to.toLowerCase() ||
        applies_to.toLowerCase().includes(a.toLowerCase())
      )
      if (!matches) {
        return NextResponse.json({ ok: false, error: `This coupon is not valid for ${applies_to}` })
      }
    }

    return NextResponse.json({
      ok: true,
      coupon: {
        id:              data.id,
        code:            data.code,
        description:     data.description,
        discountType:    data.discount_type ?? "percent",
        discountPct:     data.discount_pct ?? 0,
        discountAmount:  data.discount_amount ?? null,
      },
    })
  } catch (err) {
    console.error("[coupon validate] error:", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
