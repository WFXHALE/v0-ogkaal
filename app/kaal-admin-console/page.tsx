"use client"

// Hidden admin entry point — triggered by 5 logo clicks.
// Renders AdminPanel directly — no redirect, no blank flash.
import AdminPanel from "@/app/admin/admin-panel"

export default function KaalAdminConsole() {
  return <AdminPanel />
}
