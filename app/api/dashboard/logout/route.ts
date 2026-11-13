import { NextResponse } from "next/server"
import { clearDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function POST() {
  return clearDashboardSession(NextResponse.json({ ok: true }))
}
