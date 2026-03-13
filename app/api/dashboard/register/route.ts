import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId, email, fullName, passwordHash, backupCode, backupCodeHash,
      numericUid, tradingLevel, marketType, tradingType, yearsExperience,
    } = body

    if (!userId || !email || !fullName || !passwordHash) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    // Check duplicate user_id
    const existingId = await queryOne(
      "SELECT id FROM dashboard_users WHERE user_id = $1",
      [userId.trim().toLowerCase()]
    )
    if (existingId) {
      return NextResponse.json({ error: "User ID already taken. Please choose another." }, { status: 409 })
    }

    // Check duplicate email
    const existingEmail = await queryOne(
      "SELECT id FROM dashboard_users WHERE email = $1",
      [email.trim().toLowerCase()]
    )
    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 409 })
    }

    const rows = await query<Record<string, unknown>>(
      `INSERT INTO dashboard_users
        (user_id, email, full_name, password_hash, backup_code, backup_code_hash,
         numeric_uid, trading_level, market_type, trading_type, years_experience)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, user_id, email, full_name, created_at, numeric_uid,
                 trading_level, market_type, trading_type, years_experience`,
      [
        userId.trim().toLowerCase(),
        email.trim().toLowerCase(),
        fullName.trim(),
        passwordHash,
        backupCode,
        backupCodeHash,
        numericUid,
        tradingLevel  || null,
        marketType    || null,
        tradingType   || null,
        yearsExperience || null,
      ]
    )

    const data = rows[0]
    if (!data) return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })

    return NextResponse.json({ ok: true, data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("duplicate") || msg.includes("unique"))
      return NextResponse.json({ error: "An account with this User ID or email already exists." }, { status: 409 })
    console.error("[register] error:", err)
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
  }
}
