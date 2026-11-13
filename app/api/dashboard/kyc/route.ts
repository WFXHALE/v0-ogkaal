import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getDashboardSession } from "@/lib/dashboard-session"
import { put } from "@vercel/blob"

export const runtime = "nodejs"

async function uploadDoc(file: File, userId: string, label: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const blob = await put(`kyc/${userId}/${label}-${Date.now()}-${crypto.randomUUID()}${ext ? `.${ext}` : ""}`, file, { access: "public" })
  return blob.url
}

export async function POST(request: NextRequest) {
  const session = getDashboardSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    const form = await request.formData()
    const aadhaarNumber = form.get("aadhaarNumber") as string | null
    const panNumber = form.get("panNumber") as string | null
    const kycPhone = form.get("kycPhone") as string | null
    const aadhaarFront = form.get("aadhaarFront") instanceof File ? form.get("aadhaarFront") as File : null
    const aadhaarBack = form.get("aadhaarBack") instanceof File ? form.get("aadhaarBack") as File : null
    const panDoc = form.get("panDoc") instanceof File ? form.get("panDoc") as File : null

    if (![aadhaarFront, aadhaarBack, panDoc].some(Boolean) && ![aadhaarNumber, panNumber, kycPhone].some(Boolean)) {
      return NextResponse.json({ error: "Please provide at least one verification detail or document." }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: user, error: fetchErr } = await supabase
      .from("dashboard_users")
      .select("id, kyc_status")
      .eq("user_id", session.sub)
      .single()

    if (fetchErr || !user) return NextResponse.json({ error: "User not found." }, { status: 404 })
    if (user.kyc_status === "approved") {
      return NextResponse.json({ error: "Your account is already verified." }, { status: 400 })
    }

    const [aadhaarFrontUrl, aadhaarBackUrl, panDocUrl] = await Promise.all([
      aadhaarFront ? uploadDoc(aadhaarFront, session.sub, "aadhaar-front") : Promise.resolve(undefined),
      aadhaarBack ? uploadDoc(aadhaarBack, session.sub, "aadhaar-back") : Promise.resolve(undefined),
      panDoc ? uploadDoc(panDoc, session.sub, "pan") : Promise.resolve(undefined),
    ])

    const updates: Record<string, unknown> = {
      kyc_status: "pending",
      kyc_submitted_at: new Date().toISOString(),
    }
    if (aadhaarNumber) updates.aadhaar_number = aadhaarNumber
    if (panNumber) updates.pan_number = panNumber
    if (kycPhone) updates.kyc_phone = kycPhone
    if (aadhaarFrontUrl) updates.kyc_doc_aadhaar_front = aadhaarFrontUrl
    if (aadhaarBackUrl) updates.kyc_doc_aadhaar_back = aadhaarBackUrl
    if (panDocUrl) updates.kyc_doc_pan = panDocUrl

    const { error: updateErr } = await supabase
      .from("dashboard_users")
      .update(updates)
      .eq("user_id", session.sub)

    if (updateErr) {
      console.error("[KYC] DB update error:", updateErr)
      return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 })
    }
    return NextResponse.json({ success: true, kycStatus: "pending" })
  } catch (err) {
    console.error("[KYC] Unexpected error:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = getDashboardSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("dashboard_users")
    .select("kyc_status, kyc_submitted_at, is_verified")
    .eq("user_id", session.sub)
    .single()

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    kycStatus: data.kyc_status ?? "none",
    kycSubmittedAt: data.kyc_submitted_at ?? null,
    isVerified: data.is_verified ?? false,
  })
}
