import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Supabase OAuth callback handler.
 * After Google sign-in, Supabase redirects here with a `code` query param.
 * We exchange it for a session, then upsert the user into `community_users`,
 * and finally redirect the user to the community page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get("code")
  const next     = searchParams.get("next") ?? "/community"
  const errorMsg = searchParams.get("error_description")

  if (errorMsg) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorMsg)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/community`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Middleware will handle session refresh if needed
          }
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    console.error("[auth/callback] exchange error:", error)
    return NextResponse.redirect(`${origin}/community`)
  }

  // Upsert the Google user into community_users so they show up in the community
  const gUser   = session.user
  const email   = gUser.email?.toLowerCase() ?? ""
  const fullName = gUser.user_metadata?.full_name
    || gUser.user_metadata?.name
    || email.split("@")[0]
  const photoUrl = gUser.user_metadata?.avatar_url || gUser.user_metadata?.picture || ""

  if (email) {
    const { data: existing } = await supabase
      .from("community_users")
      .select("id")
      .eq("email", email)
      .limit(1)

    if (!existing || existing.length === 0) {
      const id     = Date.now().toString() + Math.random().toString(36).slice(2, 7)
      const avatar = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=FCD535&color=000&bold=true&size=128`
      await supabase.from("community_users").insert({
        id,
        full_name:  fullName,
        email,
        phone:      "",
        level:      "Beginner",
        avatar,
        is_admin:   false,
        created_at: new Date().toISOString(),
        bio:        `__google:${gUser.id}`,
      })
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocalEnv    = process.env.NODE_ENV === "development"

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
