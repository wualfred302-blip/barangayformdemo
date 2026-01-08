# Registration Flow with ID Scanning - Requirements

## Overview
Implement a comprehensive registration flow with mandatory government ID scanning, OCR data extraction using Microsoft Azure Computer Vision, automated validation, and secure account creation with both password and PIN authentication.

## Technology Stack
- **OCR Service**: Microsoft Azure Computer Vision API
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Password (bcrypt) + 4-digit PIN (bcrypt)
- **Image Processing**: Client-side compression before upload

## Azure Computer Vision API
- **API Key**: [REDACTED]
- **Usage**: Extract text from government ID images
- **Endpoint**: Use Azure Computer Vision Read API for OCR

---

## Registration Flow

### Step 1: ID Scanning (Required, Cannot Skip)

**Page**: `/register`

**UI Components**:
- Prominent ID Scanner component at top of page
- Two action buttons:
  - "Scan ID" - Opens camera to capture government ID
  - "Upload" - Select ID photo from gallery
- Cannot proceed without completing this step

**User Actions**:
1. User lands on `/register` page
2. User chooses scanning method:
   - **Scan ID**: Opens device camera, user captures photo of government ID
   - **Upload**: Opens file picker, user selects ID image from device
3. Once image captured/selected:
   - Image is compressed client-side (reduce file size for faster upload)
   - Loading overlay appears with progress messages:
     - "Compressing image..."
     - "Reading ID card..."
     - "Extracting information..."

**Supported ID Types**:
- National ID (XXXX-XXXX-XXXX format)
- Driver's License (XXX-XX-XXXXXX format)
- UMID (XXXX-XXXXXXX-X format)
- SSS ID (XX-XXXXXXX-X format)
- Postal ID (Alphanumeric, variable format)
- Voter's ID (Variable format per region)

---

### Step 2: OCR Processing & Validation

**API Endpoint**: `/api/ocr` (new route to create)

**OCR Processing Flow**:
1. Receive compressed image from frontend
2. Send image to Microsoft Azure Computer Vision API
3. Extract critical data:
   - Full legal name
   - Birthdate (calculate age from birthdate)
   - Complete address
   - ID type (detect which type of government ID)
   - ID number (varies by ID type)
4. Return structured JSON with extracted data

**Server-Side Validation Checks** (all automatic):

#### Check #1: ID Number Format Validation
- Validate ID number matches expected format for detected ID type:
  - **National ID**: `XXXX-XXXX-XXXX` (12 digits with dashes)
  - **Driver's License**: `XXX-XX-XXXXXX` (11 characters)
  - **UMID**: `XXXX-XXXXXXX-X` (12 digits with dashes)
  - **SSS**: `XX-XXXXXXX-X` (10 digits with dashes)
  - **Postal ID**: Alphanumeric, variable format (flexible validation)
  - **Voter's ID**: Variable format per region (flexible validation)
- **If invalid**: Return error, prompt user to rescan

