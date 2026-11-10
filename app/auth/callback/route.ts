import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { avatarUrl } from "@/lib/community-utils"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") || "/"
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/"
  const authError = searchParams.get("error_description")
  if (authError) return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(authError)}`, origin))
  if (!code) return NextResponse.redirect(new URL("/", origin))

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => { try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
    } }
  )
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    console.error("[auth/callback] code exchange failed:", error?.message)
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent("Sign-in could not be completed. Please try again.")}`, origin))
  }

  const user = data.user
  const metadata = user.user_metadata || {}
  const fullName = String(metadata.full_name || metadata.name || user.email?.split("@")[0] || "P2P Customer")
  const phone = String(metadata.phone || "")
  const level = ["Beginner","Trader","Pro Trader","Master Trader"].includes(metadata.level) ? metadata.level : "Beginner"
  const avatar = String(metadata.avatar_url || metadata.picture || avatarUrl(fullName, level as "Beginner" | "Trader" | "Pro Trader" | "Master Trader"))
  const { error: profileError } = await supabase.from("p2p_user_profiles").upsert({
    user_id: user.id, full_name: fullName, email: (user.email || "").toLowerCase(), phone, level, avatar, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })
  if (profileError) {
    console.error("[auth/callback] P2P profile upsert failed:", { code: profileError.code, message: profileError.message })
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent("Your sign-in succeeded, but your P2P profile could not be prepared. Please contact support.")}`, origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
