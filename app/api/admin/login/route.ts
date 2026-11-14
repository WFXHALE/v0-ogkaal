import { NextResponse } from 'next/server'

// This legacy endpoint used hardcoded demo credentials and is not part of the
// current cookie-backed admin authentication flow. Keep it disabled.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'This legacy login endpoint is disabled. Use the admin console sign-in.' },
    { status: 410 },
  )
}
