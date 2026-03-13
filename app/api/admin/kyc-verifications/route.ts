import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET – list all KYC submissions
export async function GET() {
  try {
    const rows = await query(
      `SELECT k.*, u.numeric_uid
       FROM kyc_verifications k
       LEFT JOIN dashboard_users u ON u.id::text = k.db_user_id
       ORDER BY k.submitted_at DESC`
    )
    return NextResponse.json({ ok: true, data: rows })
  } catch (err) {
    console.error("[admin kyc GET]", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}

// PATCH – approve / dismiss / ban
export async function PATCH(req: NextRequest) {
  try {
    const { id, action } = await req.json() as { id: string; action: "approve" | "dismiss" | "ban" }
    if (!id || !action) {
      return NextResponse.json({ ok: false, error: "id and action required" }, { status: 400 })
    }

    // db_user_id is the uuid of the dashboard_users row (stored as text)
    const kycRows = await query<{ db_user_id: string }>(
      `SELECT db_user_id FROM kyc_verifications WHERE id = $1`, [id]
    )
    const dbUserId = kycRows[0]?.db_user_id
    if (!dbUserId) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

    if (action === "approve") {
      await query(`UPDATE kyc_verifications SET status = 'approved', reviewed_at = now() WHERE id = $1`, [id])
      await query(`UPDATE dashboard_users SET kyc_status = 'approved', is_verified = true WHERE id = $1`, [dbUserId])
    } else if (action === "dismiss") {
      await query(`UPDATE kyc_verifications SET status = 'rejected', reviewed_at = now() WHERE id = $1`, [id])
      await query(`UPDATE dashboard_users SET kyc_status = 'rejected', is_verified = false WHERE id = $1`, [dbUserId])
    } else if (action === "ban") {
      await query(`UPDATE kyc_verifications SET status = 'banned', reviewed_at = now() WHERE id = $1`, [id])
      await query(`UPDATE dashboard_users SET kyc_status = 'banned', is_verified = false WHERE id = $1`, [dbUserId])
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[admin kyc PATCH]", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
