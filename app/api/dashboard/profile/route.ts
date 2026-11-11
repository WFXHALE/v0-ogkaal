import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  const data = await queryOne(
    "SELECT id, user_id, email, full_name, avatar_url, phone, username, created_at FROM dashboard_users WHERE user_id = $1",
    [session.sub]
  )
  if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ user: data })
}

export async function PATCH(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    const { fullName, phone, username, avatarUrl } = await req.json()
    if (username && typeof username !== "string") return NextResponse.json({ error: "Invalid username." }, { status: 400 })
    if (fullName !== undefined && typeof fullName !== "string") return NextResponse.json({ error: "Invalid name." }, { status: 400 })
    if (phone !== undefined && phone !== null && typeof phone !== "string") return NextResponse.json({ error: "Invalid phone." }, { status: 400 })

    if (username?.trim()) {
      const existing = await queryOne(
        "SELECT id FROM dashboard_users WHERE username = $1 AND user_id <> $2",
        [username.trim(), session.sub]
      )
      if (existing) return NextResponse.json({ error: "Username already taken." }, { status: 409 })
    }

    const rows = await query(
      `UPDATE dashboard_users
       SET full_name = COALESCE($1, full_name),
           phone = $2,
           username = $3,
           avatar_url = COALESCE($4, avatar_url)
       WHERE user_id = $5
       RETURNING id`,
      [
        fullName === undefined ? null : fullName.trim(),
        phone?.trim() || null,
        username?.trim() || null,
        avatarUrl || null,
        session.sub,
      ]
    )
    if (!rows.length) return NextResponse.json({ error: "User not found." }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }
}
