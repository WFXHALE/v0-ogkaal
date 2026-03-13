import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET /api/dashboard/fetch-backup-code?userId=...
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const rows = await query<{ backup_code: string | null; id: string }>(
      `SELECT id, backup_code FROM dashboard_users WHERE id = $1 LIMIT 1`,
      [userId]
    )
    if (!rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (rows[0].backup_code) {
      return NextResponse.json({ ok: true, backupCode: rows[0].backup_code })
    }

    // Generate and save a new backup code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 16; i++) {
      if (i === 4 || i === 8 || i === 12) code += "-"
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    await query(
      `UPDATE dashboard_users SET backup_code = $1 WHERE id = $2`,
      [code, userId]
    )
    return NextResponse.json({ ok: true, backupCode: code })
  } catch (err) {
    console.error("[fetch-backup-code]", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
