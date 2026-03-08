import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getAdminCredentials,
  generateOTP,
  storeOTP,
  verifyOTP,
  isAdminPhone,
  generateSessionToken,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { identifier, password, otp, step, loginType } = body

    const admin = getAdminCredentials()

    // Check if admin credentials are configured
    if (!admin.email || !admin.password) {
      return NextResponse.json(
        { error: 'Admin credentials not configured. Please set environment variables.' },
        { status: 500 }
      )
    }

    // Step 1: Phone + OTP login (no password)
    if (loginType === 'phone') {
      if (step === 'request-otp') {
        // Verify phone number matches admin
        if (!isAdminPhone(identifier)) {
          return NextResponse.json(
            { error: 'Phone number not recognized' },
            { status: 401 }
          )
        }

        // Generate and store OTP
        const newOTP = generateOTP()
        storeOTP(identifier, newOTP)

        return NextResponse.json({
          success: true,
          message: 'OTP sent (check server console in development)',
          requiresOTP: true,
        })
      }

      if (step === 'verify-otp') {
        if (!verifyOTP(identifier, otp)) {
          return NextResponse.json(
            { error: 'Invalid or expired OTP' },
            { status: 401 }
          )
        }

        // Create session
        const token = generateSessionToken()
        const cookieStore = await cookies()
        cookieStore.set('admin_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        })

        return NextResponse.json({
          success: true,
          message: 'Login successful',
        })
      }
    }

    // Step 2: Email/Username + Password login
    if (step === 'password') {
      // Validate identifier (email or username)
      const isValidEmail = identifier === admin.email
      const isValidUsername = identifier === admin.username

      if (!isValidEmail && !isValidUsername) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      if (password !== admin.password) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Generate OTP for 2FA
      const newOTP = generateOTP()
      storeOTP(identifier, newOTP)

      return NextResponse.json({
        success: true,
        message: 'Password verified. OTP sent (check server console in development)',
        requiresOTP: true,
      })
    }

    // Step 3: Verify OTP (2FA after password)
    if (step === 'verify-otp') {
      if (!verifyOTP(identifier, otp)) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 401 }
        )
      }

      // Create session cookie
      const token = generateSessionToken()
      const cookieStore = await cookies()
      cookieStore.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })

      return NextResponse.json({
        success: true,
        message: 'Login successful',
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
