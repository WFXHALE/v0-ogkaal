import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Progressive lockout schedule (cumulative failures → lockout duration):
 *   3 attempts  →   5 minutes
 *   5 attempts  →  15 minutes
 *   7 attempts  →   1 hour
 *  10 attempts  →   6 hours
 *  15 attempts  →  24 hours
 *  20+ attempts →   7 days
 */
const LOCKOUT_SCHEDULE: Array<{ threshold: number; durationSec: number }> = [
  { threshold: 20, durationSec: 7 * 24 * 3600 },
  { threshold: 15, durationSec: 24 * 3600 },
  { threshold: 10, durationSec: 6 * 3600 },
  { threshold:  7, durationSec: 3600 },
  { threshold:  5, durationSec: 15 * 60 },
  { threshold:  3, durationSec: 5 * 60 },
]

function getLockoutDuration(failures: number): number {
  for (const { threshold, durationSec } of LOCKOUT_SCHEDULE) {
    if (failures >= threshold) return durationSec
  }
  return 0
}

function getAttemptsUntilNextLockout(current: number): number {
  // Walk thresholds ascending to find the next tier
  const ascending = [...LOCKOUT_SCHEDULE].reverse()
  for (const { threshold } of ascending) {
    if (current < threshold) return threshold - current
  }
  return 0
}

function formatDuration(sec: number): string {
  if (sec >= 86400) { const d = Math.round(sec / 86400); return `${d} day${d !== 1 ? "s" : ""}` }
  if (sec >= 3600)  { const h = Math.round(sec / 3600);  return `${h} hour${h !== 1 ? "s" : ""}` }
  if (sec >= 60)    { const m = Math.round(sec / 60);    return `${m} minute${m !== 1 ? "s" : ""}` }
  return `${sec} second${sec !== 1 ? "s" : ""}`
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

// ── GET — check lockout status for current IP (called on page load) ────────

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const sb = createServiceClient()

  const { data } = await sb
    .from("admin_login_attempts")
    .select("failure_count, locked_until")
    .eq("ip_address", ip)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ ok: true, locked: false, failureCount: 0, attemptsLeft: 3 })
  }

  const now         = new Date()
  const lockedUntil = data.locked_until ? new Date(data.locked_until) : null
  const isLocked    = !!(lockedUntil && lockedUntil > now)
  const remainingSec = isLocked ? Math.ceil((lockedUntil!.getTime() - now.getTime()) / 1000) : 0
  const failureCount = data.failure_count ?? 0

  return NextResponse.json({
    ok:           !isLocked,
    locked:       isLocked,
    remainingSec,
    lockedUntil:  lockedUntil?.toISOString() ?? null,
    failureCount,
    attemptsLeft: isLocked ? 0 : getAttemptsUntilNextLockout(failureCount),
  })
}

// ── POST — verify key, enforce lockout ────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Server misconfiguration: ADMIN_SECRET_KEY is not set." },
      { status: 500 }
    )
  }

  let body: { key?: string; deviceId?: string } = {}
  try { body = await req.json() } catch { /* malformed JSON */ }

  const key      = String(body.key      ?? "").trim().replace(/\s+/g, "")
  const deviceId = String(body.deviceId ?? "unknown")
  const userAgent = req.headers.get("user-agent") ?? "unknown"
  const ip       = getClientIp(req)

  const sb  = createServiceClient()
  const now = new Date()

  // 1. Fetch current attempt record for this IP
  const { data: existing } = await sb
    .from("admin_login_attempts")
    .select("*")
    .eq("ip_address", ip)
    .maybeSingle()

  const failureCount = existing?.failure_count ?? 0
  const lockedUntil  = existing?.locked_until ? new Date(existing.locked_until) : null

  // 2. Check if currently locked
  if (lockedUntil && lockedUntil > now) {
    const remainingSec = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000)

    // Log blocked attempt
    await sb.from("admin_security_logs").insert({
      ip_address: ip, device_id: deviceId, user_agent: userAgent,
      event_type: "blocked", failure_count: failureCount,
    })

    return NextResponse.json(
      {
        ok:           false,
        locked:       true,
        remainingSec,
        lockedUntil:  lockedUntil.toISOString(),
        failureCount,
        attemptsLeft: 0,
        error:        `Too many failed attempts. Try again in ${formatDuration(remainingSec)}.`,
      },
      { status: 429 }
    )
  }

  // 3. Verify the key
  const correctKey = secret.trim().replace(/\s+/g, "")
  const isValid    = key === correctKey

  if (isValid) {
    // Reset failures on success
    if (existing) {
      await sb
        .from("admin_login_attempts")
        .update({ failure_count: 0, locked_until: null, last_attempt_at: now.toISOString() })
        .eq("ip_address", ip)
    }
    await sb.from("admin_security_logs").insert({
      ip_address: ip, device_id: deviceId, user_agent: userAgent,
      event_type: "success", failure_count: 0,
    })
    return NextResponse.json({ ok: true, success: true })
  }

  // 4. Record failure and apply lockout if threshold reached
  const newFailureCount = failureCount + 1
  const lockoutSec      = getLockoutDuration(newFailureCount)
  const newLockedUntil  = lockoutSec > 0
    ? new Date(now.getTime() + lockoutSec * 1000).toISOString()
    : null

  if (existing) {
    await sb
      .from("admin_login_attempts")
      .update({
        failure_count:   newFailureCount,
        locked_until:    newLockedUntil,
        last_attempt_at: now.toISOString(),
        device_id:       deviceId,
      })
      .eq("ip_address", ip)
  } else {
    await sb.from("admin_login_attempts").insert({
      ip_address:      ip,
      device_id:       deviceId,
      failure_count:   newFailureCount,
      locked_until:    newLockedUntil,
      last_attempt_at: now.toISOString(),
    })
  }

  await sb.from("admin_security_logs").insert({
    ip_address: ip, device_id: deviceId, user_agent: userAgent,
    event_type: "failure", failure_count: newFailureCount,
  })

  const attemptsLeft = lockoutSec > 0 ? 0 : getAttemptsUntilNextLockout(newFailureCount)

  return NextResponse.json(
    {
      ok:           false,
      success:      false,
      locked:       lockoutSec > 0,
      lockedUntil:  newLockedUntil,
      remainingSec: lockoutSec,
      failureCount: newFailureCount,
      attemptsLeft,
      error: lockoutSec > 0
        ? `Too many failed attempts. Locked for ${formatDuration(lockoutSec)}.`
        : `Incorrect key. ${attemptsLeft > 0 ? `${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before lockout.` : ""}`,
    },
    { status: 401 }
  )
}
