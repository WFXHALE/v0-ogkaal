import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Get IP address for location tracking
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : "Unknown"

    // Create submission object
    const submission = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "contact" as const,
      name,
      email,
      details: { message },
      status: "pending" as const,
      ipAddress: ip,
      location: "Unknown",
      createdAt: new Date().toISOString(),
    }

    // Store submission - in a real app, this would go to a database
    // For now, we'll return success and the admin dashboard reads from localStorage
    // The submission will be added via client-side for demo purposes
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Your message has been received. We will get back to you soon.",
        submission 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    )
  }
}
