# Registration Flow with ID Scanning

**Status:** COMPLETED
**Completed:** 2026-01-08

---

## Summary

Implemented a comprehensive registration flow with mandatory government ID scanning, OCR data extraction using Microsoft Azure Computer Vision, and secure account creation with dual authentication (password + PIN).

---

## What Was Built

### 1. OCR API (`/app/api/ocr/route.ts`)
- Azure Computer Vision Read API integration
- Supports 12+ Philippine ID types (National ID, Driver's License, UMID, SSS, PhilHealth, Postal, Voter's, Passport, PRC, Barangay, Senior Citizen, PWD)
- Extracts: name, birthdate, address components, ID type, ID number, mobile number
- Address parsing into structured fields (house/lot, street, purok, barangay, city, province, zip)
- Label filtering to clean OCR output

### 2. Registration API (`/app/api/register/route.ts`)
- Password hashing with bcrypt (cost factor 10)
- PIN hashing with bcrypt (cost factor 10)
- ID format validation per ID type
- Duplicate detection (mobile number, ID number)
- ID image upload to Supabase Storage (`id-documents` bucket)
- QR code generation for resident identification

### 3. Login API (`/app/api/auth/login/route.ts`)
- Dual authentication: password or 4-digit PIN
- Rate limiting: 5 failed attempts = 15-minute lockout
- Failed attempts tracking with automatic reset on success
- Last login timestamp update

### 4. Frontend Components

**ID Scanner** (`/components/id-scanner.tsx`)
- Camera capture and file upload
- Client-side image compression
- Processing overlay with progress indicator

**Registration Page** (`/app/register/page.tsx`)
- Multi-section form: Personal Info, Address, Contact, Security
- Auto-fill from OCR with visual highlighting
- Full validation (mobile, password, PIN)
- Privacy policy agreement

**Login Page** (`/app/login/page.tsx`)
- Password/PIN toggle
- Mobile number validation
- Error handling with remaining attempts display

**Success Page** (`/app/register/success/page.tsx`)
- Countdown redirect to dashboard

### 5. Database

**`residents` table** with fields:
- Personal: `full_name`, `birth_date`, `email`, `mobile_number`
- Address: `address`, `house_lot_no`, `street`, `purok`, `barangay`, `city_municipality`, `province`, `zip_code`
- ID: `id_type`, `id_number`, `id_document_url`
- Auth: `password_hash`, `pin_hash`, `qr_code`
- Security: `failed_login_attempts`, `lockout_until`, `last_login`

**`id-documents` storage bucket** for government ID images

---

## Files

| File | Purpose |
|------|---------|
| `/app/api/ocr/route.ts` | Azure CV OCR processing |
| `/app/api/register/route.ts` | Account registration |
| `/app/api/auth/login/route.ts` | Password/PIN authentication |
| `/components/id-scanner.tsx` | ID capture component |
| `/app/register/page.tsx` | Registration form |
| `/app/register/success/page.tsx` | Success page |
| `/app/login/page.tsx` | Login page |

---

## Environment Variables

```env
AZURE_CV_ENDPOINT=https://[instance].cognitiveservices.azure.com
AZURE_CV_API_KEY=[key]
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```
