import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { identifier, passwordHash } = await req.json() as {
      identifier?: string
      passwordHash?: string
    }

    if (!identifier || !passwordHash) {
      return NextResponse.json({ error: "identifier and passwordHash are required." }, { status: 400 })
    }

    const cleaned = identifier.trim().toLowerCase()

    // Try user_id first, then email
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
      return NextResponse.json(
        { error: "No account found. Please register first." },
        { status: 404 }
      )
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

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error("[login] error:", err)
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 })
  }
}
