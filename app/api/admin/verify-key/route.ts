import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const key: string = typeof body.key === "string" ? body.key : ""

  const correctKey = process.env.ADMIN_SECRET_KEY

  console.log("[verify-key] received key length:", key.length, "| env key set:", !!correctKey, "| env key length:", correctKey?.length ?? 0)

  if (!correctKey) {
    return NextResponse.json(
      { success: false, error: "ADMIN_SECRET_KEY is not set on the server." },
      { status: 500 },
    )
  }

  const inputClean   = key.trim().replace(/\s+/g, "")
  const correctClean = correctKey.trim().replace(/\s+/g, "")

  console.log("[verify-key] inputClean:", inputClean, "| correctClean:", correctClean, "| match:", inputClean === correctClean)

  if (!inputClean || inputClean !== correctClean) {
    return NextResponse.json({ success: false, error: "Invalid key" }, { status: 401 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
