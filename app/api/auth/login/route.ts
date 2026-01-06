import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { mobileNumber, password, pin, method } = await req.json()

    if (!mobileNumber) {
      return Response.json({ success: false, error: "Mobile number is required" }, { status: 400 })
    }

    const cleanMobile = mobileNumber.replace(/\s/g, "")

    const supabase = await createClient()

    // Find user by mobile number
    const { data: user, error: fetchError } = await supabase
      .from("residents")
      .select("*")
      .eq("mobile_number", cleanMobile)
      .single()

    if (fetchError || !user) {
      return Response.json(
        { success: false, error: "Mobile number not found. Please register first." },
        { status: 404 },
      )
    }

    // Check if account is locked
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / 60000)
      return Response.json(
        { success: false, error: `Account is locked. Please try again in ${minutesLeft} minutes.` },
        { status: 423 },
      )
    }

    // Verify credentials with bcrypt
    let isValid = false
    if (method === "pin") {
      if (!pin || !/^\d{4}$/.test(pin)) {
        return Response.json({ success: false, error: "Invalid PIN format" }, { status: 400 })
      }
      isValid = await bcrypt.compare(pin, user.pin_hash)
    } else {
      if (!password) {
        return Response.json({ success: false, error: "Password is required" }, { status: 400 })
      }
      isValid = await bcrypt.compare(password, user.password_hash)
    }

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1
      const updates: any = { failed_login_attempts: newAttempts }

      // Lock account after 5 failed attempts for 15 minutes
      if (newAttempts >= 5) {
        updates.lockout_until = new Date(Date.now() + 15 * 60 * 1000).toISOString()
        updates.failed_login_attempts = 0
      }

      await supabase.from("residents").update(updates).eq("id", user.id)

      if (newAttempts >= 5) {
        return Response.json(
          { success: false, error: "Too many failed attempts. Account locked for 15 minutes." },
          { status: 423 },
        )
      }

      return Response.json(
        {
          success: false,
          error: `Invalid ${method === "pin" ? "PIN" : "password"}. ${5 - newAttempts} attempts remaining.`,
        },
        { status: 401 },
      )
    }

    // Reset failed attempts on successful login
    await supabase
      .from("residents")
      .update({ failed_login_attempts: 0, lockout_until: null, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    return Response.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        mobileNumber: user.mobile_number,
        email: user.email,
        address: user.address,
        qrCode: user.qr_code,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return Response.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
