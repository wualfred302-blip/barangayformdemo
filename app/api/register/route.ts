import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

// ID format validation patterns per ID type
const ID_FORMATS: Record<string, RegExp> = {
  philippine_national_id: /^\d{4}-\d{4}-\d{4}-\d{4}$/, // 1234-5678-9012-3456
  drivers_license: /^[A-Z]\d{2}-\d{2}-\d{6}$/, // N01-12-123456
  umid: /^\d{4}-\d{7}-\d$/, // 1234-1234567-1
  sss_id: /^\d{2}-\d{7}-\d$/, // 12-1234567-1
  philhealth_id: /^\d{2}-\d{9}-\d$/, // 12-123456789-1
  postal_id: /^[A-Z0-9]{6,15}$/, // Flexible alphanumeric
  voters_id: /^[A-Z0-9]{6,20}$/, // Flexible per region
  passport: /^[A-Z]{1,2}\d{7,8}[A-Z]?$/, // P1234567A
  prc_id: /^\d{7}$/, // 1234567
  barangay_id: /^.{3,30}$/, // Flexible - varies by barangay
  senior_citizen_id: /^.{3,30}$/, // Flexible
  pwd_id: /^.{3,30}$/, // Flexible
  other: /^.{3,30}$/, // Fallback
}

function validateIDFormat(idType: string, idNumber: string): { valid: boolean; error?: string } {
  const pattern = ID_FORMATS[idType] || ID_FORMATS["other"]
  const cleanedNumber = idNumber.replace(/\s/g, "").toUpperCase()

  if (!pattern.test(cleanedNumber)) {
    return {
      valid: false,
      error: `Invalid ID number format. Please check your ID number.`,
    }
  }
  return { valid: true }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      fullName,
      mobileNumber,
      email,
      address,
      houseLotNo,
      street,
      purok,
      barangay,
      cityMunicipality,
      province,
      zipCode,
      birthDate,
      idType,
      idNumber,
      password,
      pin,
      idImageBase64,
    } = body

    if (!fullName || !mobileNumber || !barangay || !cityMunicipality || !idType || !idNumber || !password || !pin) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate privacy policy acceptance
    const privacyPolicyAccepted = body.agreedToTerms === true
    if (!privacyPolicyAccepted) {
      return Response.json(
        {
          success: false,
          error: "privacy_not_accepted",
          message: "You must accept the Privacy Policy to register"
        },
        { status: 400 }
      )
    }

    // Validate ID format
    const idValidation = validateIDFormat(idType, idNumber)
    if (!idValidation.valid) {
      return Response.json({ success: false, error: idValidation.error }, { status: 400 })
    }

    // Validate password (min 8 chars, 1 number)
    if (password.length < 8 || !/\d/.test(password)) {
      return Response.json(
        {
          success: false,
          error: "Password must be at least 8 characters with at least 1 number",
        },
        { status: 400 },
      )
    }

    // Validate PIN (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return Response.json({ success: false, error: "PIN must be exactly 4 digits" }, { status: 400 })
    }

    // Clean mobile number
    const cleanMobile = mobileNumber.replace(/\s/g, "")

    const supabase = await createClient()

    // Check #1: Duplicate mobile number
    const { data: existingMobile } = await supabase
      .from("residents")
      .select("id")
      .eq("mobile_number", cleanMobile)
      .single()

    if (existingMobile) {
      return Response.json(
        {
          success: false,
          error: "duplicate_mobile",
          message: "This mobile number is already registered. Please login instead.",
        },
        { status: 409 },
      )
    }

    // Check #2: Duplicate ID number
    const { data: existingID } = await supabase
      .from("residents")
      .select("id")
      .eq("id_number", idNumber.replace(/\s/g, "").toUpperCase())
      .single()

    if (existingID) {
      return Response.json(
        {
          success: false,
          error: "duplicate_id",
          message: "An account with this ID already exists. Try logging in or reset your password.",
        },
        { status: 409 },
      )
    }

    // Hash password and PIN with bcrypt
    const passwordHash = await bcrypt.hash(password, 10)
    const pinHash = await bcrypt.hash(pin, 10)

    // Generate QR code
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    const qrCode = `BRGY-${timestamp}-${random}`.toUpperCase()

    // Upload ID image to Supabase Storage if provided
    let idDocumentUrl: string | null = null
    if (idImageBase64) {
      try {
        // Remove data URL prefix if present
        let cleanBase64 = idImageBase64
        if (cleanBase64.includes(",")) {
          cleanBase64 = cleanBase64.split(",")[1]
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("id-documents")
          .upload(`${qrCode}/government_id.jpg`, Buffer.from(cleanBase64, "base64"), {
            contentType: "image/jpeg",
            upsert: true,
          })

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from("id-documents").getPublicUrl(`${qrCode}/government_id.jpg`)
          idDocumentUrl = urlData.publicUrl
        }
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr)
        // Continue without image - not critical
      }
    }

    const fullAddress =
      address ||
      [
        houseLotNo,
        street,
        purok ? `Purok ${purok}` : "",
        barangay ? `Barangay ${barangay}` : "",
        cityMunicipality,
        province,
        zipCode,
      ]
        .filter(Boolean)
        .join(", ")

    const { data, error: insertError } = await supabase
      .from("residents")
      .insert({
        full_name: fullName,
        mobile_number: cleanMobile,
        email: email || null,
        address: fullAddress,
        house_lot_no: houseLotNo || null,
        street: street || null,
        purok: purok || null,
        barangay: barangay || null,
        city_municipality: cityMunicipality || null,
        province: province || null,
        zip_code: zipCode || null,
        birth_date: birthDate || null,
        id_type: idType,
        id_number: idNumber.replace(/\s/g, "").toUpperCase(),
        id_document_url: idDocumentUrl,
        password_hash: passwordHash,
        pin_hash: pinHash,
        qr_code: qrCode,
        privacy_policy_accepted: privacyPolicyAccepted,
        privacy_policy_accepted_at: new Date().toISOString(),
        privacy_policy_version: 'v1.0',
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      if (insertError.message.includes("duplicate")) {
        return Response.json(
          {
            success: false,
            error: "duplicate",
            message: "This mobile number or ID is already registered.",
          },
          { status: 409 },
        )
      }
      return Response.json({ success: false, error: "Registration failed" }, { status: 500 })
    }

    // Generate QRT ID data
    const year = new Date().getFullYear()
    const qrtSequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
    const qrtCode = `QRT-${year}-${qrtSequence}`

    // Generate verification code (6 alphanumeric characters)
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const now = new Date().toISOString()

    // Calculate age from birth date
    const calculateAge = (birthDateStr: string | null): number => {
      if (!birthDateStr) return 0
      const birth = new Date(birthDateStr)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    }

    // Build QR code data JSON for the QRT ID
    const qrCodeData = JSON.stringify({
      qrtCode: qrtCode,
      verificationCode: verificationCode,
      fullName: fullName,
      birthDate: birthDate || '',
      issueDate: now.split('T')[0],
      verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://barangaymawaque.ph'}/verify/qrt/${qrtCode}`
    })

    // Create QRT ID record with all required fields for Supabase qrt_ids table
    const qrtData = {
      user_id: data.id,
      qrt_code: qrtCode,
      verification_code: verificationCode,
      full_name: fullName,
      birth_date: birthDate || '1990-01-01', // Default if not provided
      age: calculateAge(birthDate),
      gender: body.gender || 'prefer_not_to_say',
      civil_status: body.civilStatus || 'single',
      birth_place: body.birthPlace || fullAddress, // Use address as fallback
      address: fullAddress,
      phone_number: cleanMobile, // Use correct column name
      height: body.height || '',
      weight: body.weight || '',
      years_resident: body.yearsResident || 0,
      citizenship: body.citizenship || 'Filipino',
      emergency_contact_name: body.emergencyContactName || '',
      emergency_contact_address: body.emergencyContactAddress || fullAddress,
      emergency_contact_phone: body.emergencyContactPhone || '',
      emergency_contact_relationship: body.emergencyContactRelationship || '',
      photo_url: body.photoUrl || null,
      qr_code_data: qrCodeData, // Required field
      status: 'ready',
      request_type: 'regular',
      payment_reference: `FREE-${Date.now()}`,
      amount: 0,
    }

    // Try to insert QRT ID into database if table exists
    try {
      const { error: qrtError } = await supabase
        .from("qrt_ids")
        .insert(qrtData)

      if (qrtError) {
        console.warn("QRT ID creation warning (non-critical):", qrtError.message)
        // Continue - QRT data will still be returned in response for frontend storage
      }
    } catch (qrtErr) {
      console.warn("QRT ID creation error (non-critical):", qrtErr)
      // Continue - registration was successful
    }

    return Response.json({
      success: true,
      user: {
        id: data.id,
        fullName: data.full_name,
        mobileNumber: data.mobile_number,
        email: data.email,
        address: data.address,
        qrCode: data.qr_code,
      },
      qrtId: {
        id: `qrt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        qrtCode: qrtCode,
        verificationCode: verificationCode,
        fullName: fullName,
        phoneNumber: cleanMobile,
        birthDate: birthDate || '1990-01-01',
        age: calculateAge(birthDate),
        gender: body.gender || 'prefer_not_to_say',
        civilStatus: body.civilStatus || 'single',
        birthPlace: body.birthPlace || fullAddress,
        address: fullAddress,
        height: body.height || '',
        weight: body.weight || '',
        yearsResident: body.yearsResident || 0,
        citizenship: body.citizenship || 'Filipino',
        emergencyContactName: body.emergencyContactName || '',
        emergencyContactAddress: body.emergencyContactAddress || fullAddress,
        emergencyContactPhone: body.emergencyContactPhone || '',
        emergencyContactRelationship: body.emergencyContactRelationship || '',
        photoUrl: body.photoUrl || '',
        qrCodeData: qrCodeData,
        status: 'ready',
        requestType: 'regular',
        paymentReference: `FREE-${Date.now()}`,
        amount: 0,
        createdAt: now,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error("Registration error:", error)
    return Response.json({ success: false, error: error.message || "Server error" }, { status: 500 })
  }
}