#### Check #2: Duplicate ID Detection
- Query Supabase `residents` table for existing `government_id_number`
- **If duplicate found**:
  - Return specific error:
    \`\`\`json
    {
      "success": false,
      "error": "duplicate",
      "message": "This ID is already registered"
    }
    \`\`\`
  - Frontend shows: "An account with this ID already exists. Try logging in or reset your password."
  - Provide links to `/login` and password reset
- **If no duplicate**: Proceed to next check

#### Check #3: Address Validation (Simplified for Phase 1)
- **Phase 1**: Just extract and store address (no strict validation)
- **Future enhancement**: Fuzzy match against purok list
- For now: Accept any extracted address

**Error Handling**:
- If any validation fails:
  - User sees: "Verification failed, please rescan"
  - Can retry unlimited times
  - Each retry goes through full OCR + validation again
- If all validations pass:
  - OCR data returned to frontend
  - Form fields auto-populated with extracted data

---

### Step 3: Review & Edit Information

**UI Display**:
- Registration form with pre-filled fields
- Fields highlighted in green to indicate they came from ID scan
- All fields are editable to correct OCR mistakes

**Form Fields** (visible to user):
1. **Full Name** (as appears on ID)
   - Pre-filled from OCR
   - User can edit to correct mistakes
2. **Birthdate** (with auto-calculated age shown)
   - Pre-filled from OCR
   - Age calculated and displayed (e.g., "25 years old")
3. **Address** (complete address from ID)
   - Pre-filled from OCR
   - User can edit to correct or complete
4. **Mobile Number**
   - Pre-filled if extracted from ID (some IDs don't have this)
   - Required field - user must provide if not extracted
   - Format: Philippine mobile number (e.g., +63 912 345 6789)
5. **Email**
   - Empty - user must provide
   - Required field
   - Must be valid email format

**Hidden Fields** (stored but not shown to user):
- Government ID type (e.g., "National ID")
- Government ID number (e.g., "1234-5678-9012")
- Extracted ID image (stored in Supabase Storage)

---

### Step 4: Set Password & PIN

**Password Section**:
1. **Password Field**:
   - Label: "Create Password"
   - Input: Password field with show/hide toggle (eye icon)
   - Validation: Minimum 8 characters, at least 1 number
   - Visual strength indicator (weak/medium/strong)

2. **Confirm Password Field**:
   - Label: "Confirm Password"
   - Must match password field
   - Real-time validation (show error if mismatch)

**PIN Section**:
1. **PIN Field**:
   - Label: "Set 4-Digit PIN for Quick Access"
   - Input: 4-digit numeric input (masked/dots)
   - Helper text: "Use this PIN for faster login"
   - Numeric keypad on mobile

2. **Confirm PIN Field**:
   - Label: "Confirm PIN"
   - Must match PIN field
   - Real-time validation

**Privacy Policy**:
- Checkbox: "I agree to the Privacy Policy" (required)
- Link to privacy policy page (opens in modal or new tab)

---

### Step 5: Account Creation

**User Action**: Clicks "Register" button

**Frontend Validation** (before API call):
- All required fields filled
- Password matches confirm password
- PIN matches confirm PIN
- Privacy policy checkbox checked
- Valid email format
- Valid mobile number format

**Backend Account Creation** (Supabase integration):

1. **Hash sensitive data**:
   - Hash password with bcrypt (cost factor 10)
   - Hash PIN with bcrypt (cost factor 10)

2. **Upload ID image to Supabase Storage**:
   - Bucket: `id-documents`
   - Path: `{user_id}/government_id.jpg`
   - Get public URL

3. **Create record in `residents` table**:
   \`\`\`sql
   INSERT INTO residents (
     full_name,
     email,
     mobile_number,
     address,
     birthdate,
     age,
     government_id_type,
     government_id_number,
     government_id_image_url,
     password_hash,
     pin_hash,
     account_status,
     created_at
   ) VALUES (...)
   \`\`\`

4. **Return user object** with generated `user_id`

**Success Response**:
- User object stored in auth context
- Redirect to `/register/success` page
- Success page shows: "Account created successfully! You can now access all barangay services."
- Auto-redirect to `/dashboard` after 3 seconds (or provide "Go to Dashboard" button)

---

## Login Flow (Updated)

### Option 1: Mobile Number + Password (Standard Login)

**Page**: `/login`

**UI**:
- Two input fields:
  1. Mobile Number (e.g., +63 912 345 6789)
  2. Password (with show/hide toggle)
- "Sign In" button
- "Forgot Password?" link
- "Don't have an account? Register" link

**Authentication Flow**:
1. User enters mobile number and password
2. Frontend sends credentials to `/api/auth/login`
3. Backend queries:
   \`\`\`sql
   SELECT * FROM residents
   WHERE mobile_number = ?
   AND password_hash = bcrypt(?)
   \`\`\`
4. If match found:
   - Create session (JWT token or Supabase auth session)
   - Store user in auth context
   - Update `last_login` timestamp
   - Redirect to `/dashboard`
5. If no match:
   - Show error: "Invalid mobile number or password"
   - Increment failed login attempts
   - After 5 failed attempts: Lock account for 15 minutes

---

### Option 2: Mobile Number + PIN (Quick Access)

**Page**: `/login` (with toggle/tab)

**UI**:
- Toggle button: "Quick Login with PIN"
- Form changes to show:
  1. Mobile Number
  2. 4-Digit PIN (numeric input, masked)
- "Sign In" button

**Authentication Flow**:
1. User enters mobile number and PIN
2. Frontend sends credentials to `/api/auth/login-pin`
3. Backend queries:
   \`\`\`sql
   SELECT * FROM residents
   WHERE mobile_number = ?
   AND pin_hash = bcrypt(?)
   \`\`\`
4. If match found:
   - Create session
   - Store user in auth context
   - Update `last_login` timestamp
   - Redirect to `/dashboard`
5. If no match:
   - Show error: "Invalid mobile number or PIN"
   - Rate limiting applies (max 5 attempts = 15min lockout)

---

## Database Schema (Supabase)

### New `residents` Table

\`\`\`sql
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Info (from OCR)
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  birthdate DATE NOT NULL,
  age INTEGER NOT NULL,

  -- Government ID Info
  government_id_type TEXT NOT NULL, -- 'national_id', 'drivers_license', 'umid', 'sss', 'postal', 'voters'
  government_id_number TEXT UNIQUE NOT NULL,
  government_id_image_url TEXT, -- Supabase Storage URL

  -- Authentication
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,

  -- Security & Rate Limiting
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Account Status
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_residents_mobile ON residents(mobile_number);
CREATE INDEX idx_residents_email ON residents(email);
CREATE INDEX idx_residents_id_number ON residents(government_id_number);

-- Trigger to update updated_at
CREATE TRIGGER update_residents_updated_at
  BEFORE UPDATE ON residents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
\`\`\`

### Supabase Storage Bucket

**Bucket Name**: `id-documents`

**Configuration**:
- Private bucket (not publicly accessible)
- Restricted access: Only accessible by user themselves and admin staff
- File size limit: 5MB per image
- Allowed file types: JPG, PNG, JPEG
- Folder structure: `{user_id}/government_id.jpg`

**RLS Policy**:
\`\`\`sql
-- Users can only access their own ID documents
CREATE POLICY "Users can view own ID documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can access all ID documents
CREATE POLICY "Admin can view all ID documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents' AND auth.jwt()->>'role' = 'admin');
\`\`\`

---

## Security Features

### Password Security
- Hashed with bcrypt (cost factor 10)
- Never stored in plain text
- Never returned in API responses
- Minimum 8 characters, at least 1 number required

### PIN Security
- Also hashed with bcrypt (cost factor 10)
- 4-digit numeric only (easier to remember, faster login)
- Rate limiting: Max 5 failed attempts = 15 minute lockout
- Never returned in API responses

### ID Document Storage
- Stored in Supabase Storage with restricted access
- Only accessible by user themselves and admin staff
- Encrypted at rest by Supabase
- Transmitted over HTTPS

### Duplicate Prevention
- Unique constraint on `government_id_number`
- Unique constraint on `mobile_number`
- Unique constraint on `email`
- Prevents multiple accounts with same ID/contact info

### Rate Limiting
- Track `failed_login_attempts` in database
- Lock account (`locked_until` timestamp) after 5 failed attempts
- Automatic unlock after 15 minutes
- Reset counter on successful login

---

## Error Handling

| Scenario | User Experience |
|----------|-----------------|
| OCR fails to extract data | "Verification failed, please rescan" |
| Invalid ID format | "Verification failed, please rescan" |
| Duplicate ID number | "Account exists. Try logging in or reset password" |
| Duplicate mobile number | "This mobile number is already registered" |
| Duplicate email | "This email is already registered" |
| Password mismatch | "Passwords do not match" |
| PIN mismatch | "PINs do not match" |
| Network error | "Connection error. Please try again" |
| Azure API failure | "ID verification service unavailable. Please try again later" |
| Invalid image format | "Please upload a valid image (JPG, PNG)" |
| Image too large | "Image too large. Maximum 5MB allowed" |
| Account locked | "Too many failed attempts. Try again in X minutes" |

---

## User Experience Flow

\`\`\`
[User] → /register
         ↓
      Scan/Upload ID
         ↓
   [Azure Computer Vision OCR]
         ↓
   Extract: Name, DOB, Address, ID#, ID Type
         ↓
   Validate ID Format
         ↓
   Check Duplicates (Supabase)
         ↓
   Pass/Fail?
         ↓
Fail → "Verification failed, rescan"
         ↓
Pass → Auto-fill Form
         ↓
   [User Reviews/Edits]
         ↓
   Adds: Mobile, Email
         ↓
   Sets: Password + PIN
         ↓
   Agrees to Privacy Policy
         ↓
   Clicks "Register"
         ↓
   [Backend]
         ↓
   Hash password & PIN (bcrypt)
         ↓
   Upload ID image (Supabase Storage)
         ↓
   Insert into residents table
         ↓
   Return user object
         ↓
   [Frontend]
         ↓
   Store in auth context
         ↓
   Redirect to /register/success
         ↓
   Auto-redirect to /dashboard
\`\`\`

---

## Implementation Phases

### Phase 1: Database Setup
- Create `residents` table in Supabase
- Create `id-documents` storage bucket
- Set up RLS policies
- Create indexes

### Phase 2: OCR API Integration
- Create `/api/ocr` route
- Integrate Microsoft Azure Computer Vision API
- Implement ID data extraction logic
- Implement validation checks (format, duplicates, address)
- Handle errors and retries

### Phase 3: Registration UI
- Create `/register` page
- Build ID scanner component (camera + upload)
- Implement image compression
- Build registration form with auto-fill
- Add password/PIN input with validation
- Add privacy policy checkbox

### Phase 4: Registration Backend
- Create `/api/register` route
- Implement password/PIN hashing (bcrypt)
- Implement Supabase Storage upload
- Implement database insertion
- Handle duplicate detection
- Return user object and session

### Phase 5: Login Flow
- Update `/login` page UI
- Add toggle for password vs PIN login
- Create `/api/auth/login` route (password)
- Create `/api/auth/login-pin` route (PIN)
- Implement rate limiting
- Implement account locking/unlocking

### Phase 6: Success & Error Pages
- Create `/register/success` page
- Update error handling on all forms
- Add user-friendly error messages
- Implement retry mechanisms

### Phase 7: Testing & Polish
- Test OCR with all supported ID types
- Test validation rules
- Test duplicate detection
- Test login with password and PIN
- Test rate limiting and account locking
- Mobile responsive testing
- Accessibility testing

---

## Success Criteria

- [ ] User can register by scanning government ID
- [ ] OCR extracts data accurately from all supported ID types
- [ ] Duplicate ID detection prevents multiple accounts
- [ ] Form auto-fills with extracted data
- [ ] User can edit auto-filled data
- [ ] Password and PIN are securely hashed
- [ ] ID images stored securely in Supabase Storage
- [ ] User can login with mobile + password
- [ ] User can login with mobile + PIN
- [ ] Rate limiting prevents brute force attacks
- [ ] All errors handled gracefully with user-friendly messages
- [ ] Mobile responsive design
- [ ] Accessible to keyboard and screen reader users

---

## Future Enhancements

- **Address Validation**: Fuzzy match against purok list
- **Email Verification**: Send verification email before account activation
- **SMS Verification**: Send OTP to mobile number
- **Two-Factor Authentication**: Optional 2FA for enhanced security
- **Password Reset**: Forgot password flow with email/SMS
- **Profile Photo**: Allow users to upload profile picture
- **QR Code Login**: Generate QR code for quick login on trusted devices
- **Biometric Login**: Face ID / Touch ID on supported devices
