import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import type { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "og_dashboard_auth"
const SESSION_TTL_SECONDS = 60 * 60 * 12

type DashboardClaims = {
  sub: string
  email: string
  iat: number
  exp: number
}

function getSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("DASHBOARD_SESSION_SECRET must be configured with at least 32 characters.")
  }
  return secret
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url")
}

export function setDashboardSession(
  response: NextResponse,
  user: { userId: string; email: string },
): NextResponse {
  const now = Math.floor(Date.now() / 1000)
  const claims: DashboardClaims = {
    sub: user.userId,
    email: user.email,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  const token = `${payload}.${sign(payload)}`

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
  return response
}

export function clearDashboardSession(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  })
  return response
}

export function getDashboardSession(request: NextRequest): DashboardClaims | null {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) return null

    const [payload, suppliedSignature, extra] = token.split(".")
    if (!payload || !suppliedSignature || extra) return null

    const expected = Buffer.from(sign(payload))
    const supplied = Buffer.from(suppliedSignature)
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DashboardClaims
    const now = Math.floor(Date.now() / 1000)
    if (
      !claims ||
      typeof claims.sub !== "string" ||
      !claims.sub ||
      typeof claims.email !== "string" ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= now ||
      !Number.isFinite(claims.iat) ||
      claims.iat > now + 60
    ) return null

    return claims
  } catch {
    return null
  }
}
