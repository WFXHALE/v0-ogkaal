import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { key } = await request.json()

  const correctKey = process.env.ADMIN_SECRET_KEY

  if (!correctKey) {
    // Log all env var keys to help diagnose missing variable in production
    console.error("[v0] ADMIN_SECRET_KEY is not set. Available env keys:", Object.keys(process.env).filter(k => k.startsWith("ADMIN") || k.startsWith("NEXT")))
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
