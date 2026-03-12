"use client"

import { useState, useEffect } from "react"
import { AuthModal } from "@/components/auth-modal"
import { getSession } from "@/lib/community-utils"
import type { CommunityUser } from "@/lib/community-utils"
import { setSession } from "@/lib/community-utils"

const FIRST_VISIT_KEY = "og_first_visit_done"

export function FirstVisitPopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only run on the client after mount
    const alreadyDone = localStorage.getItem(FIRST_VISIT_KEY)
    const hasSession  = getSession()

    // Show the popup if the user hasn't seen it and isn't already signed in
    if (!alreadyDone && !hasSession) {
      // Small delay so it doesn't flash on every fast navigation
      const t = setTimeout(() => setShow(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  function handleAuth(user: CommunityUser) {
    setSession(user)
    localStorage.setItem(FIRST_VISIT_KEY, "done")
    setShow(false)
  }

  function handleClose() {
    // "Skip" — mark as seen so we don't pester them again
    localStorage.setItem(FIRST_VISIT_KEY, "skipped")
    setShow(false)
  }

  if (!show) return null

  return (
    <AuthModal
      onClose={handleClose}
      onAuth={handleAuth}
      subtitle="Create a free account to join the trading community, post ideas, and interact with other traders."
    />
  )
}
