import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { query } from "@/lib/db"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 })

    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
    const pathname = `avatars/${session.sub}.${ext}`
    const blob = await put(pathname, file, { access: "public", allowOverwrite: true })
    const rows = await query(
      "UPDATE dashboard_users SET avatar_url = $1 WHERE user_id = $2 RETURNING id",
      [blob.url, session.sub]
    )
    if (!rows.length) return NextResponse.json({ error: "User not found; image URL was not saved." }, { status: 404 })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("[dashboard avatar]", err)
    return NextResponse.json({ error: "Avatar upload failed." }, { status: 500 })
  }
}
