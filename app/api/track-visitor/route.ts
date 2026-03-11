import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { visitorId, sessionId, path, referrer } = await req.json() as {
      visitorId?: string
      sessionId?: string
      path?: string
      referrer?: string
    }

    // Extract geo from Vercel headers (populated automatically on Vercel deployments)
    const country   = req.headers.get("x-vercel-ip-country")   ?? null
    const city      = req.headers.get("x-vercel-ip-city")       ?? null
    const userAgent = req.headers.get("user-agent")             ?? null

    await supabase.from("site_visitors").insert({
      visitor_id: visitorId ?? null,
      session_id: sessionId ?? null,
      path:       path      ?? null,
      country,
      city,
      user_agent: userAgent,
      referrer:   referrer  ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Non-critical — silently fail so it never breaks the page
    console.error("[track-visitor] error:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
