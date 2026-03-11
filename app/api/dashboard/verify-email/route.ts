import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { email, userId, otp } = await req.json() as {
      email?: string
      userId?: string
      otp?: string
    }

    if (!email || !userId || !otp) {
      return NextResponse.json({ error: "email, userId and otp are required." }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()
    const inputHash  = await hashToken(otp.trim())

    // Find the most recent unused, unexpired token for this user
    const { data: token } = await supabase
      .from("email_verification_tokens")
      .select("id, token_hash, expires_at, used_at")
      .eq("user_id", userId)
      .eq("email", normalised)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!token) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      )
    }

    if (new Date(token.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    if (token.token_hash !== inputHash) {
      return NextResponse.json({ error: "Incorrect code. Please check and try again." }, { status: 400 })
    }

    // Mark token as used
    await supabase
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", token.id)

    // Mark user as verified
    const { error: updateErr } = await supabase
      .from("dashboard_users")
      .update({ is_verified: true })
      .eq("user_id", userId)

    if (updateErr) {
      console.error("[verify-email] Failed to update user:", updateErr)
      return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[verify-email] Unexpected error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
