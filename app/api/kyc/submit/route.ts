import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { put } from "@vercel/blob"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    // session.id is the uuid primary key; session.userId is the numeric/text user_id
    const dbUserId    = formData.get("userId")      as string   // dashboard_users.id (uuid)
    const userId      = formData.get("numericUid")  as string   // dashboard_users.user_id (text)
    const email       = formData.get("email")       as string
    const fullName    = formData.get("fullName")    as string
    const phone       = formData.get("phone")       as string
    const telegram    = formData.get("telegram")    as string
    const instagram   = formData.get("instagram")   as string
    const address     = formData.get("address")     as string
    const selfieFile  = formData.get("selfie")      as File | null
    const idFrontFile = formData.get("idFront")     as File | null
    const idBackFile  = formData.get("idBack")      as File | null

    if (!dbUserId || !fullName || !phone) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
    }

    // Upload documents to Blob (public access for admin viewing)
    const uploadFile = async (file: File | null, name: string) => {
      if (!file || file.size === 0) return null
      const blob = await put(`kyc/${dbUserId}/${name}-${Date.now()}`, file, { access: "public" })
      return blob.url
    }

    const [selfiePathname, aadhaarPathname, panPathname] = await Promise.all([
      uploadFile(selfieFile,  "selfie"),
      uploadFile(idFrontFile, "aadhaar"),
      uploadFile(idBackFile,  "pan"),
    ])

    // Upsert kyc_verifications row (keyed on db_user_id)
    const rows = await query(
      `INSERT INTO kyc_verifications
         (user_id, db_user_id, full_name, phone, email, telegram, instagram, address,
          selfie_pathname, aadhaar_pathname, pan_pathname, status, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',now())
       ON CONFLICT (db_user_id) DO UPDATE SET
         full_name        = EXCLUDED.full_name,
         phone            = EXCLUDED.phone,
         email            = EXCLUDED.email,
         telegram         = EXCLUDED.telegram,
         instagram        = EXCLUDED.instagram,
         address          = EXCLUDED.address,
         selfie_pathname  = COALESCE(EXCLUDED.selfie_pathname, kyc_verifications.selfie_pathname),
         aadhaar_pathname = COALESCE(EXCLUDED.aadhaar_pathname, kyc_verifications.aadhaar_pathname),
         pan_pathname     = COALESCE(EXCLUDED.pan_pathname, kyc_verifications.pan_pathname),
         status           = 'pending',
         submitted_at     = now()
       RETURNING *`,
      [userId ?? dbUserId, dbUserId, fullName, phone, email ?? null,
       telegram ?? null, instagram ?? null, address ?? null,
       selfiePathname, aadhaarPathname, panPathname]
    )

    // Update kyc_status in dashboard_users
    await query(
      `UPDATE dashboard_users SET kyc_status = 'pending', kyc_submitted_at = now() WHERE id = $1`,
      [dbUserId]
    )

    return NextResponse.json({ ok: true, data: rows[0] })
  } catch (err) {
    console.error("[kyc submit]", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
