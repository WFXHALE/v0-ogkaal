import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET — fetch profile for a user by id
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dashboard_users")
    .select("id, user_id, email, full_name, avatar_url, phone, username, created_at")
    .eq("id", id)
    .single()

  if (error || !data) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ user: data })
}

// PATCH — update full_name, phone, username, avatar_url
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, fullName, phone, username, avatarUrl } = body

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const supabase = await createClient()

  // If username is being changed, ensure it's unique
  if (username) {
    const { data: existing } = await supabase
      .from("dashboard_users")
      .select("id")
      .eq("username", username.trim())
      .neq("id", id)
      .single()
    if (existing) return NextResponse.json({ error: "Username already taken." }, { status: 409 })
  }

  const updates: Record<string, string | null> = {}
  if (fullName  !== undefined) updates.full_name  = fullName.trim()
  if (phone     !== undefined) updates.phone      = phone.trim() || null
  if (username  !== undefined) updates.username   = username.trim() || null
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl || null

  const { error } = await supabase
    .from("dashboard_users")
    .update(updates)
    .eq("id", id)

  if (error) return NextResponse.json({ error: "Failed to update profile." }, { status: 500 })
  return NextResponse.json({ success: true })
}
