import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { key } = await request.json()

  const correctKey = process.env.ADMIN_SECRET_KEY

  if (!correctKey) {
    return NextResponse.json(
      { success: false, error: "Admin secret key is not configured on the server." },
      { status: 500 },
    )
  }

  if (!key || typeof key !== "string" || key.trim() !== correctKey.trim()) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
