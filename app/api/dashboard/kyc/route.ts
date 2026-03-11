import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST — submit KYC details
export async function POST(request: NextRequest) {
  try {
    const { userId, aadhaarNumber, panNumber, kycPhone } = await request.json()

    if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    if (!aadhaarNumber && !panNumber && !kycPhone) {
      return NextResponse.json({ error: "Please provide at least one verification detail." }, { status: 400 })
    }

    const supabase = await createClient()

    // Check user exists
    const { data: user, error: fetchErr } = await supabase
      .from("dashboard_users")
      .select("id, kyc_status")
      .eq("id", userId)
      .single()

    if (fetchErr || !user) return NextResponse.json({ error: "User not found." }, { status: 404 })
    if (user.kyc_status === "approved") {
      return NextResponse.json({ error: "Your account is already verified." }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from("dashboard_users")
      .update({
        aadhaar_number:    aadhaarNumber   || null,
        pan_number:        panNumber       || null,
        kyc_phone:         kycPhone        || null,
        kyc_status:        "pending",
        kyc_submitted_at:  new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateErr) return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 })

    return NextResponse.json({ success: true, kycStatus: "pending" })
  } catch (err) {
    console.error("[KYC] Unexpected error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}

// GET — fetch KYC status
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dashboard_users")
    .select("kyc_status, kyc_submitted_at, is_verified")
    .eq("id", userId)
    .single()

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    kycStatus:      data.kyc_status       ?? "none",
    kycSubmittedAt: data.kyc_submitted_at ?? null,
    isVerified:     data.is_verified      ?? false,
  })
}
