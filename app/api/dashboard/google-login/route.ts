import { NextRequest, NextResponse } from "next/server"
import { queryOne, query } from "@/lib/db"

export const runtime = "nodejs"

type FirebaseLookup = {
  users?: Array<{
    localId: string
    email: string
    displayName?: string
    photoUrl?: string
    emailVerified?: boolean
  }>
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json() as { idToken?: string }
    if (!idToken) return NextResponse.json({ error: "Missing Google identity token." }, { status: 400 })

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      console.error("[google-login] Firebase API key is not configured on the server.")
      return NextResponse.json({ error: "Google sign-in is not configured on the server." }, { status: 503 })
    }

    // Ask Firebase Authentication to validate the ID token before trusting its claims.
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      }
    )
    const verified = await verifyResponse.json() as FirebaseLookup
    const identity = verified.users?.[0]
    if (!verifyResponse.ok || !identity?.localId || !identity.email) {
      console.warn("[google-login] Firebase token verification failed:", verifyResponse.status)
      return NextResponse.json({ error: "Google identity verification failed. Please try again." }, { status: 401 })
    }

    const email = identity.email.trim().toLowerCase()
    const name = identity.displayName?.trim() || email.split("@")[0]
    let row = await queryOne<Record<string, unknown>>(
      "SELECT * FROM dashboard_users WHERE email = $1",
      [email]
    )
    let isNew = false

    if (!row) {
      isNew = true
      const base = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 20) || "member"
      const userId = `${base}_${identity.localId.slice(0, 6).toLowerCase()}`
      const numericUid = Math.floor(10000000 + Math.random() * 90000000)
      const inserted = await query<Record<string, unknown>>(
        `INSERT INTO dashboard_users
          (user_id, email, full_name, password_hash, numeric_uid, is_verified, kyc_status)
         VALUES ($1, $2, $3, '', $4, $5, 'none')
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING *`,
        [userId, email, name, numericUid, Boolean(identity.emailVerified)]
      )
      row = inserted[0] ?? null
    }

    if (!row) return NextResponse.json({ error: "Could not create or load your account." }, { status: 500 })

    // Refresh name/photo only when supplied by the verified identity.
    if (name && row.full_name !== name) {
      await query("UPDATE dashboard_users SET full_name = $1 WHERE id = $2", [name, row.id])
      row.full_name = name
    }

    return NextResponse.json({ ok: true, isNew, data: row })
  } catch (err) {
    console.error("[google-login] error:", err)
    return NextResponse.json({ error: "Google sign-in failed while preparing your account." }, { status: 500 })
  }
}
