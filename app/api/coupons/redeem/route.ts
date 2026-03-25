import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/coupons/redeem
 * Body: { id: string }
 * Increments usage_count for the given coupon id.
 * Called fire-and-forget from the client after a successful payment submission.
 */
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Missing coupon id" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch current usage_count and max_uses first to avoid exceeding the cap
    const { data: coupon, error: fetchErr } = await supabase
      .from("discount_campaigns")
      .select("usage_count, max_uses, is_active")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !coupon) {
      return NextResponse.json({ ok: false, error: "Coupon not found" }, { status: 404 })
    }

    // Guard: don't increment beyond max_uses
    if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const { error: updateErr } = await supabase
      .from("discount_campaigns")
      .update({ usage_count: coupon.usage_count + 1 })
      .eq("id", id)

    if (updateErr) throw updateErr

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[coupon redeem] error:", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
