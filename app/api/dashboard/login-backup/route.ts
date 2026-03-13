import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email, backupCodeHash } = await req.json() as {
      email?: string
      backupCodeHash?: string
    }

    if (!email || !backupCodeHash) {
      return NextResponse.json({ error: "email and backupCodeHash are required." }, { status: 400 })
    }

    const data = await queryOne<Record<string, unknown>>(
      "SELECT * FROM dashboard_users WHERE email = $1",
      [email.trim().toLowerCase()]
    )

    if (!data) {
      return NextResponse.json({ error: "No account found with that email." }, { status: 404 })
    }

    if (data.backup_code_hash !== backupCodeHash) {
      return NextResponse.json({ error: "Invalid backup code." }, { status: 401 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error("[login-backup] error:", err)
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 })
  }
}
