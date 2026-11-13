import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSessionToken } from "@/lib/admin-session"

export async function requireAdminApi(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get("admin_session")?.value
  const valid = await verifyAdminSessionToken(token)
  if (valid) return null
  return NextResponse.json({ ok: false, error: "Unauthorized" }, {
    status: 401,
    headers: { "Cache-Control": "no-store" },
  })
}
