import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/notifications?userId=xxx&limit=30
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  const limit  = parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10)

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/notifications — create a new notification
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, recipient_id, actor_id, actor_name, actor_avatar, post_id, post_preview } = body

  if (!type || !recipient_id || !actor_id || !actor_name || !actor_avatar) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Never notify yourself
  if (recipient_id === actor_id) {
    return NextResponse.json({ data: null })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .insert({ type, recipient_id, actor_id, actor_name, actor_avatar, post_id: post_id ?? null, post_preview: post_preview ?? null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
