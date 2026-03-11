"use client"

import { Analytics } from "./analytics"

// Report a non-fatal error to Firebase Analytics
export function reportError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  Analytics.error(context, message)
  if (process.env.NODE_ENV === "development") {
    console.error(`[error-monitor] ${context}:`, error)
  }
}

// Global unhandled error and promise rejection listeners
// Call once from the root layout / provider
export function initErrorMonitoring(): void {
  if (typeof window === "undefined") return

  window.addEventListener("error", (event) => {
    reportError("uncaught_error", event.error ?? event.message)
  })

  window.addEventListener("unhandledrejection", (event) => {
    reportError("unhandled_promise", event.reason)
  })
}
