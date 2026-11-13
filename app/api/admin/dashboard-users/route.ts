import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminApi } from "@/lib/require-admin-api"

function normalize(r: Record<string, unknown>) {
  return {
    userId:             r.user_id              ?? "",
    fullName:           r.full_name            ?? "—",
    email:              r.email                ?? "",
    phone:              r.phone                ?? null,
    username:           r.username             ?? null,
    createdAt:          r.created_at           ?? "",
    isVerified:         Boolean(r.is_verified),
    kycStatus:          r.kyc_status           ?? null,
    kycDocPan:          r.kyc_doc_pan          ?? null,
    kycDocAadhaarFront: r.kyc_doc_aadhaar_front ?? null,
    kycDocAadhaarBack:  r.kyc_doc_aadhaar_back  ?? null,
  }
}

/** GET /api/admin/dashboard-users — list registered dashboard users */
export async function GET(req: NextRequest) {
  const denied = await requireAdminApi(req)
  if (denied) return denied
  try {
    const { searchParams } = new URL(req.url)
    const allowedFields = new Set([
      "user_id", "full_name", "email", "phone", "username", "created_at",
      "is_verified", "kyc_status", "kyc_doc_pan", "kyc_doc_aadhaar_front",
      "kyc_doc_aadhaar_back",
    ])
    const requestedFields = (searchParams.get("fields") ?? "user_id,full_name,email,phone,username,created_at,is_verified,kyc_status,kyc_doc_pan,kyc_doc_aadhaar_front,kyc_doc_aadhaar_back")
      .split(",").map(field => field.trim()).filter(field => allowedFields.has(field))
    if (requestedFields.length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields requested" }, { status: 400 })
    }
    const rawLimit = Number(searchParams.get("limit") ?? 500)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 1000) : 500

    const rows = await query(
      `SELECT ${requestedFields.join(", ")} FROM dashboard_users ORDER BY created_at DESC LIMIT $1`,
      [limit],
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
