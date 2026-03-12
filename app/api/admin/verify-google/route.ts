import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error("[admin] ADMIN_EMAIL env var is not set.")
    return NextResponse.json(
      { success: false, error: "Admin email is not configured on the server." },
      { status: 500 },
    )
  }

  if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
