import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const { error } = await supabase.from("admin_submissions").insert({
      type:           body.type,
      name:           body.name,
      email:          body.email   ?? null,
      phone:          body.phone   ?? null,
      telegram:       body.telegram ?? null,
      details:        body.details ?? {},
      status:         body.status  ?? "pending",
      ip_address:     body.ip_address ?? null,
      location:       body.location   ?? null,
      wallet_address: body.wallet_address ?? null,
      upi_id:         body.upi_id        ?? null,
      inr_equivalent: body.inr_equivalent ?? null,
      amount_paid:    body.amount_paid    ?? null,
      screenshot_url: body.screenshot_url ?? null,
    })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("admin_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) throw error
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    const supabase = await createClient()
    const { error } = await supabase.from("admin_submissions").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 })
    const supabase = await createClient()
    const { error } = await supabase.from("admin_submissions").update({ status }).eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
