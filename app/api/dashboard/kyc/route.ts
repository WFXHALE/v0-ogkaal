import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

// Helper — upload a File to Vercel Blob and return its URL
async function uploadDoc(file: File, userId: string, label: string): Promise<string> {
  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const blob = await put(`kyc/${userId}/${label}-${Date.now()}.${ext}`, file, { access: "public" })
  return blob.url
}

// POST — submit KYC with optional document image uploads (multipart/form-data)
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()

    const userId        = form.get("userId")        as string | null
    const aadhaarNumber = form.get("aadhaarNumber") as string | null
    const panNumber     = form.get("panNumber")     as string | null
    const kycPhone      = form.get("kycPhone")      as string | null
    const aadhaarFront  = form.get("aadhaarFront")  instanceof File ? form.get("aadhaarFront")  as File : null
    const aadhaarBack   = form.get("aadhaarBack")   instanceof File ? form.get("aadhaarBack")   as File : null
    const panDoc        = form.get("panDoc")        instanceof File ? form.get("panDoc")        as File : null

    if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

    const hasText = aadhaarNumber || panNumber || kycPhone
    const hasDocs = aadhaarFront || aadhaarBack || panDoc
    if (!hasText && !hasDocs) {
      return NextResponse.json({ error: "Please provide at least one verification detail or document." }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: user, error: fetchErr } = await supabase
      .from("dashboard_users")
      .select("id, kyc_status")
      .eq("id", userId)
      .single()

    if (fetchErr || !user) return NextResponse.json({ error: "User not found." }, { status: 404 })
    if (user.kyc_status === "approved") {
      return NextResponse.json({ error: "Your account is already verified." }, { status: 400 })
    }

    // Upload docs in parallel if provided
    const [aadhaarFrontUrl, aadhaarBackUrl, panDocUrl] = await Promise.all([
      aadhaarFront ? uploadDoc(aadhaarFront, userId, "aadhaar-front") : Promise.resolve(undefined),
      aadhaarBack  ? uploadDoc(aadhaarBack,  userId, "aadhaar-back")  : Promise.resolve(undefined),
      panDoc       ? uploadDoc(panDoc,       userId, "pan")           : Promise.resolve(undefined),
    ])

    // Build update payload with only provided fields
    const updates: Record<string, unknown> = {
      kyc_status:       "pending",
      kyc_submitted_at: new Date().toISOString(),
    }
    if (aadhaarNumber)   updates.aadhaar_number         = aadhaarNumber
    if (panNumber)       updates.pan_number             = panNumber
    if (kycPhone)        updates.kyc_phone              = kycPhone
    if (aadhaarFrontUrl) updates.kyc_doc_aadhaar_front  = aadhaarFrontUrl
    if (aadhaarBackUrl)  updates.kyc_doc_aadhaar_back   = aadhaarBackUrl
    if (panDocUrl)       updates.kyc_doc_pan            = panDocUrl

    const { error: updateErr } = await supabase
      .from("dashboard_users")
      .update(updates)
      .eq("id", userId)

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
