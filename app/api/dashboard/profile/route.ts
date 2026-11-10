import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

// GET — fetch profile for a user by id
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const data = await queryOne(
    "SELECT id, user_id, email, full_name, avatar_url, phone, username, created_at FROM dashboard_users WHERE id = $1",
    [id]
  )

  if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ user: data })
}

// PATCH — update full_name, phone, username, avatar_url
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, fullName, phone, username, avatarUrl } = body

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Use the same server-side PostgreSQL connection as registration/login.
  // The dashboard's custom localStorage session is not a Supabase Auth session,
  // so the browser Supabase client cannot reliably perform these writes.
  if (username) {
    const existing = await queryOne(
      "SELECT id FROM dashboard_users WHERE username = $1 AND id <> $2",
      [username.trim(), id]
    )
    if (existing) return NextResponse.json({ error: "Username already taken." }, { status: 409 })
  }

  const rows = await query(
    `UPDATE dashboard_users
       SET full_name = $1, phone = $2, username = $3, avatar_url = $4
     WHERE id = $5
     RETURNING id`,
    [
      fullName?.trim() ?? "",
      phone?.trim() || null,
      username?.trim() || null,
      avatarUrl || null,
      id,
    ]
  )

  if (!rows.length) return NextResponse.json({ error: "User not found." }, { status: 404 })
  return NextResponse.json({ success: true })
}
