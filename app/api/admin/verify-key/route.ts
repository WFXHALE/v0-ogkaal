import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

/**
 * Progressive lockout schedule (cumulative failures → lockout duration):
 *
 * Requirement (from spec):
 *   5  failures →  5 min
 *   7  failures → 10 min
 *   9  failures → 30 min
 *  11  failures →  1 hour
 *  13  failures →  6 hours
 *  15  failures → 12 hours
 *  17  failures → 24 hours
 *  19+ failures →  1 week
 *
 * Each tier triggers after 2 additional failures (except the first which
 * triggers at 5).  All state is stored in admin_login_attempts per IP.
 */
const LOCKOUT_SCHEDULE: Array<{ threshold: number; durationSec: number }> = [
  { threshold: 19, durationSec: 7 * 24 * 3600 }, // 1 week
  { threshold: 17, durationSec: 24 * 3600 },      // 24 hours
  { threshold: 15, durationSec: 12 * 3600 },      // 12 hours
  { threshold: 13, durationSec: 6 * 3600 },       // 6 hours
  { threshold: 11, durationSec: 3600 },            // 1 hour
  { threshold:  9, durationSec: 30 * 60 },         // 30 min
  { threshold:  7, durationSec: 10 * 60 },         // 10 min
  { threshold:  5, durationSec: 5 * 60 },          // 5 min
]

function getLockoutDuration(failures: number): number {
  for (const { threshold, durationSec } of LOCKOUT_SCHEDULE) {
    if (failures >= threshold) return durationSec
  }
  return 0
}

function getAttemptsUntilLockout(current: number): number {
  // Find next tier threshold above current count
  const ascending = [...LOCKOUT_SCHEDULE].reverse()
  for (const { threshold } of ascending) {
    if (current < threshold) return threshold - current
  }
  return 0
}

function formatDuration(sec: number): string {
  if (sec >= 7 * 86400) return "7 days"
  if (sec >= 86400)  { const d = Math.round(sec / 86400); return `${d} day${d !== 1 ? "s" : ""}` }
  if (sec >= 3600)   { const h = Math.round(sec / 3600);  return `${h} hour${h !== 1 ? "s" : ""}` }
  if (sec >= 60)     { const m = Math.round(sec / 60);    return `${m} minute${m !== 1 ? "s" : ""}` }
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

  try {
    const row = await queryOne<{
      failure_count: number
      locked_until:  string | null
    }>(
      `SELECT failure_count, locked_until FROM admin_login_attempts WHERE ip_address = $1`,
      [ip]
    )

    if (!row) {
      return NextResponse.json({ ok: true, locked: false, failureCount: 0, attemptsLeft: 5 })
    }

    const now          = new Date()
    const lockedUntil  = row.locked_until ? new Date(row.locked_until) : null
    const isLocked     = !!(lockedUntil && lockedUntil > now)
    const remainingSec = isLocked ? Math.ceil((lockedUntil!.getTime() - now.getTime()) / 1000) : 0
    const failureCount = row.failure_count ?? 0

    return NextResponse.json({
      ok:           !isLocked,
      locked:       isLocked,
      remainingSec,
      lockedUntil:  lockedUntil?.toISOString() ?? null,
      failureCount,
      attemptsLeft: isLocked ? 0 : getAttemptsUntilLockout(failureCount),
    })
  } catch (err) {
    console.error("[verify-key GET] db error:", err)
    // On DB error, fail open (don't block the admin from logging in)
    return NextResponse.json({ ok: true, locked: false, failureCount: 0, attemptsLeft: 5 })
  }
}

