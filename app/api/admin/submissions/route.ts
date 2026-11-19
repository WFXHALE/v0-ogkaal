import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { requireAdminApi } from "@/lib/require-admin-api"
import { getDashboardSession } from "@/lib/dashboard-session"
import { createClient } from "@/lib/supabase/server"

function normalize(r: Record<string, unknown>) {
  return {
    id:                 r.id,
    userId:             r.user_id        ?? "",
    type:               r.type           ?? "other",
    name:               r.name           ?? "",
    email:              r.email          ?? "",
    phone:              r.phone          ?? "",
    telegram:           r.telegram       ?? "",
    paymentMethod:      r.payment_method ?? "",
    amount:             r.amount         ?? "",
    utr:                r.utr            ?? "",
    screenshotUrl:      r.screenshot_url ?? "",
    ipAddress:          r.ip_address     ?? "",
    location:           r.location       ?? "",
    walletAddress:      r.wallet_address ?? "",
    upiId:              r.upi_id         ?? "",
    inrEquivalent:      r.inr_equivalent ?? "",
    amountPaid:         r.amount_paid    ?? "",
    details:            r.details        ?? {},
    status:             r.status         ?? "pending",
    notificationStatus: r.notification_status ?? "READ",
    createdAt:          r.created_at,
  }
}

async function getAuthenticatedSubmissionUserId(req: NextRequest): Promise<string | null> {
  const dashboardSession = getDashboardSession(req)
  if (dashboardSession?.sub) return dashboardSession.sub

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile, error: profileError } = await supabase
      .from("p2p_user_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profileError || !profile?.user_id) return null
    return String(profile.user_id)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const allowedTypes = new Set(["usdt_p2p", "funded_account", "mentorship", "vip_membership", "support", "other"])
    const type = String(b.type ?? "")
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ ok: false, error: "Unsupported submission type." }, { status: 400 })
    }

    const name = String(b.name ?? "").trim()
    if (!name || name.length > 150) {
      return NextResponse.json({ ok: false, error: "A valid name is required." }, { status: 400 })
    }

    const email = String(b.email ?? "").trim().toLowerCase()
    if (email.length > 254) {
      return NextResponse.json({ ok: false, error: "Email address is too long." }, { status: 400 })
    }

    const rawDetails = b.details && typeof b.details === "object" && !Array.isArray(b.details)
      ? b.details as Record<string, unknown>
      : {}
    const userId = await getAuthenticatedSubmissionUserId(req)
    const details = { ...rawDetails, userId }

    const submittedUtr = String(b.utr ?? "").trim()
    if (submittedUtr) {
      const existing = await queryOne(
        `SELECT id FROM admin_submissions WHERE LOWER(TRIM(utr)) = LOWER(TRIM($1))
         UNION ALL SELECT id FROM usdt_buy_requests WHERE LOWER(TRIM(transaction_id)) = LOWER(TRIM($1))
         UNION ALL SELECT id FROM usdt_sell_requests WHERE LOWER(TRIM(transaction_id)) = LOWER(TRIM($1))
         LIMIT 1`,
        [submittedUtr],
      )
      if (existing) {
        return NextResponse.json(
          { ok: false, duplicateUtr: true, error: "This payment reference has already been submitted." },
          { status: 409 },
        )
      }
    }

    const ipAddress = req.headers.get("x-real-ip")
      ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "Unknown"
    const location = String(b.location ?? "").trim().slice(0, 200)
    const rows = await query<Record<string, unknown>>(
      `INSERT INTO admin_submissions
        (type, name, email, phone, telegram, details, status,
         ip_address, location, wallet_address, upi_id,
         inr_equivalent, amount_paid, screenshot_url,
         payment_method, amount, utr, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        type,
        name,
        email || null,
        b.phone ? String(b.phone).slice(0, 40) : null,
        b.telegram ? String(b.telegram).slice(0, 100) : null,
        JSON.stringify(details),
        ipAddress,
        location,
        b.wallet_address ?? null,
        b.upi_id ?? null,
        b.inr_equivalent ?? null,
        b.amount_paid ?? null,
        b.screenshot_url ?? null,
        b.payment_method ?? b.paymentMethod ?? null,
        b.amount ?? null,
        submittedUtr || null,
        userId,
      ],
    )

    const action = String(details.action ?? "buy").toLowerCase()
    const notificationType = type === "usdt_p2p"
      ? (action === "sell" ? "usdt_sell" : "usdt_buy")
      : type
    const label = type === "usdt_p2p" ? "USDT P2P"
      : type === "vip_membership" ? "VIP Group"
      : type === "funded_account" ? "Funded Account"
      : type === "mentorship" ? "Mentorship"
      : type === "support" ? "Support"
      : "Submission"

    try {
      await query(
        `INSERT INTO admin_notifications (type, title, message, is_read, ref_id)
         VALUES ($1, $2, $3, false, $4)`,
        [notificationType, `New ${label} Request`, `${name} submitted a new ${label} request.`, rows[0]?.id ?? null],
      )
    } catch (notificationError) {
      console.error("[submissions POST] admin notification insert failed:", notificationError)
    }

    return NextResponse.json({ ok: true, duplicateUtr: false, id: rows[0]?.id ?? null, status: "pending" })
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === "23505") {
      return NextResponse.json(
        { ok: false, duplicateUtr: true, error: "This payment reference has already been submitted." },
        { status: 409 },
      )
    }
    console.error("[submissions POST] error:", err)
    return NextResponse.json({ ok: false, error: "Could not save your submission." }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const denied = await requireAdminApi(req)
  if (denied) return denied
  try {
    const rows = await query(
      "SELECT * FROM admin_submissions ORDER BY created_at DESC LIMIT 500",
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    console.error("[submissions GET] error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdminApi(req)
  if (denied) return denied
  try {
    const { id, status, notification_status } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })

    const sets: string[] = []
    const params: unknown[] = []

    if (status) {
      const valid = ["pending", "approved", "rejected", "completed", "dismissed", "deleted"]
      if (!valid.includes(status)) {
        return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
      }
      params.push(status); sets.push(`status = $${params.length}`)
    }
    if (notification_status) {
      params.push(notification_status); sets.push(`notification_status = $${params.length}`)
    }
    if (!sets.length) {
      return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 })
    }

    params.push(id)
    await query(
      `UPDATE admin_submissions SET ${sets.join(", ")} WHERE id = $${params.length}`,
      params,
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdminApi(req)
  if (denied) return denied
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM admin_submissions WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// Suppress unused import warning
void queryOne
