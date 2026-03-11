import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function inferSection(type: string): string {
  if (type === "usdt_buy")   return "usdt-buy"
  if (type === "usdt_sell")  return "usdt-sell"
  if (type === "usdt")       return "usdt-buy"
  if (type === "suspicious") return "suspicious"
  return "payment-verification"
}

// GET — list all admin notifications (newest first)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) throw error

    const normalized = (data ?? []).map(n => ({
      id:         n.id,
      type:       n.type,
      title:      n.title ?? "",
      message:    n.message,
      // Derive status from is_read boolean — unread = unread, read = read
      // The DB column is boolean is_read; we surface both for flexibility
      read:       Boolean(n.is_read),
      status:     n.is_read ? "read" : "unread",
      createdAt:  n.created_at,
      refId:      n.ref_id ?? "",
      refSection: (n.ref_id ? inferSection(n.type) : "") as string,
    }))
    return NextResponse.json({ ok: true, data: normalized })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// PATCH — mark one notification read, or mark all read
// Body: { id: string }           → mark single notification read
//       { markAll: true }        → mark all unread notifications read
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    if (body.markAll) {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("is_read", false)
      if (error) throw error
    } else if (body.id) {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", body.id)
      if (error) throw error
    } else {
      return NextResponse.json({ ok: false, error: "Missing id or markAll" }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// DELETE — delete a single notification permanently
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    const supabase = await createClient()
    const { error } = await supabase.from("admin_notifications").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
