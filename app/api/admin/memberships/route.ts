import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

function normalize(r: Record<string, unknown>) {
  return {
    id:         r.id,
    userId:     r.user_id    ?? "",
    userEmail:  r.email      ?? "",
    userName:   r.name       ?? "",
    plan:       r.plan       ?? "Free",
    status:     r.status     ?? "none",
    joinDate:   r.joined_at  ?? r.created_at ?? "",
    expiryDate: r.expires_at ?? null,
    amountPaid: r.amount     ?? null,
    notes:      r.notes      ?? null,
    createdAt:  r.created_at,
  }
}

/** GET /api/admin/memberships — list all memberships */
export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM memberships ORDER BY created_at DESC LIMIT 500",
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/admin/memberships — update membership status */
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })

    const sets: string[] = []
    const params: unknown[] = []

    const add = (col: string, val: unknown) => { params.push(val); sets.push(`${col} = $${params.length}`) }

    if (b.status    !== undefined) add("status",     b.status)
    if (b.expiresAt !== undefined) add("expires_at", b.expiresAt)
    if (b.joinedAt  !== undefined) add("joined_at",  b.joinedAt)

    if (!sets.length) return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 })

    params.push(b.id)
    const rows = await query<Record<string, unknown>>(
      `UPDATE memberships SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params,
    )

    // Also update the linked admin_submission if submissionId provided
    if (b.submissionId && b.status === "approved") {
      await query(
        "UPDATE admin_submissions SET status = 'approved' WHERE id = $1",
        [b.submissionId],
      )
    }

    return NextResponse.json({ ok: true, data: rows[0] ? normalize(rows[0]) : null })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** DELETE /api/admin/memberships — revoke membership (set status = expired) */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("UPDATE memberships SET status = 'expired' WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// Suppress unused import warning
void queryOne
