import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { setDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DASHBOARD_SESSION_SECRET || process.env.DASHBOARD_SESSION_SECRET.length < 32) {
      return NextResponse.json({ error: "Dashboard authentication is temporarily unavailable. Please contact support." }, { status: 503 })
    }

    const { identifier, passwordHash } = await req.json() as {
      identifier?: string
      passwordHash?: string
    }

    if (!identifier || !passwordHash) {
      return NextResponse.json({ error: "identifier and passwordHash are required." }, { status: 400 })
    }

    const cleaned = identifier.trim().toLowerCase()
    let data = await queryOne<Record<string, unknown>>(
      "SELECT * FROM dashboard_users WHERE user_id = $1",
      [cleaned]
    )

    if (!data) {
      data = await queryOne<Record<string, unknown>>(
        "SELECT * FROM dashboard_users WHERE email = $1",
        [cleaned]
      )
    }

    if (!data) {
      return NextResponse.json({ error: "No account found. Please register first." }, { status: 404 })
    }

    if (data.password_hash !== passwordHash) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
    }

    if (!data.is_verified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED", userId: data.user_id, email: data.email },
        { status: 403 }
      )
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
    console.error("[login] error:", err)
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 })
  }
}
