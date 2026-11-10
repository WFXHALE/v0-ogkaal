import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file     = formData.get("file") as File | null
  const userId   = formData.get("userId") as string | null

  if (!file)   return NextResponse.json({ error: "No file provided" },   { status: 400 })
  if (!userId) return NextResponse.json({ error: "Missing userId" },     { status: 400 })

  // Validate type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
  }

  // Validate size — 5 MB max
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 })
  }

  // Use a stable path so re-uploads overwrite the previous avatar
  const ext      = file.name.split(".").pop() ?? "jpg"
  const pathname = `avatars/${userId}.${ext}`

  const blob = await put(pathname, file, {
    access:       "public",
    allowOverwrite: true,
  })

  // Persist the URL to the database
  const rows = await query(
    "UPDATE dashboard_users SET avatar_url = $1 WHERE id = $2 RETURNING id",
    [blob.url, userId]
  )

  if (!rows.length) {
    return NextResponse.json({ error: "User not found; image URL was not saved." }, { status: 404 })
  }

  return NextResponse.json({ url: blob.url })
}
