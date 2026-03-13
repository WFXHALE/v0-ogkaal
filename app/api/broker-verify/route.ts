import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const broker    = String(formData.get("broker")   ?? "").trim()
    const traderId  = String(formData.get("traderId")  ?? "").trim()
    const userId    = String(formData.get("userId")    ?? "").trim()
    const username  = String(formData.get("username")  ?? "").trim()

    if (!broker || !traderId) {
      return NextResponse.json({ ok: false, error: "broker and traderId are required" }, { status: 400 })
    }

    let screenshotUrl: string | null = null
    const file = formData.get("screenshot")
    if (file && file instanceof File && file.size > 0) {
      const ext = file.name.split(".").pop() ?? "jpg"
      const blob = await put(`broker-verify/${userId || "anon"}-${Date.now()}.${ext}`, file, {
        access: "public",
      })
      screenshotUrl = blob.url
    }

    const rows = await query<{ id: string }>(
      `INSERT INTO broker_account_verifications (user_id, username, broker, trader_id, screenshot_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId || null, username || null, broker, traderId, screenshotUrl]
    )

    return NextResponse.json({ ok: true, id: rows[0]?.id })
  } catch (err) {
    console.error("[broker-verify POST]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
