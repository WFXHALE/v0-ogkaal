"use client"

import { Settings } from "lucide-react"

export function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
        <Settings className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">Under Maintenance</h1>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
        We are currently performing scheduled maintenance. Please check back shortly. Thank you for your patience.
      </p>
      <p className="mt-8 text-xs text-muted-foreground font-semibold tracking-widest uppercase">OG KAAL TRADER</p>
    </div>
  )
}
