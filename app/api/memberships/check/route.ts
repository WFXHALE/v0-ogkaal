import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

/**
 * GET /api/memberships/check?userId=...&email=...
 * Returns the active membership for a user (by userId or email).
 * Used by VIP Signals, VIP Group and other gated pages so they never
 * call the Supabase JS client directly from the browser.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const email  = searchParams.get("email")

    if (!userId && !email) {
      return NextResponse.json({ ok: false, error: "userId or email required" }, { status: 400 })
    }

    let membership: Record<string, unknown> | null = null

    if (userId) {
      membership = await queryOne<Record<string, unknown>>(
        `SELECT id, user_id, email, name, plan, status, joined_at, expires_at, amount, notes, created_at
         FROM memberships WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId],
      )
    }

    if (!membership && email) {
      membership = await queryOne<Record<string, unknown>>(
        `SELECT id, user_id, email, name, plan, status, joined_at, expires_at, amount, notes, created_at
         FROM memberships WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
        [email],
      )
    }

    if (!membership) {
      return NextResponse.json({ ok: true, membership: null })
    }

    return NextResponse.json({
      ok: true,
      membership: {
        id:         membership.id,
        userId:     membership.user_id   ?? "",
        userEmail:  membership.email     ?? "",
        userName:   membership.name      ?? "",
        plan:       membership.plan      ?? "Free",
        status:     membership.status    ?? "none",
        joinDate:   membership.joined_at ?? membership.created_at ?? "",
        expiryDate: membership.expires_at ?? null,
        amountPaid: membership.amount    ?? null,
      },
    })
  } catch (err) {
    console.error("[memberships/check] error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
