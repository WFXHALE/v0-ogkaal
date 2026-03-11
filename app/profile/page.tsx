import { Suspense } from "react"
import ProfileClient from "./profile-client"

export const dynamic = "force-dynamic"

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileClient />
    </Suspense>
  )
}
