// Authentication utilities for password and PIN hashing

// Simple hash function using Web Crypto API (bcrypt not available in browser)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "barangay_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + "barangay_pin_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin)
  return pinHash === hash
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" }
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: "Password must contain at least 1 number" }
  }
  return { valid: true }
}

export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!/^\d{4}$/.test(pin)) {
    return { valid: false, error: "PIN must be exactly 4 digits" }
  }
  return { valid: true }
}

export function validateMobileNumber(mobile: string): { valid: boolean; error?: string } {
  // Philippine mobile format: +63 or 09
  const cleaned = mobile.replace(/\s/g, "")
  if (!/^(\+63|0)9\d{9}$/.test(cleaned)) {
    return { valid: false, error: "Invalid Philippine mobile number" }
  }
  return { valid: true }
}

export function generateQRCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `BRGY-${timestamp}-${random}`.toUpperCase()
}
