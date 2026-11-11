import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { setDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DASHBOARD_SESSION_SECRET || process.env.DASHBOARD_SESSION_SECRET.length < 32) {
      return NextResponse.json({ error: "Dashboard authentication is temporarily unavailable. Please contact support." }, { status: 503 })
    }

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

    if (!data.is_verified) {
      return NextResponse.json({ error: "Please verify your email before logging in." }, { status: 403 })
    }

    const safeUser = {
      id: String(data.id),
      user_id: String(data.user_id),
      email: String(data.email),
      full_name: String(data.full_name),
      created_at: data.created_at,
      numeric_uid: data.numeric_uid ?? null,
      trading_level: data.trading_level ?? null,
      market_type: data.market_type ?? null,
      trading_type: data.trading_type ?? null,
      years_experience: data.years_experience ?? null,
      is_verified: Boolean(data.is_verified),
      kyc_status: data.kyc_status ?? "none",
      avatar_url: data.avatar_url ?? null,
    }

    const response = NextResponse.json({ ok: true, data: safeUser })
    return setDashboardSession(response, {
      userId: safeUser.user_id,
      email: safeUser.email,
    })
  } catch (err) {
    console.error("[login-backup] error:", err)
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 })
  }
}
