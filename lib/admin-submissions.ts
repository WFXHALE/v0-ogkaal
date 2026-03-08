// Utility functions for admin submissions

export interface SubmissionData {
  type: "usdt_p2p" | "funded_account" | "mentorship" | "other"
  name: string
  email?: string
  telegram?: string
  phone?: string
  details: Record<string, unknown>
}

interface IpInfo {
  ip: string
  city?: string
  region?: string
  country?: string
}

async function getIpInfo(): Promise<IpInfo> {
  try {
    const response = await fetch("https://ipapi.co/json/")
    if (response.ok) {
      const data = await response.json()
      return {
        ip: data.ip || "Unknown",
        city: data.city,
        region: data.region,
        country: data.country_name
      }
    }
  } catch {
    // Fallback to another service
    try {
      const response = await fetch("https://api.ipify.org?format=json")
      if (response.ok) {
        const data = await response.json()
        return { ip: data.ip || "Unknown" }
      }
    } catch {
      // Silent fail
    }
  }
  return { ip: "Unknown" }
}

export async function saveSubmission(data: SubmissionData): Promise<void> {
  const ipInfo = await getIpInfo()
  
  const location = [ipInfo.city, ipInfo.region, ipInfo.country]
    .filter(Boolean)
    .join(", ") || "Unknown Location"

  const submission = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...data,
    status: "pending" as const,
    ipAddress: ipInfo.ip,
    location,
    createdAt: new Date().toISOString()
  }

  // Get existing submissions
  const existing = localStorage.getItem("og_admin_submissions")
  const submissions = existing ? JSON.parse(existing) : []
  
  // Add new submission at the beginning
  submissions.unshift(submission)
  
  // Save back to localStorage
  localStorage.setItem("og_admin_submissions", JSON.stringify(submissions))
}
