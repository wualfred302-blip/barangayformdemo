# OCR Troubleshooting Fix - Requirements Document

## Spec Description
The OCR is being problematic. I have attached a microsoft docs mcp server for your use to investigate the problem thoroughly in order to recognize the ID's. I have no coding experience, so I need to leverage your expertise to help get this app back into production.

## Investigation Summary

### Current OCR Implementation Analysis

I've conducted a comprehensive investigation of the OCR implementation in your barangay digital services application. Here's what I found:

#### 1. **Technology Stack**
- **OCR Service**: Azure Computer Vision Read API
- **Implementation**: REST API calls from Next.js API route (`/app/api/ocr/route.ts`)
- **Client Component**: IDScanner component (`/components/id-scanner.tsx`)
- **Library Function**: OCR extraction logic (`/lib/ocr.ts`)

#### 2. **Critical Issue Identified: API Version Mismatch**

**ISSUE FOUND**: There is an **API version inconsistency** between two OCR implementation files:

- **`/lib/ocr.ts`** (line 27): Uses **v3.2** endpoint
  ```typescript
  const response = await fetch(`${AZURE_ENDPOINT}/vision/v3.2/read/analyze`, {
  ```

- **`/app/api/ocr/route.ts`** (line 52): Uses **v3.1** endpoint
  ```typescript
  const analyzeUrl = `${AZURE_ENDPOINT}/vision/v3.1/read/analyze`
  ```

**Impact**: According to official Microsoft documentation (verified via Microsoft Docs MCP server):
- Azure Computer Vision API versions 1.0, 2.0, 3.0, and **3.1 were deprecated in September 2023**
- These versions **will be retired on September 13, 2026** - developers won't be able to make API calls after that date
- The recommended migration path is to **Computer Vision v3.2 API** (currently GA)
- Microsoft also recommends considering migration to **Image Analysis 4.0 API** (which has the latest capabilities)
- **v3.2 includes**: model-version parameter support, improved error reporting format, and enhanced OCR models

**Conclusion**: The application MUST migrate from v3.1 to v3.2 immediately, as v3.1 is deprecated and may be causing the current failures.

#### 3. **Recent Fix Attempts**
Based on git commit history, there have been 5 recent attempts to fix OCR issues:
- `48eafbe` - "fix: resolve Azure OCR connection issues"
- `dcc0314` - "fix: correct Azure OCR API endpoint and enhance error handling"
- `5d817ff` - "fix: hardcode Azure endpoint for OCR fallback"
- `f6160ad` - "fix: correct Azure endpoint and improve error handling for OCR API"
- `e7ec9f3` - "fix: resolve OCR API fetch errors on mobile"

These fixes added:
- Better error handling and logging
- Timeout handling (30 seconds)
- CORS headers
- Increased polling attempts (from 10 to 20)
- Improved base64 decoding

#### 4. **Current Azure Configuration**
- **Endpoint**: Multiple endpoints found in code:
  - `baaborern.cognitiveservices.azure.com` (in lib/ocr.ts)
  - `barangaylinkod.cognitiveservices.azure.com` (fallback in route.ts)
- **API Key**: Hardcoded in both files (security concern)
- **Authentication**: Using subscription key in `Ocp-Apim-Subscription-Key` header

#### 5. **Critical Error Reported by User**

**Error Message**: `"Network error: e.getAll is not a function"`

**Analysis of This Error**:
- The error message suggests a **FormData-related issue** (`.getAll()` is a FormData method)
- However, **the codebase doesn't use FormData** for OCR - it sends JSON with base64 image data
- The "Network error:" prefix is added by `/app/api/ocr/route.ts` (line 87), meaning the actual error is `"e.getAll is not a function"`
- This error is being caught in the fetch error handler (lines 74-90)

**Possible Root Causes**:
1. **Next.js Runtime Issue**: Edge runtime or middleware could be interfering with the request/response
2. **Azure API Response Issue**: The Azure API might be returning an unexpected response format that Next.js is trying to parse incorrectly
3. **Request Body Serialization**: Something in the request pipeline is trying to treat the JSON body as FormData
4. **CORS/Network Issue**: The actual network error is being misreported due to error handling

**Investigation Needed**:
- Where exactly does this error appear? (browser alert, console, UI)
- Does it happen every time or intermittently?
- What browser/device is being used?
- Check if the error happens before or after the Azure API is called

#### 6. **Additional Findings**
- **Image Processing**: Compresses images to max 1200px width, JPEG quality 0.8
- **Timeout**: 30-second timeout on both client and server
- **Polling**: Up to 20 attempts with 1.5-second intervals
- **Supported IDs**: Philippine National ID, Driver's License, UMID, SSS, Postal ID, Voter's ID
- **Text Parsing**: Custom regex-based extraction for names, dates, addresses, ID numbers

---

## Questions for User

Before I can provide a complete solution specification, I need clarification on the following:

### 1. **OCR Functionality Issues**

**Q1.1**: What specific problems are you experiencing with the OCR? Please select all that apply:
- [ ] OCR not working at all (always fails)
- [ ] OCR works sometimes but fails randomly
- [ ] OCR times out frequently
- [ ] OCR extracts text but doesn't recognize ID fields correctly
- [ ] OCR works but is very slow (how long does it take?)
- [ ] OCR fails on mobile devices specifically
- [ ] Other (please describe):

**Q1.2**: When did this problem start occurring?
- [ ] Always been an issue since initial implementation
- [ ] Started recently (approximately when?)
- [ ] Works in development but not in production
- [ ] Works on certain devices/browsers but not others

