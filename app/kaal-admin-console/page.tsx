// Hidden admin entry point — triggered by 5 logo clicks.
// No authentication required. Redirects straight to the admin dashboard.
"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function KaalAdminConsole() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin")
  }, [router])
  return null
}
