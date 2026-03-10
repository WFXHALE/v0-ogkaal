"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This route is the hidden admin entry point accessed via the candlestick icon.
// It immediately redirects to the real admin login page.
export default function AdminLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/login")
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
