import { type NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/require-admin-api"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const denied = await requireAdminApi(req)
  if (denied) return denied
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT id, user_id, username, broker, trader_id, screenshot_url, status, created_at
       FROM broker_account_verifications
       ORDER BY created_at DESC
       LIMIT 500`,
      []
    )
    return NextResponse.json({ ok: true, data: rows })
  } catch (err) {
    console.error("[admin/broker-verifications GET]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdminApi(request)
  if (denied) return denied
  try {
    const { id, status } = await request.json()
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "id and status required" }, { status: 400 })
    }
    const valid = ["pending", "approved", "rejected"]
    if (!valid.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
    }
    await query(
      `UPDATE broker_account_verifications SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[admin/broker-verifications PATCH]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdminApi(request)
  if (denied) return denied
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })
    await query(`DELETE FROM broker_account_verifications WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[admin/broker-verifications DELETE]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
