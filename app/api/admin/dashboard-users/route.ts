import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

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
  try {
    const { searchParams } = new URL(req.url)
    const fields = searchParams.get("fields") ?? "user_id,full_name,email,phone,username,created_at,is_verified,kyc_status,kyc_doc_pan,kyc_doc_aadhaar_front,kyc_doc_aadhaar_back"
    const limit  = Math.min(Number(searchParams.get("limit") ?? 500), 1000)

    const rows = await query(
      `SELECT ${fields} FROM dashboard_users ORDER BY created_at DESC LIMIT $1`,
      [limit],
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
