"use client"

import { Suspense } from "react"
import ProfileClient from "./profile-client"

function ProfileFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

// This wrapper is a client component so that the Suspense boundary
// is guaranteed to exist in the client tree before useSearchParams fires.
export default function ProfileWrapper() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileClient />
    </Suspense>
  )
}
