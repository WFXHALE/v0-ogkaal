// Authentication temporarily disabled.
// Access is granted via 5 logo clicks → /kaal-admin-console → /admin
"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin")
  }, [router])
  return null
}
