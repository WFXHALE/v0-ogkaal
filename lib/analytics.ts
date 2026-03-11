"use client"

import { getAnalytics, logEvent, setUserId, type Analytics } from "firebase/analytics"
import { app } from "./firebase"

let _analytics: Analytics | null = null

function getAnalyticsInstance(): Analytics | null {
  if (typeof window === "undefined") return null
  if (_analytics) return _analytics
  try {
    _analytics = getAnalytics(app)
    return _analytics
  } catch {
    return null
  }
}

// Identify a logged-in user
export function identifyUser(userId: string) {
  const a = getAnalyticsInstance()
  if (a) setUserId(a, userId)
}

// Generic event tracker
export function trackEvent(name: string, params?: Record<string, unknown>) {
  const a = getAnalyticsInstance()
  if (a) logEvent(a, name, params as Record<string, string | number | boolean> | undefined)
}

// --- Named events ---
export const Analytics = {
  // Auth
  signUp:  (method = "email") => trackEvent("sign_up",  { method }),
  login:   (method = "email") => trackEvent("login",    { method }),
  logout:  ()                 => trackEvent("logout"),

  // Page views (call from page components)
  pageView: (pageName: string) => trackEvent("page_view", { page_name: pageName }),

  // Feature usage
  kycStarted:      ()             => trackEvent("kyc_started"),
  kycSubmitted:    (step: string) => trackEvent("kyc_submitted",     { step }),
  avatarUploaded:  ()             => trackEvent("avatar_uploaded"),
  passwordReset:   ()             => trackEvent("password_reset"),
  otpRequested:    ()             => trackEvent("otp_requested"),
  notificationOpt: (granted: boolean) => trackEvent("notification_permission", { granted }),

  // Intelligence page
  intelligenceTab: (tab: string)    => trackEvent("intelligence_tab_viewed", { tab }),
  newsArticleRead: (source: string) => trackEvent("news_article_clicked",    { source }),

  // Error (non-fatal)
  error: (context: string, message: string) =>
    trackEvent("app_error", { context, message }),
}
