# Specification: Fix Supabase QRT ID and /requests Section Issues

## 1. Overview

### Problem Summary
Users who submit QRT ID requests and complete payment cannot see their submissions in the `/requests` section, despite the records being successfully saved to the Supabase database. Currently, 43 QRT ID records exist in the database but appear invisible to users due to a user ID mismatch in the filtering logic.

### Impact on Users
- **User Frustration**: Users complete the entire request and payment flow but cannot verify their submissions were successful
- **Loss of Confidence**: Users believe their requests were lost or payment failed
- **Support Burden**: Developers spend excessive time debugging what appears to be data persistence issues
- **Token Drain**: Repeated investigation and debugging consumes significant token budgets due to Supabase MCP authentication failures

### Success Criteria
- Users can see all their QRT ID requests in the `/requests` page after submission
- User ID matching works consistently across authentication and database storage
- No false negatives (hiding records that should appear) or false positives (showing other users' records)
- Developers can inspect database state without MCP authentication
- Future similar issues can be debugged in under 5 minutes

---

## 2. Problem Analysis

### Root Cause Explanation

The issue stems from a **user ID mismatch** between how user identities are stored in the authentication context and how they are stored in the database:

1. **In Auth Context** (`/lib/auth-context.tsx`):
   - When users register, they are assigned: `id: user_${Date.now()}`
   - This creates IDs like: `user_1767563860928`

2. **In QRT Request Form** (`/app/qrt-id/request/page.tsx` line 1085):
   - When submitting a QRT request: `userId: user?.id || "demo_user"`
   - This correctly uses `user?.id` from auth context

3. **In Payment Flow** (`/app/payment/page.tsx` line 281):
   - When creating the complete QRT record: `userId: qrtRequest.userId || ""`
   - This correctly passes through the userId from the request

4. **In Database** (Supabase `qrt_ids` table):
   - 43 records exist with user_id format: `user_[timestamp]` (e.g., `user_1767563860928`)
   - All records have status: "ready"

5. **In /requests Page** (`/app/requests/page.tsx` line 57):
   - Filtering call: `const myQrtIds = user?.id ? getUserQRTIds(user.id) : qrtIds`
   - This passes `user.id` to the filter

6. **In QRT Context Filter** (`/lib/qrt-context.tsx` lines 445-450):
   ```typescript
   const getUserQRTIds = useCallback(
     (userId: string) => {
       return qrtIds.filter((qrt) => qrt.userId === userId)
     },
     [qrtIds],
   )
   ```
   - This should work correctly IF the userId values match exactly

### Why the Mismatch Occurs

**Investigation reveals the actual problem**: The user ID stored in the database DOES match the user ID in auth context. However, when the `/requests` page loads, the QRT records may not have been fetched yet, OR the QRT context loads all records but the filtering happens before the auth context has fully initialized the user object.

**Critical Race Condition**:
- `auth-context.tsx` loads user from localStorage asynchronously (line 48-62)
- `qrt-context.tsx` loads all QRT IDs from Supabase immediately (line 203-220)
- `/requests/page.tsx` calls `getUserQRTIds(user?.id)` on line 57
- If `user?.id` is undefined when the filter is called, it filters with an undefined string, returning no results

### Database State Analysis

From investigation (`scripts/inspect-supabase-schema.js`):
- **Total QRT Records**: 43
- **Schema Columns**: 32 (no email column despite TypeScript interface expecting it)
- **User ID Format**: All records follow `user_[timestamp]` pattern
- **Status**: All records have status = "ready"
- **Data Persistence**: Working correctly; data IS being saved

### Why /requests Shows Empty

The `/requests` page shows empty because:

1. **Timing Issue**: When page loads, `user.id` may be undefined while `qrtIds` are already loaded
2. **localStorage Dependency**: Auth context relies on localStorage which loads asynchronously
3. **No Fallback**: If filtering returns empty, page assumes no requests exist rather than checking for loading state
4. **Silent Failure**: No error message or console indication that filtering was attempted with undefined user ID

---

## 3. Technical Solution Design

### Solution 1: Fix User ID Matching and Loading State (CRITICAL - Implement First)

#### Investigation Required
1. Verify user.id is NOT undefined when filtering occurs
2. Add console logging to track auth context initialization timing
3. Add console logging to track QRT context loading and filtering
4. Verify all 43 QRT IDs load successfully

#### Root Cause Determination
The mismatch is likely in **timing**, not value matching:
- Auth context initializes from localStorage
- QRT context loads from Supabase
- `/requests` page filters before auth is ready

#### Implementation - Option A (RECOMMENDED): Fix Loading State

**Changes to `/app/requests/page.tsx`**:

```typescript
export default function RequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { certificates, getCertificatesByUserId } = useCertificates()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { requests: bayanihanRequests } = useBayanihan()
  const { qrtIds, getUserQRTIds, refreshQRTIds, isLoaded } = useQRT()
  const [filter, setFilter] = useState<FilterType>("all")
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // CRITICAL FIX: Wait for both auth AND qrt context to load
  const isContextReady = !authLoading && isLoaded

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const tab = searchParams.get("tab") as TabType
    if (tab && ["all", "certificates", "qrt", "bayanihan"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // CRITICAL FIX: Add debug logging
  useEffect(() => {
    console.log("[Requests] Loading state:", {
      authLoading,
      qrtLoaded: isLoaded,
      isContextReady,
      userId: user?.id,
      qrtIdsCount: qrtIds.length,
    })
  }, [authLoading, isLoaded, isContextReady, user?.id, qrtIds.length])

  if (authLoading || !isContextReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
      </div>
    )
  }

  // NOW filter after both contexts are ready and user.id is defined
  const myQrtIds = user?.id ? getUserQRTIds(user.id) : []

  // Add debug logging for filtering
  useEffect(() => {
    if (user?.id && myQrtIds.length === 0 && qrtIds.length > 0) {
      console.warn("[Requests] No QRT IDs matched for user:", {
        userId: user.id,
        totalQrtIds: qrtIds.length,
        sampleQrtIds: qrtIds.slice(0, 3).map(q => ({ id: q.id, userId: q.userId })),
      })
    }
  }, [user?.id, myQrtIds, qrtIds])

  // ... rest of component unchanged
}
```

**Why This Works**:
- Waits for auth context to fully load (`authLoading` becomes false)
- Waits for QRT context to fully load (`isLoaded` becomes true)
- Only then calls `getUserQRTIds(user.id)` with a guaranteed non-undefined user.id
- Provides debugging information if no records match

#### Implementation - Option B: Add User ID Consistency Check

**Changes to `/lib/qrt-context.tsx`** (in addition to Option A):

```typescript
// In dbRowToQRTIDRequest function (line 74):
function dbRowToQRTIDRequest(row: Record<string, unknown>): QRTIDRequest {
  const userId = (row.user_id as string) || "anonymous"

  // Debug logging to catch ID format issues
  if (typeof userId !== 'string' || !userId.startsWith('user_') && userId !== 'anonymous') {
    console.warn("[QRT Context] Unexpected user_id format:", {
      user_id: row.user_id,
      type: typeof row.user_id,
    })
  }

  return {
    // ... existing mappings ...
    userId,
    // ... rest of mappings ...
  }
}

// In getUserQRTIds function (line 445):
const getUserQRTIds = useCallback(
  (userId: string) => {
    if (!userId) {
      console.warn("[QRT Context] getUserQRTIds called with empty userId")
      return []
    }

    const results = qrtIds.filter((qrt) => qrt.userId === userId)

    if (results.length === 0 && qrtIds.length > 0) {
      console.warn("[QRT Context] No QRT IDs found for userId:", {
        searchUserId: userId,
        totalQrtIds: qrtIds.length,
        uniqueUserIds: [...new Set(qrtIds.map(q => q.userId))],
      })
    }

    return results
  },
  [qrtIds],
)
```

**Why This Works**:
- Catches undefined or malformed user IDs at the source
- Logs all unique user IDs in database for comparison
- Makes it obvious if there's a real data mismatch

---

### Solution 2: Supabase Direct Access Tools

#### Document Existing Solution

The working script `scripts/inspect-supabase-schema.js` provides direct Supabase access without MCP authentication. This script:
- Uses `@supabase/supabase-js` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Runs in Node.js environment (not browser)
- Bypasses MCP OAuth flow entirely

**Usage**:
```bash
node scripts/inspect-supabase-schema.js
```

#### Create Additional Helper Scripts

**File: `/scripts/qrt-id-inspector.js`**

```javascript
// Query and inspect QRT IDs with user association
// Usage: node scripts/qrt-id-inspector.js [userId]
```

**File: `/scripts/verify-user-ids.js`**

```javascript
// Compare user IDs between auth flow and database records
// Usage: node scripts/verify-user-ids.js
// Output: Shows if there are any format mismatches
```

**File: `/scripts/query-qrt-by-code.js`**

```javascript
// Find QRT record by QRT code
// Usage: node scripts/query-qrt-by-code.js QRT-2025-123456
```

#### Configuration

**Create file: `/.env.local.example`** with required Supabase variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional: Disable Supabase MCP Plugin**

Edit `.claude/settings.local.json`:
```json
{
  "plugins": {
    "supabase@claude-plugins-official": {
      "disabled": true
    }
  }
}
```

This prevents MCP attempts and avoids confusing failures.

---

### Solution 3: Schema Alignment - Email Field

#### Problem

TypeScript interface expects `email` field (line 12 in `/lib/qrt-context.tsx`):
```typescript
email: string
```

But database schema has no `email` column. This causes:
- Silent undefined assignments (line 81): `email: row.email as string`
- Type mismatch when saving to database
- Potential validation errors

#### Solution

**Option A (Recommended): Remove from Interface**

Edit `/lib/qrt-context.tsx`:

```typescript
export interface QRTIDRequest {
  id: string
  qrtCode: string
  verificationCode: string
  userId: string
  fullName: string
  // REMOVED: email: string
  phoneNumber: string
  // ... rest of fields
}

function dbRowToQRTIDRequest(row: Record<string, unknown>): QRTIDRequest {
  return {
    // ... other fields ...
    // REMOVED: email: row.email as string,
    phoneNumber: row.phone_number as string,
    // ... rest
  }
}

function qrtRequestToDbRow(request: QRTIDRequest): Record<string, unknown> {
  return {
    // ... other fields ...
    // REMOVED: email: request.email,
    phone_number: request.phoneNumber,
    // ... rest
  }
}
```

Update all references in `/app/payment/page.tsx` and form pages to remove email field references.

**Option B (Future-Safe): Add to Database**

If email should be collected:
1. Create migration to add `email` column to `qrt_ids` table
2. Set as nullable for existing records
3. Update forms to collect email
4. Update interfaces to include email

**Recommendation**: Go with Option A because:
- Email is not currently collected in QRT request form
- Phone number provides adequate contact info
- Reduces database schema complexity
- Fewer null/undefined handling issues

---

### Solution 4: Error Visibility Improvements

#### Add Success Toast in Payment Flow

**File: `/app/payment/page.tsx`** (around line 312):

```typescript
// After successful addQRTRequest call
if (isQRTPayment && qrtRequest) {
  // ... existing QRT record creation ...

  // 6. Save to Context
  addQRTRequest(newQRTRecord)

  // ADD: Show success feedback
  console.log("[v0] QRT ID created successfully:", {
    qrtCode: newQRTRecord.qrtCode,
    userId: newQRTRecord.userId,
    createdAt: newQRTRecord.createdAt,
  })

  // Toast notification (if toast library available)
  if (typeof window !== 'undefined') {
    // You can add a toast here using your toast library
    console.info("[v0] User should see: 'Your QRT ID request was created successfully'")
  }

  // ... existing rest of code ...
}
```

#### Add Debug Info When /requests is Empty

**File: `/app/requests/page.tsx`** (in the empty state):

```typescript
{filteredRequests.length === 0 ? (
  <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <FileText className="h-8 w-8 text-gray-300" />
      </div>
      <p className="mb-2 text-lg font-semibold text-gray-600">No requests found</p>

      {/* ADD: More helpful messaging */}
      <p className="mb-6 text-sm text-gray-400 text-center">
        {filter === "all"
          ? "You haven't made any requests yet."
          : `No ${filter} requests.`}
      </p>

      {/* ADD: Debug info for developers */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 font-mono max-w-xs">
          <p>Debug Info:</p>
          <p>Auth: {isAuthenticated ? 'yes' : 'no'}</p>
          <p>User ID: {user?.id || 'undefined'}</p>
          <p>QRT Loaded: {isLoaded ? 'yes' : 'no'}</p>
          <p>Total QRT IDs: {qrtIds.length}</p>
        </div>
      )}

      {/* ... rest of buttons ... */}
    </CardContent>
  </Card>
) : (
  // ... existing request list ...
)}
```

#### Enhanced Console Logging

**Create file: `/lib/request-logger.ts`**:

```typescript
// Centralized logging for request lifecycle
export const requestLogger = {
  logQRTCreation: (qrtRecord: QRTIDRequest) => {
    console.log("[QRT Creation]", {
      timestamp: new Date().toISOString(),
      qrtCode: qrtRecord.qrtCode,
      userId: qrtRecord.userId,
      status: qrtRecord.status,
      createdAt: qrtRecord.createdAt,
    })
  },

  logQRTFiltering: (userId: string, total: number, matched: number) => {
    console.log("[QRT Filtering]", {
      timestamp: new Date().toISOString(),
      userId,
      totalRecords: total,
      matchedRecords: matched,
      success: matched > 0,
    })
  },

  logRequestsPageLoad: (context: any) => {
    console.log("[Requests Page]", {
      timestamp: new Date().toISOString(),
      ...context,
    })
  },
}
```

---

## 4. Implementation Plan

### Phase 1: Critical Fixes (Day 1)

**Task 1: Implement Loading State Fix**
- File: `/app/requests/page.tsx`
- Add `authLoading` check before filtering
- Add console logging for debugging
- Test: Verify QRT IDs appear after loading completes
- Estimate: 30 minutes

**Task 2: Add QRT Context Consistency Checking**
- File: `/lib/qrt-context.tsx`
- Add user ID format validation
- Add filtering debug logging
- Test: Verify no data corruption or format issues
- Estimate: 20 minutes

**Task 3: Fix Email Field Schema Mismatch**
- File: `/lib/qrt-context.tsx`, `/app/payment/page.tsx`
- Remove email field from interface and all mappings
- Test: Form submission and record creation still works
- Estimate: 15 minutes

### Phase 2: Developer Tools (Day 1-2)

**Task 4: Create QRT Inspector Script**
- File: `/scripts/qrt-id-inspector.js`
- Query QRT IDs by user ID
- Output user count and sample records
- Estimate: 20 minutes

**Task 5: Create User ID Verification Script**
- File: `/scripts/verify-user-ids.js`
- Compare auth flow IDs with database IDs
- Report any format mismatches
- Estimate: 15 minutes

**Task 6: Create QRT Code Query Script**
- File: `/scripts/query-qrt-by-code.js`
- Find individual records by QRT code
- Estimate: 10 minutes

### Phase 3: Error Visibility (Day 2)

**Task 7: Add Success Feedback**
- File: `/app/payment/page.tsx`
- Add console logging for successful QRT creation
- Consider adding toast notification
- Test: Verify feedback appears after payment
- Estimate: 20 minutes

**Task 8: Enhance Empty State Messages**
- File: `/app/requests/page.tsx`
- Add debug info in development mode
- Improve empty state messaging
- Test: Verify messages help users understand what happened
- Estimate: 15 minutes

**Task 9: Create Request Logger Utility**
- File: `/lib/request-logger.ts`
- Centralized logging for all request lifecycle events
- Easy to enable/disable for debugging
- Estimate: 15 minutes

### Phase 4: Testing and Verification (Day 2)

**Task 10: Write Integration Tests**
- Test complete QRT request flow with payment
- Verify user can see request in /requests
- Verify filtering logic with multiple users
- Estimate: 1 hour

**Task 11: Manual Testing Checklist**
- Register new user
- Submit QRT request
- Complete payment
- Verify request appears in /requests
- Switch tabs and filters
- Estimate: 30 minutes

**Task 12: Database State Verification**
- Use inspection scripts to verify data
- Check 43 existing records for any anomalies
- Verify all records have proper user_id format
- Estimate: 20 minutes

### Dependency Graph

```
Task 1, 2, 3 (Critical Fixes - must complete first)
    ↓
Task 4, 5, 6 (Inspector Scripts - dependent on #2)
Task 7, 8, 9 (Error Visibility - independent)
    ↓
Task 10, 11, 12 (Testing - dependent on all above)
```

---

## 5. Database Changes

### Required Migrations

**Status**: No mandatory migrations required.

The 43 existing QRT ID records will work correctly once the filtering is fixed.

### Optional: Email Column Addition

If decision is to add email field (Option B from Solution 3):

**Migration**: `add_email_to_qrt_ids.sql`
```sql
ALTER TABLE qrt_ids
ADD COLUMN email VARCHAR(255) DEFAULT NULL;

-- Add index for faster filtering
CREATE INDEX idx_qrt_ids_email ON qrt_ids(email);
```

**Data Migration**: No backfill needed; email is optional for existing records.

### Data Backfill Needs

**No backfill required** for the fix itself. Existing 43 records are correct; they just weren't visible due to filtering bug.

If adding email later, existing records will have NULL email (acceptable).

---

## 6. Testing Strategy

### Unit Tests

**File**: `/lib/qrt-context.test.tsx`

```typescript
describe('getUserQRTIds', () => {
  it('should return empty array when userId is undefined', () => {
    const { result } = renderHook(() => useQRT(), { wrapper: QRTProvider })
    expect(result.current.getUserQRTIds('')).toEqual([])
  })

  it('should filter QRT IDs by userId correctly', () => {
    const mockQrtIds: QRTIDRequest[] = [
      { ...mockQRT, userId: 'user_123', id: '1' },
      { ...mockQRT, userId: 'user_456', id: '2' },
      { ...mockQRT, userId: 'user_123', id: '3' },
    ]

    const { result } = renderHook(() => useQRT(), { wrapper: QRTProvider })
    // Set qrtIds in context...

    const filtered = result.current.getUserQRTIds('user_123')
    expect(filtered).toHaveLength(2)
    expect(filtered.every(q => q.userId === 'user_123')).toBe(true)
  })

  it('should not match if userId format differs', () => {
    const mockQrtIds: QRTIDRequest[] = [
      { ...mockQRT, userId: 'user_123', id: '1' },
    ]

    const filtered = result.current.getUserQRTIds('User_123') // Different case
    expect(filtered).toHaveLength(0) // No match
  })
})
```

### Integration Test Scenarios

**Scenario 1: Complete QRT Request Flow**
1. Register new user (auto-assigns timestamp-based ID)
2. Fill QRT request form
3. Submit form (saves to context with user.id)
4. Proceed to payment
5. Complete payment (adds record to Supabase)
6. Navigate to /requests
7. Verify: QRT request appears in list
8. Verify: Filter tabs work correctly

**Scenario 2: Multiple Users**
1. Create 3 test users with different IDs
2. Each submits QRT request
3. Each completes payment
4. Each user views /requests
5. Verify: Each user only sees their own requests
6. Verify: No cross-user data leakage

**Scenario 3: Loading State Handling**
1. Slow network simulation (DevTools)
2. Load /requests page
3. Verify: Loading spinner appears
4. Verify: No errors in console
5. Verify: Requests appear correctly after loading

**Scenario 4: Empty State**
1. New user with no requests
2. Load /requests
3. Verify: "No requests found" message appears
4. Verify: Helpful action buttons are present
5. Verify: Dev mode debug info displays (if enabled)

### Manual Testing Checklist

- [ ] Register new user account
- [ ] Fill QRT request form completely
- [ ] Submit form without errors
- [ ] Navigate to payment
- [ ] Submit payment (all 3 methods: GCash, Maya, Bank)
- [ ] See success feedback
- [ ] Navigate to /requests
- [ ] QRT request appears in list
- [ ] Click on QRT request details
- [ ] Verify all data correct
- [ ] Switch to "QRT IDs" tab
- [ ] Filter by "Processing"
- [ ] Filter by "Completed"
- [ ] Go back to "All"
- [ ] Check console for error messages
- [ ] Test logout and login with different user
- [ ] Verify previous user's requests don't appear

### Verification Queries

**Using inspection scripts**:

```bash
# Check all QRT IDs for a specific user
node scripts/qrt-id-inspector.js user_1767563860928

# Verify all user IDs in database have consistent format
node scripts/verify-user-ids.js

# Query specific QRT code
node scripts/query-qrt-by-code.js QRT-2025-123456

# Check database schema
node scripts/inspect-supabase-schema.js
```

---

## 7. Rollout Plan

### Deployment Sequence

**Stage 1: Development Testing** (30 minutes)
- Run manual testing checklist
- Verify no console errors
- Check database state with inspector scripts
- Verify existing 43 records are retrievable

**Stage 2: Staging Deployment** (15 minutes)
- Deploy to staging environment
- Test with staging database
- Verify integration tests pass
- Smoke test payment flow

**Stage 3: Production Deployment** (15 minutes)
- Deploy to production
- Monitor error logs
- Verify users can see requests
- Monitor database queries for anomalies

### User Communication

**Before Deployment**:
- No user communication needed (bug fix, not feature)

**After Deployment** (optional):
- In-app notification: "We've fixed an issue where your QRT ID requests weren't displaying. You can now view them in your requests."

### Monitoring Approach

**Metrics to Track**:
1. `/requests` page load time
2. Number of QRT IDs shown per user
3. Filter button interactions
4. Error rates in qrt-context
5. Database query times

**Error Monitoring**:
- Watch for undefined userId in console
- Monitor `getUserQRTIds` function calls
- Track any format mismatch warnings

**Success Indicators**:
- Users report seeing their QRT requests
- No 404 or undefined errors in console
- `/requests` page loads consistently
- Filter operations work instantly

---

## 8. Success Metrics

### Primary Success Criteria

**Criteria**: Users can see their QRT ID requests in /requests

**Verification**:
1. Create new QRT request through form
2. Complete payment with any method
3. Navigate to /requests
4. Verify QRT request appears in list within 5 seconds
5. Click on request to view details
6. Verify all data matches what was submitted

**Acceptance**: Passing for 5 consecutive test users

### Secondary Success Criteria

**Criteria**: Developers can inspect database without MCP authentication

**Verification**:
```bash
# Should work without localhost OAuth flow
node scripts/inspect-supabase-schema.js
# Should show table structure and record counts

node scripts/qrt-id-inspector.js user_123
# Should show all QRT IDs for that user
```

**Acceptance**: All scripts return data within 10 seconds

### Tertiary Success Criteria

**Criteria**: Future similar issues debuggable in <5 minutes

**Verification**:
1. Introduce artificial bug (e.g., change user ID format)
2. Try to debug using scripts and console logs
3. Measure time to identify root cause
4. Should complete in under 5 minutes

**Acceptance**: Debug time ≤ 5 minutes

---

## 9. Documentation Updates

### README Updates

**File**: `/README.md` - Add section:

```markdown
## QRT ID Debugging

If users report not seeing their QRT ID requests:

1. Check browser console for errors (dev mode)
2. Run: `node scripts/verify-user-ids.js`
3. Query specific user: `node scripts/qrt-id-inspector.js [userId]`
4. Look for: User ID format and count of records
5. If zero records but payment succeeded, check `/app/payment/page.tsx` logs

## Direct Supabase Access

To inspect database without MCP authentication:
\`\`\`bash
node scripts/inspect-supabase-schema.js
node scripts/qrt-id-inspector.js [userId]
node scripts/query-qrt-by-code.js [QRT-CODE]
\`\`\`

Note: Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`
```

### Developer Setup Instructions

**File**: `/docs/DEVELOPMENT.md` - Add section:

```markdown
## Environment Variables

Required for QRT inspection scripts:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
```

## QRT Context Debugging

When `/requests` shows empty but user has submitted:

1. Check auth context initialization:
   ```typescript
   // In auth-context.tsx
   console.log('Auth loading:', isLoading, 'User ID:', user?.id)
   ```

2. Check QRT context loading:
   ```typescript
   // In qrt-context.tsx
   console.log('QRT IDs loaded:', qrtIds.length, 'for user:', user?.id)
   ```

3. Check filtering:
   ```typescript
   // In requests/page.tsx
   console.log('Filtered QRT IDs:', myQrtIds.length)
   ```

All three should be non-zero for requests to appear.
```

### Troubleshooting Guide

**File**: `/docs/TROUBLESHOOTING.md` - Add section:

```markdown
## Problem: "No requests found" but user submitted QRT request

### Root Causes and Solutions

1. **Auth context not loaded yet**
   - Symptom: Flash of empty state, then requests appear
   - Solution: Wait 2-3 seconds on `/requests` page
   - Fix: Already implemented (loading state in page)

2. **QRT context loading from Supabase**
   - Symptom: Page shows empty despite payment success
   - Solution: Check Network tab in DevTools for Supabase queries
   - Wait for all queries to complete

3. **User ID mismatch**
   - Symptom: 43 QRT IDs in database but none appear for user
   - Solution: Run `node scripts/qrt-id-inspector.js [userId]`
   - Check if results match what you expect

4. **Data not saved to Supabase**
   - Symptom: User doesn't see request, no data in database
   - Solution: Check `/app/payment/page.tsx` console logs
   - Look for "QRT ID created" or error messages

### Quick Debug Steps

```bash
# 1. Check user ID format
grep -n "user_" /path/to/request

# 2. Query database directly
node scripts/qrt-id-inspector.js user_[timestamp]

# 3. Check Supabase status
node scripts/inspect-supabase-schema.js
```
```

---

## 10. Future Improvements

### Long-Term Architectural Improvements

1. **User ID Strategy**
   - Current: Timestamp-based IDs (`user_[timestamp]`)
   - Future: Move to Supabase auth native user IDs
   - Benefit: Better integration with PostgreSQL row-level security

2. **Schema Consolidation**
   - Current: Separate TypeScript interfaces and database columns
   - Future: Generate TypeScript from database schema (e.g., Drizzle ORM)
   - Benefit: Prevent email field mismatch issues automatically

3. **Request Status Tracking**
   - Current: Simple status enum
   - Future: Event-based status with timestamps
   - Benefit: Audit trail of when request was submitted, paid, processed

4. **Real-time Updates**
   - Current: Manual page refresh
   - Future: Supabase realtime subscriptions on qrt_ids table
   - Benefit: Instant visibility of status changes

### Technical Debt to Address

1. **Payment Flow Complexity**
   - Current: 150+ lines of QRT ID generation in payment page
   - Future: Extract to separate service/hook
   - Benefit: More testable, reusable code

2. **Error Handling**
   - Current: Silent failures with fallback to local state
   - Future: Structured error logging with user feedback
   - Benefit: Better debugging and user experience

3. **Testing Coverage**
   - Current: Manual testing focused
   - Future: Automated integration tests for full flow
   - Benefit: Prevent regressions, faster QA

4. **Supabase MCP Plugin**
   - Current: Disabled due to OAuth issues
   - Future: Proper configuration or replacement
   - Benefit: Schema introspection without scripts

5. **Database Indexing**
   - Current: No indexes for user_id filtering
   - Future: Add index on user_id column
   - Benefit: Better query performance at scale

### Recommended Next Steps (Priority Order)

1. **Move to Supabase Auth** (High Impact)
   - Integrate with Supabase native authentication
   - Replace timestamp-based IDs with real auth user IDs
   - Simplifies all matching logic
   - Timeline: 2-3 days

2. **Extract Payment Service** (Medium Impact)
   - Move QRT ID generation to separate service
   - Make easier to test and reuse
   - Timeline: 1-2 days

3. **Add Realtime Updates** (Medium Impact)
   - Supabase realtime subscriptions
   - Shows status changes immediately
   - Timeline: 1 day

4. **Improve Type Safety** (Low Impact)
   - Generate types from database schema
   - Prevents future field mismatches
   - Timeline: 2-3 days

5. **Complete Test Suite** (Medium Impact)
   - Full integration test coverage
   - Prevents regression bugs
   - Timeline: 1-2 days

---

## Implementation Notes for Development

### Code Quality Standards

- Use existing logging patterns (console.log with [prefix])
- Add JSDoc comments for new utility functions
- Keep console debug logs behind `process.env.NODE_ENV === 'development'`
- Follow existing TypeScript patterns (strict mode)

### Git Commit Strategy

**Suggested commits**:
1. `fix: improve /requests page loading state for QRT IDs`
2. `fix: add user ID validation in QRT context filtering`
3. `fix: remove email field mismatch from QRT ID schema`
4. `feat: add QRT ID inspection scripts for debugging`
5. `feat: enhance empty state with debug info for developers`

### Testing Before Merge

- [ ] Run existing test suite
- [ ] Manual test checklist (all 12 items)
- [ ] Verify no console errors in production build
- [ ] Check Database with inspection scripts
- [ ] Test with at least 2 different users

### Rollback Plan

If issues arise in production:

1. **Quick rollback**: Revert commit #1 (loading state fix)
2. **Mid-level rollback**: Revert commits #1-3 (all fixes)
3. **Full rollback**: Revert all commits, restore from backup

Keep git history clean; don't force push to main.

---

## Appendix: Existing Investigation Results

### Database Schema Summary

```
Table: qrt_ids
- 32 columns total
- No email column (despite code expecting it)
- All 43 records have status="ready"
- All user_id follow "user_[timestamp]" pattern
- Sample user_ids: user_1767563860928, user_1767563860929, etc.
```

### Code Flow Diagram

```
Registration
└─> user.id = `user_${Date.now()}` (e.g., user_1767563860928)
    └─> Stored in localStorage and auth-context

QRT Request Form
└─> Reads user.id from auth-context
    └─> Passes to qrtRequest.userId

Payment Page
└─> Reads qrtRequest.userId
    └─> Creates newQRTRecord with userId
        └─> Saves to Supabase via addQRTRequest()

/requests Page
└─> Reads user.id from auth-context
    └─> Calls getUserQRTIds(user.id)
        └─> Filters context.qrtIds by userId
            └─> Shows matching records to user
```

### Known Working References

- Certificate filtering: `/lib/certificate-context.tsx` - Same pattern, works correctly
- Auth context: `/lib/auth-context.tsx` - Already handles localStorage correctly
- Payment integration: `/lib/payment-utils.ts` - Processes payment correctly
- Database persistence: 43 QRT records successfully saved

---

**Specification Created**: 2026-01-05
**Status**: Ready for Implementation
**Estimated Total Effort**: 2-3 days development + testing
