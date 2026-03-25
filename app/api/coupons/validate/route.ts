import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

/**
 * POST /api/coupons/validate
 * Body: { code: string, applies_to?: string }
 * Validates a coupon code and returns discount info.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, applies_to } = await req.json()
    if (!code || typeof code !== "string") {
      return NextResponse.json({ ok: false, error: "Coupon code is required" }, { status: 400 })
    }

    const data = await queryOne<Record<string, unknown>>(
      `SELECT id, code, description, discount_pct, discount_type, discount_amount,
              applies_to, is_active, expiry_date, usage_count, max_uses
       FROM discount_campaigns
       WHERE code = $1`,
      [code.trim().toUpperCase()],
    )

    if (!data) {
      return NextResponse.json({ ok: false, error: "Invalid coupon code" })
    }

    if (!data.is_active) {
      return NextResponse.json({ ok: false, error: "This coupon is no longer active" })
    }

    if (data.expiry_date && new Date(data.expiry_date as string) < new Date()) {
      return NextResponse.json({ ok: false, error: "This coupon has expired" })
    }

    const maxUses    = data.max_uses    != null ? Number(data.max_uses)    : null
    const usageCount = Number(data.usage_count ?? 0)
    if (maxUses !== null && usageCount >= maxUses) {
      return NextResponse.json({ ok: false, error: "This coupon has reached its usage limit" })
    }

    // Check applies_to restriction
    // applies_to is stored as a JSON array in Postgres (text[] or jsonb)
    const rawApplies = data.applies_to
    const appliesArr: string[] = Array.isArray(rawApplies)
      ? (rawApplies as string[])
      : typeof rawApplies === "string"
        ? (JSON.parse(rawApplies) as string[])
        : []

    if (applies_to && appliesArr.length > 0) {
      const matches = appliesArr.some((a: string) =>
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
        id:             data.id,
        code:           data.code,
        description:    data.description,
        discountType:   data.discount_type ?? "percent",
        discountPct:    Number(data.discount_pct ?? 0),
        discountAmount: data.discount_amount ?? null,
      },
    })
  } catch (err) {
    console.error("[coupon validate] error:", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