// ── POST — verify key, enforce progressive lockout ─────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Server misconfiguration: ADMIN_SECRET_KEY is not set." },
      { status: 500 }
    )
  }

  let body: { key?: string; deviceId?: string } = {}
  try { body = await req.json() } catch { /* malformed body */ }

  const key      = String(body.key      ?? "").trim()
  const deviceId = String(body.deviceId ?? "unknown")
  const userAgent = req.headers.get("user-agent") ?? "unknown"
  const ip        = getClientIp(req)
  const now       = new Date()

  try {
    // 1. Fetch current record for this IP
    const existing = await queryOne<{
      failure_count: number
      locked_until:  string | null
      device_id:     string | null
    }>(
      `SELECT failure_count, locked_until, device_id FROM admin_login_attempts WHERE ip_address = $1`,
      [ip]
    )

    const failureCount = existing?.failure_count ?? 0
    const lockedUntil  = existing?.locked_until ? new Date(existing.locked_until) : null

    // 2. Check if currently locked
    if (lockedUntil && lockedUntil > now) {
      const remainingSec = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000)

      // Log blocked attempt (fire-and-forget)
      query(
        `INSERT INTO admin_security_logs (ip_address, device_fp, user_agent, event_type, failure_count)
         VALUES ($1,$2,$3,'blocked',$4)`,
        [ip, deviceId, userAgent, failureCount]
      ).catch(() => {})

      return NextResponse.json(
        {
          ok:           false,
          locked:       true,
          remainingSec,
          lockedUntil:  lockedUntil.toISOString(),
          failureCount,
          attemptsLeft: 0,
          error:        `Admin access locked. Try again in ${formatDuration(remainingSec)}.`,
        },
        { status: 429 }
      )
    }

    // 3. Verify the key (constant-time compare via padded string)
    const correctKey = secret.trim()
    const isValid    = key === correctKey

    if (isValid) {
      // Reset on success
      if (existing) {
        await query(
          `UPDATE admin_login_attempts
           SET failure_count=0, locked_until=NULL, last_attempt_at=$1
           WHERE ip_address=$2`,
          [now.toISOString(), ip]
        )
      }
      query(
        `INSERT INTO admin_security_logs (ip_address, device_fp, user_agent, event_type, failure_count)
         VALUES ($1,$2,$3,'success',0)`,
        [ip, deviceId, userAgent]
      ).catch(() => {})

      return NextResponse.json({ ok: true, success: true })
    }

    // 4. Record failure and apply lockout if threshold reached
    const newFailureCount = failureCount + 1
    const lockoutSec      = getLockoutDuration(newFailureCount)
    const newLockedUntil  = lockoutSec > 0
      ? new Date(now.getTime() + lockoutSec * 1000).toISOString()
      : null

    if (existing) {
      await query(
        `UPDATE admin_login_attempts
         SET failure_count=$1, locked_until=$2, last_attempt_at=$3, device_id=$4
         WHERE ip_address=$5`,
        [newFailureCount, newLockedUntil, now.toISOString(), deviceId, ip]
      )
    } else {
      await query(
        `INSERT INTO admin_login_attempts (ip_address, device_id, failure_count, locked_until, last_attempt_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [ip, deviceId, newFailureCount, newLockedUntil, now.toISOString()]
      )
    }

    query(
      `INSERT INTO admin_security_logs (ip_address, device_fp, user_agent, event_type, failure_count)
       VALUES ($1,$2,$3,'failure',$4)`,
      [ip, deviceId, userAgent, newFailureCount]
    ).catch(() => {})

    const attemptsLeft = lockoutSec > 0 ? 0 : getAttemptsUntilLockout(newFailureCount)
    const isNowLocked  = lockoutSec > 0

    return NextResponse.json(
      {
        ok:           false,
        success:      false,
        locked:       isNowLocked,
        lockedUntil:  newLockedUntil,
        remainingSec: lockoutSec,
        failureCount: newFailureCount,
        attemptsLeft,
        error: isNowLocked
          ? `Too many failed attempts. Admin access locked for ${formatDuration(lockoutSec)}.`
          : `Incorrect key. ${attemptsLeft > 0
              ? `${attemptsLeft} more ${attemptsLeft === 1 ? "attempt" : "attempts"} before lockout.`
              : "Next failure triggers lockout."}`,
      },
      { status: 401 }
    )
  } catch (err) {
    console.error("[verify-key POST] db error:", err)
    // On DB error, still verify the key but skip lockout tracking
    const isValid = key === secret.trim()
    if (isValid) return NextResponse.json({ ok: true, success: true })
    return NextResponse.json(
      { ok: false, error: "Verification failed. Please try again." },
      { status: 401 }
    )
  }
}