**Q1.3**: What percentage of ID scans are successful vs. failed?
- [ ] 0% success rate (never works)
- [ ] 1-25% success rate
- [ ] 26-50% success rate
- [ ] 51-75% success rate
- [ ] 76-99% success rate (works most of the time)

### 2. **Error Messages and Symptoms**

**Q2.1**: Are you seeing any specific error messages? If yes, please provide:
- Error message text: **"Network error: e.getAll is not a function"** ✅ PROVIDED
- Where the error appears (user interface, browser console, server logs): Unknown - needs clarification

**Q2.2**: What happens when a user tries to scan an ID?
- [ ] Processing indicator appears but never completes
- [ ] Error message appears immediately
- [ ] App crashes or freezes
- [ ] Nothing happens when clicking scan button
- [ ] Other (describe):

### 3. **ID Types and Testing**

**Q3.1**: Which types of Philippine IDs need to be recognized? (Check all required)
- [ ] Philippine National ID (PhilSys)
- [ ] Driver's License
- [ ] UMID (Unified Multi-Purpose ID)
- [ ] SSS ID
- [ ] Postal ID
- [ ] Voter's ID
- [ ] Other government-issued IDs (specify):

**Q3.2**: What data fields must be extracted from IDs?
- [ ] Full Name (required)
- [ ] Birth Date (required)
- [ ] Address (required)
- [ ] ID Number (required)
- [ ] ID Type (required)
- [ ] Photo/Image
- [ ] Other fields (specify):

**Q3.3**: Can you provide test examples? (This would be very helpful)
- [ ] Yes, I can provide sample ID images (anonymized/test IDs)
- [ ] Yes, I can provide screenshots of the current behavior
- [ ] Yes, I can provide photos showing the problem
- [ ] No, I don't have examples available

### 4. **Azure Resource Status**

**Q4.1**: Do you have access to the Azure Portal for the Computer Vision resource?
- [ ] Yes, I can access the Azure Portal
- [ ] No, someone else manages Azure resources
- [ ] Not sure

**Q4.2**: If you can access Azure Portal, please verify:
- [ ] The Computer Vision resource is active and not disabled
- [ ] The API key is valid and matches what's in the code
- [ ] The endpoint URL is correct
- [ ] There are no quota/billing issues
- [ ] You can see API call logs/metrics in Azure Portal

**Q4.3**: Which Azure Computer Vision endpoint should be used?
- Current endpoints found in code:
  - `https://baaborern.cognitiveservices.azure.com`
  - `https://barangaylinkod.cognitiveservices.azure.com`
- Please confirm which is correct or provide the correct endpoint:

### 5. **Environment and Deployment**

**Q5.1**: Where is this application deployed?
- [ ] Vercel (production)
- [ ] Local development only
- [ ] Both development and production showing same issues
- [ ] Other hosting platform:

**Q5.2**: Does OCR work differently in different environments?
- [ ] Works in development, fails in production
- [ ] Works in production, fails in development
- [ ] Fails in both environments
- [ ] Haven't tested in both environments

**Q5.3**: Are there any browser console errors when scanning fails?
- [ ] Yes (please provide console output)
- [ ] No errors shown
- [ ] Haven't checked console

### 6. **Visual Assets Request**

To help me understand and fix the issue, screenshots would be extremely valuable:

**Q6.1**: Can you provide screenshots of:
- [ ] The ID scanner interface showing the scan buttons
- [ ] What happens when a user tries to scan (loading state, error state)
- [ ] Browser console showing any errors
- [ ] A sample Philippine ID that should be recognized (please use a test/sample ID, not a real one)
- [ ] The Azure Portal showing the Computer Vision resource status

**Q6.2**: Can you provide screen recordings showing:
- [ ] The complete flow of attempting to scan an ID and the failure
- [ ] What the user sees during the scanning process

---

## Technical Observations for Spec

Based on my investigation, the fix will likely involve:

1. **API Version Standardization**: Ensuring all OCR calls use v3.2 (GA) consistently
2. **Endpoint Validation**: Confirming the correct Azure endpoint and updating code
3. **Error Handling Enhancement**: Better user-facing error messages
4. **Testing Protocol**: Establishing a test suite for ID scanning
5. **Security Improvement**: Moving hardcoded API keys to environment variables
6. **Performance Optimization**: Potentially adjusting timeout/polling parameters

---

## Next Steps

Once you provide answers to the questions above, I will:

1. **Create a detailed technical specification** outlining:
   - Root cause analysis
   - Proposed solution architecture
   - Step-by-step implementation plan
   - Testing strategy
   - Rollback plan

2. **Provide code changes** to fix the identified issues

3. **Create a testing checklist** to verify the fix works correctly

4. **Document the solution** for future reference

---

## Immediate Recommendations (Preliminary)

While waiting for your responses, here are some immediate observations:

### High Priority Issues Found:
1. ⚠️ **API Version Mismatch**: `lib/ocr.ts` uses v3.2 while `route.ts` uses v3.1 (deprecated)
2. ⚠️ **Hardcoded Credentials**: API keys should be in environment variables
3. ⚠️ **Multiple Endpoints**: Code references two different Azure endpoints

### Medium Priority Issues:
4. **No structured error logging**: Hard to diagnose production failures
5. **Limited retry logic**: Could implement exponential backoff
6. **Image size optimization**: Could further optimize for mobile networks

### Nice to Have:
7. **Telemetry/Analytics**: Track OCR success rates
8. **Fallback UI**: Manual entry if OCR fails repeatedly
9. **Image quality validation**: Pre-check image before sending to Azure

---

**Please provide answers to the questions above so I can create a comprehensive fix specification tailored to your specific issues.**
