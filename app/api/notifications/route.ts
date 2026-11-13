import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rawLimit = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 30
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: "Could not load notifications" }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { type, recipient_id, actor_name, actor_avatar, post_id, post_preview } = body
  if (typeof type !== "string" || !type.trim() ||
      typeof recipient_id !== "string" || !recipient_id ||
      typeof actor_name !== "string" || !actor_name.trim() ||
      typeof actor_avatar !== "string") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  if (recipient_id === user.id) return NextResponse.json({ data: null })

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      type: type.trim(),
      recipient_id,
      actor_id: user.id,
      actor_name: actor_name.trim().slice(0, 120),
      actor_avatar: actor_avatar.slice(0, 2048),
      post_id: typeof post_id === "string" ? post_id : null,
      post_preview: typeof post_preview === "string" ? post_preview.slice(0, 500) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Could not create notification" }, { status: 500 })
  return NextResponse.json({ data })
}
