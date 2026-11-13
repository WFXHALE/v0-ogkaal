import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { put } from "@vercel/blob"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    const formData = await req.formData()
    const fullName = formData.get("fullName") as string
    const phone = formData.get("phone") as string
    const telegram = formData.get("telegram") as string
    const instagram = formData.get("instagram") as string
    const address = formData.get("address") as string
    const selfieFile = formData.get("selfie") as File | null
    const idFrontFile = formData.get("idFront") as File | null
    const idBackFile = formData.get("idBack") as File | null

    if (!fullName?.trim() || !phone?.trim()) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
    }

    const account = await queryOne<{ id: string; numeric_uid: string | number | null; email: string }>(
      "SELECT id, numeric_uid, email FROM dashboard_users WHERE user_id = $1",
      [session.sub]
    )
    if (!account) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 })

    const dbUserId = account.id
    const uploadFile = async (file: File | null, name: string) => {
      if (!file || file.size === 0) return null
      if (file.size > 10 * 1024 * 1024) throw new Error("Each KYC document must be under 10 MB.")
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        throw new Error("KYC documents must be images or PDF files.")
      }
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"
      const blob = await put(`kyc/${dbUserId}/${name}-${Date.now()}.${ext}`, file, { access: "public" })
      return blob.url
    }

    const [selfiePathname, aadhaarPathname, panPathname] = await Promise.all([
      uploadFile(selfieFile, "selfie"),
      uploadFile(idFrontFile, "aadhaar"),
      uploadFile(idBackFile, "pan"),
    ])

    const rows = await query(
      `INSERT INTO kyc_verifications
         (user_id, db_user_id, full_name, phone, email, telegram, instagram, address,
          selfie_pathname, aadhaar_pathname, pan_pathname, status, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',now())
       ON CONFLICT (db_user_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         telegram = EXCLUDED.telegram,
         instagram = EXCLUDED.instagram,
         address = EXCLUDED.address,
         selfie_pathname = COALESCE(EXCLUDED.selfie_pathname, kyc_verifications.selfie_pathname),
         aadhaar_pathname = COALESCE(EXCLUDED.aadhaar_pathname, kyc_verifications.aadhaar_pathname),
         pan_pathname = COALESCE(EXCLUDED.pan_pathname, kyc_verifications.pan_pathname),
         status = 'pending',
         submitted_at = now()
       RETURNING id, status, submitted_at`,
      [String(account.numeric_uid ?? session.sub), dbUserId, fullName.trim(), phone.trim(), account.email,
       telegram?.trim() || null, instagram?.trim() || null, address?.trim() || null,
       selfiePathname, aadhaarPathname, panPathname]
    )

    await query("UPDATE dashboard_users SET kyc_status = 'pending', kyc_submitted_at = now() WHERE id = $1", [dbUserId])
    return NextResponse.json({ ok: true, data: rows[0] })
  } catch (err) {
    console.error("[kyc submit]", err)
    const message = err instanceof Error && err.message.includes("under") || err instanceof Error && err.message.includes("must be images")
      ? err.message
      : "Server error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
