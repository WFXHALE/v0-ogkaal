import { NextResponse } from 'next/server'
import {
  getAdminCredentials,
  generateOTP,
  storeOTP,
  verifyOTP,
  isAdminEmail,
  updatePassword,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp, newPassword, step } = body

    const admin = getAdminCredentials()

    // Check if admin credentials are configured
    if (!admin.email) {
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 500 }
      )
    }

    // Step 1: Request OTP
    if (step === 'request-otp') {
      if (!isAdminEmail(email)) {
        return NextResponse.json(
          { error: 'Email not recognized' },
          { status: 401 }
        )
      }

      const newOTP = generateOTP()
      storeOTP(`reset_${email}`, newOTP)

      // In development, return OTP in response for easy testing
      const isDev = process.env.NODE_ENV !== 'production'
      return NextResponse.json({
        success: true,
        message: isDev ? `Development OTP: ${newOTP}` : 'OTP sent',
        ...(isDev && { devOTP: newOTP }),
      })
    }

    // Step 2: Verify OTP
    if (step === 'verify-otp') {
      if (!verifyOTP(`reset_${email}`, otp)) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 401 }
        )
      }

      // Generate a temporary token to allow password reset
      const resetToken = generateOTP()
      storeOTP(`resettoken_${email}`, resetToken)

      return NextResponse.json({
        success: true,
        message: 'OTP verified',
        resetToken,
      })
    }

    // Step 3: Reset password
    if (step === 'reset-password') {
      const { resetToken } = body

      if (!verifyOTP(`resettoken_${email}`, resetToken)) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 401 }
        )
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      // Update password in memory
      updatePassword(newPassword)

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully (note: changes will reset on server restart in development)',
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
