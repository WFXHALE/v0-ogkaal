import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

/**
 * POST /api/coupons/redeem
 * Body: { id: string }
 * Increments usage_count for the given coupon id.
 */
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Missing coupon id" }, { status: 400 })
    }

    const coupon = await queryOne<Record<string, unknown>>(
      "SELECT usage_count, max_uses, is_active FROM discount_campaigns WHERE id = $1",
      [id],
    )

    if (!coupon) {
      return NextResponse.json({ ok: false, error: "Coupon not found" }, { status: 404 })
    }

    const maxUses    = coupon.max_uses    != null ? Number(coupon.max_uses)    : null
    const usageCount = Number(coupon.usage_count ?? 0)

    // Guard: don't increment beyond max_uses
    if (maxUses !== null && usageCount >= maxUses) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    await query(
      "UPDATE discount_campaigns SET usage_count = usage_count + 1 WHERE id = $1",
      [id],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[coupon redeem] error:", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
