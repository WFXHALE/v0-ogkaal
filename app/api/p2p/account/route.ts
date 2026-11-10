import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { avatarUrl } from "@/lib/community-utils"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function authContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { supabase, user: error ? null : user }
}
function mapProfile(row: Record<string, unknown>) {
  return { id: String(row.user_id), fullName: String(row.full_name || ""), email: String(row.email || ""), phone: String(row.phone || ""), level: String(row.level || "Beginner"), avatar: String(row.avatar || ""), createdAt: String(row.created_at || new Date().toISOString()) }
}
export async function GET() {
  const { supabase, user } = await authContext()
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 })
  const { data, error } = await supabase.from("p2p_user_profiles").select("*").eq("user_id", user.id).maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: "Could not load your P2P profile." }, { status: 500 })
  if (!data) return NextResponse.json({ ok: false, error: "P2P profile is not set up yet." }, { status: 404 })
  return NextResponse.json({ ok: true, user: mapProfile(data) }, { headers: { "Cache-Control": "private, no-store" } })
}
export async function POST(request: Request) {
  const { supabase, user } = await authContext()
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const metadata = user.user_metadata || {}
  const fullName = String(body.fullName || metadata.full_name || metadata.name || user.email?.split("@")[0] || "").trim()
  const phone = String(body.phone || metadata.phone || "").trim()
  const level = String(body.level || metadata.level || "Beginner")
  if (!fullName) return NextResponse.json({ ok: false, error: "Your name is required." }, { status: 400 })
  const allowedLevels = ["Beginner", "Trader", "Pro Trader", "Master Trader"]
  if (!allowedLevels.includes(level)) return NextResponse.json({ ok: false, error: "Invalid trader level." }, { status: 400 })
  const avatar = String(metadata.avatar_url || metadata.picture || avatarUrl(fullName, level as "Beginner" | "Trader" | "Pro Trader" | "Master Trader"))
  const { data, error } = await supabase.from("p2p_user_profiles").upsert({ user_id: user.id, full_name: fullName, email: (user.email || "").toLowerCase(), phone, level, avatar, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("*").single()
  if (error) {
    console.error("[p2p/account] profile upsert failed:", { code: error.code, message: error.message })
    return NextResponse.json({ ok: false, error: "Could not save your P2P profile. Please try again." }, { status: 500 })
  }
  return NextResponse.json({ ok: true, user: mapProfile(data) }, { headers: { "Cache-Control": "private, no-store" } })
}
