import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    const { token } = await req.json() as { token?: string }
    const cleanToken = token?.trim()
    if (!cleanToken || cleanToken.length > 4096) {
      return NextResponse.json({ error: "A valid push token is required." }, { status: 400 })
    }

    await query(
      `INSERT INTO fcm_tokens (user_id, token, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id, token)
       DO UPDATE SET updated_at = now()`,
      [session.sub, cleanToken]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push-token POST]", err)
    return NextResponse.json({ error: "Could not register push notifications." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    await query("DELETE FROM fcm_tokens WHERE user_id = $1", [session.sub])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push-token DELETE]", err)
    return NextResponse.json({ error: "Could not remove push notifications." }, { status: 500 })
  }
}
