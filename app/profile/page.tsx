import { Suspense } from "react"
import ProfileClient from "./profile-client"

// force-dynamic must be set on the page so Next.js doesn't attempt to
// statically prerender a page that depends on useSearchParams.
export const dynamic = "force-dynamic"

function ProfileFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileClient />
    </Suspense>
  )
}
