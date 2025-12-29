// Centralized type definitions for QRT ID system

export type QRTStatus = "pending" | "processing" | "ready" | "issued"

export type QRTRequestType = "regular" | "rush"

export interface QRTPersonalInfo {
  fullName: string
  birthDate: string
  age: number
  gender: string
  civilStatus: string
  birthPlace: string
  address: string
  height: string
  weight: string
  yearsResident: number
  citizenship: string
}

export interface QRTEmergencyContact {
  emergencyContactName: string
  emergencyContactAddress: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

export interface QRTIDRequest extends QRTPersonalInfo, QRTEmergencyContact {
  id: string
  qrtCode: string
  verificationCode: string
  userId: string
  photoUrl: string
  idFrontImageUrl?: string
  idBackImageUrl?: string
  qrCodeData: string
  status: QRTStatus
  issuedDate?: string
  expiryDate?: string
  createdAt: string
  updatedAt?: string
  paymentReference: string
  paymentTransactionId?: string
  requestType: QRTRequestType
  amount: number
}

export interface QRCodeData {
  verificationCode: string
  verifyUrl: string
}

export interface QRTVerificationResult {
  valid: boolean
  data?: QRTIDRequest
  error?: string
}

export interface NanoBananaRequest {
  template: string
  data: {
    // Front side
    qrtCode: string
    fullName: string
    address: string
    birthDate: string
    civilStatus: string
    birthPlace: string
    gender: string
    photoUrl: string
    // Back side
    height: string
    weight: string
    yearsResident: number
    citizenship: string
    emergencyContactName: string
    emergencyContactAddress: string
    emergencyContactPhone: string
    emergencyContactRelationship: string
    qrCodeDataUrl: string
    issuedDate: string
    expiryDate: string
  }
}

export interface NanoBananaResponse {
  success: boolean
  frontImageUrl?: string
  backImageUrl?: string
  front_url?: string
  back_url?: string
  error?: string
}

export interface QRTVerificationLog {
  qrtCode: string
  verifiedBy: string
  timestamp: string
  action: "qrt_verification"
}
