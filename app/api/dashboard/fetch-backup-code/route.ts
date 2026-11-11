import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { query } from "@/lib/db"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    const rows = await query<{ backup_code: string | null }>(
      "SELECT backup_code FROM dashboard_users WHERE user_id = $1 LIMIT 1",
      [session.sub]
    )
    if (!rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (rows[0].backup_code) {
      return NextResponse.json({ ok: true, backupCode: rows[0].backup_code })
    }

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const bytes = randomBytes(16)
    let raw = ""
    for (const byte of bytes) raw += chars[byte % chars.length]
    const code = raw.match(/.{1,4}/g)?.join("-") ?? raw

    await query(
      "UPDATE dashboard_users SET backup_code = $1 WHERE user_id = $2",
      [code, session.sub]
    )
    return NextResponse.json({ ok: true, backupCode: code })
  } catch (err) {
    console.error("[fetch-backup-code]", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
