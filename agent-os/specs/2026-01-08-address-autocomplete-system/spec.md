# Philippine Address Autocomplete System - Specification

**Status:** PLANNED
**Date Created:** 2026-01-08
**Version:** 1.0
**Feature Type:** Enhancement - Form UX Improvement

---

## 1. Overview

### 1.1 Purpose

This specification defines the implementation of a cascading address autocomplete system for the resident registration form in the Barangay Link OD application. The system will replace free-text address input fields with intelligent dropdown/combobox components that provide autocomplete suggestions while maintaining the flexibility for users to enter custom addresses when needed.

### 1.2 Goals

- **Improve User Experience:** Reduce typing effort and errors through autocomplete suggestions
- **Data Standardization:** Encourage consistent address formatting across the database
- **ZIP Code Automation:** Automatically populate ZIP codes based on selected city/municipality
- **OCR Enhancement:** Improve address matching accuracy from scanned Philippine IDs
- **Performance:** Maintain zero client-side bundle impact by keeping all data server-side
- **Flexibility:** Allow custom input for addresses not found in the database

### 1.3 Background

The current registration form at `/app/register/page.tsx` uses seven free-text input fields for addresses:
- House/Lot No.
- Street
- Purok
- Barangay (required)
- City/Municipality (required)
- Province
- ZIP Code

The existing OCR system (`/app/api/ocr/route.ts`) extracts addresses from Philippine National IDs and Driver's Licenses using Azure Computer Vision API. However, OCR-extracted addresses often contain inconsistencies (e.g., "MABALACAT CITY" vs "Mabalacat", all caps vs title case) that could be normalized through database matching.

### 1.4 Success Criteria

- Users can select Province, City/Municipality, and Barangay from searchable dropdowns
- ZIP codes auto-fill when a city/municipality is selected
- OCR-scanned addresses are automatically matched to standardized database entries
- Users can still enter custom addresses if their location is not in the database
- Search queries return results in under 200ms
- No significant client bundle size increase (< 10 KB)

---

## 2. Requirements

### 2.1 Functional Requirements

#### FR-1: Address Database
- **FR-1.1:** System must store Philippine Standard Geographic Code (PSGC) data for provinces, cities/municipalities, and barangays
- **FR-1.2:** Database must include ZIP codes for cities/municipalities
- **FR-1.3:** Data must support fuzzy text search for address matching
- **FR-1.4:** System must track approximately 82 provinces, 1,634 cities/municipalities, and 42,000 barangays

#### FR-2: API Endpoints
- **FR-2.1:** Provide `/api/address/provinces` endpoint for province search
- **FR-2.2:** Provide `/api/address/cities` endpoint for city/municipality search with optional province filtering
- **FR-2.3:** Provide `/api/address/barangays` endpoint for barangay search with required city filtering
- **FR-2.4:** All endpoints must support search query parameter for filtering results
- **FR-2.5:** Results must be limited to 20 items per query

#### FR-3: Frontend Components
- **FR-3.1:** Create reusable `AddressCombobox` component supporting three types: province, city, barangay
- **FR-3.2:** Component must support cascading selection (Province → City → Barangay)
- **FR-3.3:** Component must provide "Enter manually" fallback for custom input
- **FR-3.4:** Component must visually indicate OCR-scanned fields with green highlight
- **FR-3.5:** Component must support disabled state and required field validation

#### FR-4: OCR Integration
- **FR-4.1:** System must perform fuzzy matching on OCR-extracted addresses against database
- **FR-4.2:** Matched addresses must be pre-selected in combobox components
- **FR-4.3:** Unmatched addresses must fall back to original OCR text
- **FR-4.4:** ZIP codes from matched cities should override OCR-extracted ZIP codes

#### FR-5: User Interactions
- **FR-5.1:** Selecting a province must enable city dropdown and filter cities by province
- **FR-5.2:** Selecting a city must enable barangay dropdown, filter barangays by city, and auto-fill ZIP code
- **FR-5.3:** Changing province must clear city and barangay selections
- **FR-5.4:** Changing city must clear barangay selection
- **FR-5.5:** Users can toggle between autocomplete and manual input modes

### 2.2 Non-Functional Requirements

#### NFR-1: Performance
- **NFR-1.1:** API response time must be under 200ms for search queries
- **NFR-1.2:** Initial page load time must not increase by more than 100ms
- **NFR-1.3:** Database queries must use indexes for optimal search performance
- **NFR-1.4:** API routes must use Edge runtime for faster responses
- **NFR-1.5:** Search input must be debounced to prevent excessive API calls

#### NFR-2: Scalability
- **NFR-2.1:** Database must handle 42,000+ barangay records efficiently
- **NFR-2.2:** System must support concurrent searches from multiple users
- **NFR-2.3:** API routes must implement caching (1-hour revalidation)

#### NFR-3: Data Quality
- **NFR-3.1:** Address data must be sourced from official PSGC Cloud API
- **NFR-3.2:** Data seeding script must handle API failures gracefully
- **NFR-3.3:** Fuzzy search must use PostgreSQL trigram indexes for accuracy

#### NFR-4: User Experience
- **NFR-4.1:** Keyboard navigation must be fully supported in combobox components
- **NFR-4.2:** Components must be mobile-responsive
- **NFR-4.3:** Loading states must be clearly indicated
- **NFR-4.4:** Error states must provide helpful feedback

#### NFR-5: Maintainability
- **NFR-5.1:** Code must follow existing TypeScript and React patterns in the codebase
- **NFR-5.2:** Database schema must include timestamps for auditing
- **NFR-5.3:** Seeding script must be idempotent (safe to run multiple times)

---

## 3. Technical Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /app/register/page.tsx                              │  │
│  │  - Form state management                              │  │
│  │  - OCR scanner integration                            │  │
│  │  - Address component orchestration                    │  │
│  └─────────────────┬────────────────────────────────────┘  │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────────────┐  │
│  │  AddressCombobox Component                           │  │
│  │  - Search input with debouncing                       │  │
│  │  - Dropdown with results                              │  │
│  │  - Manual input fallback                              │  │
│  │  - OCR highlight styling                              │  │
│  └─────────────────┬────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────┘
                     │ fetch()
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    API Layer (Edge Runtime)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/address/provinces                              │  │
│  │  /api/address/cities?province_code=XXX               │  │
│  │  /api/address/barangays?city_code=XXX                │  │
│  └─────────────────┬────────────────────────────────────┘  │
│                    │ Supabase Client                         │
└────────────────────┼────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Database Layer (Supabase)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  address_provinces (82 records)                      │  │
│  │  - code, name, region_code                           │  │
│  │  - GIN trigram index on name                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  address_cities (1,634 records)                      │  │
│  │  - code, name, province_code, zip_code, type         │  │
│  │  - GIN trigram index on name                         │  │
│  │  - B-tree index on province_code                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  address_barangays (42,000+ records)                 │  │
│  │  - code, name, city_code                             │  │
│  │  - GIN trigram index on name                         │  │
│  │  - B-tree index on city_code                         │  │
│  │  - Composite index on (city_code, name)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Data Seeding (One-time)
┌─────────────────────────────────────────────────────────────┐
│  scripts/seed-addresses.ts                                   │
│  ├─► PSGC Cloud API (https://psgc.cloud/api/provinces)      │
│  ├─► Batch insert provinces (82)                            │
│  ├─► Batch insert cities (1,634)                            │
│  └─► Batch insert barangays (42,000+) in chunks of 1,000    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Database Schema

```sql
-- Enable PostgreSQL trigram extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Provinces table (82 records)
CREATE TABLE IF NOT EXISTS public.address_provinces (
  code VARCHAR(9) PRIMARY KEY,           -- PSGC code (e.g., "0345" for Pampanga)
  name VARCHAR(255) NOT NULL,             -- Province name (e.g., "Pampanga")
  region_code VARCHAR(9),                 -- Region code (e.g., "03" for Central Luzon)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX idx_provinces_name_trgm ON address_provinces USING gin (name gin_trgm_ops);
CREATE INDEX idx_provinces_name ON address_provinces (name);

-- Cities/Municipalities table (1,634 records)
CREATE TABLE IF NOT EXISTS public.address_cities (
  code VARCHAR(9) PRIMARY KEY,           -- PSGC code (e.g., "034502" for Mabalacat)
  name VARCHAR(255) NOT NULL,             -- City/Municipality name (e.g., "Mabalacat")
  province_code VARCHAR(9) REFERENCES address_provinces(code),
  zip_code VARCHAR(4),                    -- ZIP code (e.g., "2010")
  type VARCHAR(20),                       -- "City" or "Municipality"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search and filtering
CREATE INDEX idx_cities_province ON address_cities (province_code);
CREATE INDEX idx_cities_name_trgm ON address_cities USING gin (name gin_trgm_ops);
CREATE INDEX idx_cities_name ON address_cities (name);

-- Barangays table (42,000+ records)
CREATE TABLE IF NOT EXISTS public.address_barangays (
  code VARCHAR(12) PRIMARY KEY,          -- PSGC code (e.g., "034502001")
  name VARCHAR(255) NOT NULL,             -- Barangay name (e.g., "Atlu-Bola")
  city_code VARCHAR(9) REFERENCES address_cities(code),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search and filtering
CREATE INDEX idx_barangays_city ON address_barangays (city_code);
CREATE INDEX idx_barangays_name_trgm ON address_barangays USING gin (name gin_trgm_ops);
CREATE INDEX idx_barangays_city_name ON address_barangays (city_code, name);

-- Sync tracking table for data management
CREATE TABLE IF NOT EXISTS public.address_sync_log (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,      -- "provinces", "cities", "barangays"
  records_synced INTEGER NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Storage Estimate:** ~26 MB total (negligible for PostgreSQL)

### 3.3 API Design

#### 3.3.1 GET /api/address/provinces

**Purpose:** Search and retrieve provinces

**Query Parameters:**
- `search` (optional): Search term for filtering (e.g., "pamp")

**Response:**
```json
{
  "provinces": [
    {
      "code": "0345",
      "name": "Pampanga"
    }
  ]
}
```

**Performance:**
- Edge runtime
- 1-hour cache revalidation
- Limit: 20 results
- Expected response time: < 50ms

#### 3.3.2 GET /api/address/cities

**Purpose:** Search and retrieve cities/municipalities

**Query Parameters:**
- `search` (optional): Search term for filtering (e.g., "mabala")
- `province_code` (optional): Filter cities by province (e.g., "0345")

**Response:**
```json
{
  "cities": [
    {
      "code": "034502",
      "name": "Mabalacat",
      "zip_code": "2010"
    }
  ]
}
```

**Performance:**
- Edge runtime
- 1-hour cache revalidation
- Limit: 20 results
- Expected response time: < 100ms

#### 3.3.3 GET /api/address/barangays

**Purpose:** Search and retrieve barangays within a city

**Query Parameters:**
- `city_code` (required): City/municipality code (e.g., "034502")
- `search` (optional): Search term for filtering (e.g., "atlu")

**Response:**
```json
{
  "barangays": [
    {
      "code": "034502001",
      "name": "Atlu-Bola"
    }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "city_code parameter is required"
}
```

**Performance:**
- Edge runtime
- 1-hour cache revalidation
- Limit: 20 results
- Expected response time: < 150ms (larger dataset)

### 3.4 Component Architecture

#### AddressCombobox Component

**Props Interface:**
```typescript
interface AddressComboboxProps {
  value: string                           // Current selected value
  onValueChange: (value: string, zipCode?: string) => void  // Callback on selection
  placeholder: string                     // Placeholder text
  type: "province" | "city" | "barangay" // Component type
  parentCode?: string                     // For cascading (province code or city code)
  wasScanned?: boolean                    // OCR highlight flag
  disabled?: boolean                      // Disable state
  required?: boolean                      // Required field flag
}
```

**State Management:**
```typescript
const [open, setOpen] = useState(false)              // Dropdown open state
const [options, setOptions] = useState<AddressOption[]>([])  // Search results
const [loading, setLoading] = useState(false)        // Loading indicator
const [search, setSearch] = useState("")             // Search query (debounced)
const [customMode, setCustomMode] = useState(false)  // Manual input mode
```

**Behavior:**
- Fetches options from API when opened or search changes
- Debounces search input (300ms) to prevent excessive API calls
- Filters by parent code for cascading (cities by province, barangays by city)
- Provides toggle to switch between autocomplete and manual text input
- Applies green highlight styling when `wasScanned={true}`
- Shows loading spinner while fetching results
- Keyboard navigation using cmdk library

---

## 4. User Experience

### 4.1 User Flow - New Registration

**Scenario 1: Manual Address Entry**

1. User navigates to `/register`
2. User fills in personal information
3. User clicks **Province** combobox → Dropdown opens with full province list
4. User types "pamp" → List filters to show "Pampanga"
5. User selects "Pampanga" → Province field populated, City dropdown enabled
6. User clicks **City/Municipality** combobox → Shows only Pampanga cities
7. User types "mabala" → Filters to "Mabalacat"
8. User selects "Mabalacat" → City field populated, ZIP auto-fills "2010", Barangay dropdown enabled
9. User clicks **Barangay** combobox → Shows only Mabalacat barangays
10. User types "atlu" → Filters to barangays starting with "Atlu"
11. User selects "Atlu-Bola" → Barangay field populated
12. User continues with other form fields

**Scenario 2: OCR-Assisted Entry**

1. User navigates to `/register`
2. User clicks **Scan ID** button
3. User captures Driver's License photo
4. OCR extracts: "18 NATIONAL HIGHWAY, ILWAS, SUBIC, ZAMBALES"
5. System performs fuzzy matching:
   - "SUBIC" → Matched to "Subic" (City)
   - "ZAMBALES" → Matched to "Zambales" (Province)
   - ZIP code "2209" auto-filled from Subic city data
6. Form fields auto-populate with green highlights:
   - Province: "Zambales" (green highlight)
   - City: "Subic" (green highlight)
   - ZIP: "2209" (green highlight)
   - Barangay: Empty (not in OCR)
7. User manually selects Barangay "Ilwas" from dropdown
8. User reviews and submits form

**Scenario 3: Custom Address (Not in Database)**

1. User navigates to `/register`
2. User selects Province "Pampanga" and City "Mabalacat" from dropdowns
3. User clicks **Barangay** combobox, types "New Barangay XYZ"
4. No results found in dropdown
5. User clicks **"Can't find your barangay? Enter manually"**
6. Combobox switches to text input mode
7. User types "New Barangay XYZ" manually
8. User can click **"Switch back to suggestions"** to return to autocomplete mode
9. User continues with form submission

### 4.2 Visual Design

**Normal State:**
- Standard input styling with dropdown chevron icon
- Placeholder text in gray
- Hover: Subtle border highlight

**Focused/Open State:**
- Border color changes to emerald
- Dropdown panel appears below input
- Search field at top of dropdown
- Results list with scroll (max 20 items)
- Keyboard navigation highlights items

**OCR-Scanned State:**
- Border: `border-emerald-300`
- Background: `bg-emerald-50/50`
- Visual indicator that value was auto-filled from ID scan

**Disabled State:**
- Grayed out appearance
- No interaction
- Used when parent selection is required (e.g., Barangay disabled until City is selected)

**Loading State:**
- Spinner icon inside dropdown
- "Loading..." text centered

**Empty State:**
- "No results found." message
- Link to switch to manual input mode

**Custom Input Mode:**
- Standard text input field
- Helper text: "Switch back to suggestions" link below field

### 4.3 Accessibility

- **Keyboard Navigation:** Full support for Tab, Enter, Escape, Arrow keys
- **Screen Readers:** Proper ARIA labels and roles via cmdk library
- **Focus Management:** Clear focus indicators, logical tab order
- **Mobile:** Touch-friendly tap targets (minimum 44px height)

---

## 5. Integration Points

### 5.1 Registration Form Integration

**File:** `/app/register/page.tsx`

**Changes Required:**

1. **Import Component:**
```typescript
import { AddressCombobox } from "@/components/address-combobox"
```

2. **Add State for Codes (Cascading):**
```typescript
const [provinceCode, setProvinceCode] = useState<string>("")
const [cityCode, setCityCode] = useState<string>("")
```

3. **Track OCR Scanned Fields:**
```typescript
// Change from boolean to object
const [wasScanned, setWasScanned] = useState({
  province: false,
  cityMunicipality: false,
  barangay: false,
  zipCode: false,
  // ... other fields
})
```

4. **Replace Province Input:**
```typescript
<AddressCombobox
  type="province"
  value={formData.province}
  onValueChange={(value) => {
    setFormData((prev) => ({
      ...prev,
      province: value,
      cityMunicipality: "",  // Clear dependent fields
      barangay: "",
      zipCode: "",
    }))
    // Store province code for filtering cities (requires additional API call or state)
  }}
  placeholder="Select province"
  wasScanned={wasScanned.province}
/>
```

5. **Replace City/Municipality Input:**
```typescript
<AddressCombobox
  type="city"
  value={formData.cityMunicipality}
  onValueChange={(value, zipCode) => {
    setFormData((prev) => ({
      ...prev,
      cityMunicipality: value,
      zipCode: zipCode || prev.zipCode,  // Auto-fill ZIP
      barangay: "",  // Clear dependent field
    }))
  }}
  placeholder="Select city/municipality"
  parentCode={provinceCode}
  wasScanned={wasScanned.cityMunicipality}
  required
/>
```

6. **Replace Barangay Input:**
```typescript
<AddressCombobox
  type="barangay"
  value={formData.barangay}
  onValueChange={(value) => {
    setFormData((prev) => ({
      ...prev,
      barangay: value,
    }))
  }}
  placeholder="Select barangay"
  parentCode={cityCode}
  wasScanned={wasScanned.barangay}
  required
  disabled={!formData.cityMunicipality}  // Require city first
/>
```

7. **Add ZIP Auto-fill Indicator:**
```typescript
<Input
  id="zipCode"
  value={formData.zipCode}
  onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
  placeholder="Auto-filled from city"
  className={wasScanned.zipCode ? inputScannedClass : ""}
/>
<p className="text-xs text-gray-500 mt-1">
  ZIP code is automatically filled when you select a city
</p>
```

### 5.2 OCR Integration

**File:** `/app/api/ocr/route.ts` (No changes required here)

**New File:** `/lib/address-matcher.ts`

**Purpose:** Fuzzy match OCR-extracted addresses against database

```typescript
interface FuzzyMatchResult {
  province: { code: string; name: string } | null
  city: { code: string; name: string; zip_code: string } | null
  barangay: { code: string; name: string } | null
}

export async function fuzzyMatchAddresses(input: {
  province?: string
  city?: string
  barangay?: string
}): Promise<FuzzyMatchResult>
```

**Algorithm:**
1. Search provinces with OCR-extracted province text
2. Take first (best) match and store province code
3. Search cities with OCR-extracted city text, filtered by province code (if found)
4. Take first match and store city code + ZIP code
5. Search barangays with OCR-extracted barangay text, filtered by city code (if found)
6. Take first match
7. Return all matched results or null for unmatched fields

**Integration in Registration Form:**

Update `handleIDDataExtracted` function:

```typescript
const handleIDDataExtracted = async (data: IDData) => {
  // Perform fuzzy matching
  const addressMatches = await fuzzyMatchAddresses({
    province: data.province,
    city: data.cityMunicipality,
    barangay: data.barangay,
  })

  // Update form with matched names (fallback to OCR text if no match)
  setFormData((prev) => ({
    ...prev,
    fullName: data.fullName || prev.fullName,
    birthDate: data.birthDate || prev.birthDate,
    // ... other fields
    province: addressMatches.province?.name || data.province,
    cityMunicipality: addressMatches.city?.name || data.cityMunicipality,
    barangay: addressMatches.barangay?.name || data.barangay,
    zipCode: addressMatches.city?.zip_code || data.zipCode,
  }))

  // Mark scanned fields
  setWasScanned((prev) => ({
    ...prev,
    province: !!data.province,
    cityMunicipality: !!data.cityMunicipality,
    barangay: !!data.barangay,
    zipCode: !!addressMatches.city?.zip_code || !!data.zipCode,
  }))
}
```

---

## 6. Implementation Details

### 6.1 Critical Files

| File Path | Action | Purpose |
|-----------|--------|---------|
| `scripts/006_address_autocomplete.sql` | **Create** | Database schema for address tables |
| `scripts/seed-addresses.ts` | **Create** | One-time data seeding from PSGC Cloud API |
| `app/api/address/provinces/route.ts` | **Create** | Province search API endpoint |
| `app/api/address/cities/route.ts` | **Create** | City search API endpoint |
| `app/api/address/barangays/route.ts` | **Create** | Barangay search API endpoint |
| `components/address-combobox.tsx` | **Create** | Reusable autocomplete combobox component |
| `lib/address-matcher.ts` | **Create** | Fuzzy matching utility for OCR integration |
| `app/register/page.tsx` | **Modify** | Replace Input fields with AddressCombobox |

### 6.2 Data Seeding Process

**File:** `scripts/seed-addresses.ts`

**Data Source:** PSGC Cloud API (https://psgc.cloud)
- Official data from Philippine Statistics Authority (PSA)
- Includes PSGC codes, names, and ZIP codes (v1.1.1+)
- Free and publicly accessible

**Seeding Steps:**

1. **Provinces:** Fetch from `/api/provinces` → Insert 82 records
2. **Cities/Municipalities:** Fetch from `/api/cities-municipalities` → Insert 1,634 records
3. **Barangays:** Fetch from `/api/barangays` → Insert 42,000+ records in batches of 1,000
4. **Logging:** Track sync in `address_sync_log` table

**Execution:**
```bash
npx tsx scripts/seed-addresses.ts
```

**Expected Duration:** 2-3 minutes (mostly for barangays)

**Error Handling:**
- Graceful handling of API timeouts
- Transaction rollback on failures
- Idempotent upsert operations (safe to re-run)

### 6.3 Search Implementation

**Fuzzy Search Strategy:**

Uses PostgreSQL `pg_trgm` extension with GIN indexes:

```sql
-- Prefix match (higher priority)
query.or(`name.ilike.${search}%`)

-- Contains match (fallback)
query.or(`name.ilike.%${search}%`)
```

**Examples:**
- Search "pamp" → Matches "Pampanga" (prefix)
- Search "mabala" → Matches "Mabalacat" (prefix)
- Search "zambales" → Matches "Zambales" (exact)
- Search "atlu" → Matches "Atlu-Bola" (prefix)

**Ranking:** Results are ordered alphabetically, not by relevance score (simple approach)

### 6.4 Cascading Logic

**Province Selection:**
1. User selects province (e.g., "Pampanga")
2. Province code stored in state (requires fetching code from name or storing in component)
3. City/Municipality dropdown enables
4. Barangay and ZIP code clear

**City Selection:**
1. User selects city (e.g., "Mabalacat")
2. City code stored in state
3. ZIP code auto-fills from city data (e.g., "2010")
4. Barangay dropdown enables and filters by city code
5. Barangay clears if previously selected

**Barangay Selection:**
1. User selects barangay (e.g., "Atlu-Bola")
2. No downstream effects
3. Form ready for submission

**Clearing Logic:**
- Changing province clears city, barangay, and ZIP
- Changing city clears barangay only (ZIP updates)
- Independent fields (House/Lot, Street, Purok) are unaffected

### 6.5 Bundle Size Impact

**Client-Side Addition:** +5-8 KB gzipped
- AddressCombobox component: ~3 KB
- cmdk library: Already installed (0 KB)
- Utility functions: ~1 KB
- API fetch logic: ~1 KB

**Server-Side Data:** 0 KB (all data in database)

**Total Impact:** Minimal (<10 KB)

---

## 7. Verification & Testing

### 7.1 Database Verification

**Test Query:**
```sql
-- Check record counts
SELECT 'provinces' as table_name, COUNT(*) as count FROM address_provinces
UNION ALL
SELECT 'cities', COUNT(*) FROM address_cities
UNION ALL
SELECT 'barangays', COUNT(*) FROM address_barangays;

-- Expected:
-- provinces: ~82
-- cities: ~1,634
-- barangays: ~42,000

-- Verify ZIP codes populated
SELECT COUNT(*) FROM address_cities WHERE zip_code IS NOT NULL;
-- Expected: ~1,500+ (some may be missing)

-- Test fuzzy search
SELECT * FROM address_provinces WHERE name ILIKE '%pamp%';
-- Expected: "Pampanga"

-- Test cascading lookup
SELECT c.name, c.zip_code
FROM address_cities c
JOIN address_provinces p ON c.province_code = p.code
WHERE p.name = 'Pampanga';
-- Expected: List of Pampanga cities with ZIP codes
```

### 7.2 API Verification

**Test Commands:**
```bash
# Test province search
curl "http://localhost:3000/api/address/provinces?search=pampanga"
# Expected: { "provinces": [{ "code": "0345", "name": "Pampanga" }] }

# Test city search with province filter
curl "http://localhost:3000/api/address/cities?search=mabalacat&province_code=0345"
# Expected: { "cities": [{ "code": "034502", "name": "Mabalacat", "zip_code": "2010" }] }

# Test barangay search with city filter
curl "http://localhost:3000/api/address/barangays?city_code=034502&search=atlu"
# Expected: { "barangays": [{ "code": "034502001", "name": "Atlu-Bola" }] }

# Test error handling
curl "http://localhost:3000/api/address/barangays?search=test"
# Expected: { "error": "city_code parameter is required" } (400)
```

### 7.3 UI Verification

**Manual Test Cases:**

1. **Basic Autocomplete Flow:**
   - Navigate to `/register`
   - Click Province dropdown → Verify provinces load
   - Type "pamp" → Verify filtering to "Pampanga"
   - Select "Pampanga" → Verify city dropdown enables
   - Click City dropdown → Verify only Pampanga cities shown
   - Select "Mabalacat" → Verify ZIP auto-fills "2010" and barangay enables
   - Click Barangay dropdown → Verify only Mabalacat barangays shown
   - Select a barangay → Verify selection persists

2. **Custom Input Mode:**
   - Click Province dropdown
   - Click "Can't find your province? Enter manually"
   - Verify text input appears
   - Type "Custom Province"
   - Verify value saves
   - Click "Switch back to suggestions"
   - Verify dropdown returns

3. **Cascading Behavior:**
   - Select Province "Pampanga", City "Mabalacat", Barangay "Atlu-Bola"
   - Change Province to "Zambales"
   - Verify City and Barangay clear
   - Verify ZIP code clears

4. **OCR Integration:**
   - Click "Scan ID"
   - Scan Driver's License with address "SUBIC, ZAMBALES"
   - Verify Province field shows "Zambales" with green highlight
   - Verify City field shows "Subic" with green highlight
   - Verify ZIP auto-fills with Subic's ZIP code
   - Verify fields are selectable (not read-only)

5. **Performance:**
   - Open DevTools Network tab
   - Type rapidly in City search field
   - Verify requests are debounced (not every keystroke)
   - Verify API response time < 200ms

6. **Mobile Responsiveness:**
   - Open on mobile device or DevTools mobile emulation
   - Verify dropdown appears correctly
   - Verify touch targets are easy to tap
   - Verify keyboard appears for search input

### 7.4 Edge Case Testing

| Edge Case | Expected Behavior |
|-----------|-------------------|
| No internet during seeding | Script fails gracefully with error message |
| API returns empty results | Show "No results found" in dropdown |
| User types non-existent address | Allow custom input mode |
| OCR extracts "MABALACAT CITY" | Fuzzy matcher finds "Mabalacat" |
| OCR extracts province only | Only province pre-selected, city/barangay empty |
| User selects city without province | City dropdown shows all cities (no filter) |
| ZIP code missing in database | Allow manual ZIP input |
| User changes province mid-form | Dependent fields clear without error |
| Slow network connection | Show loading spinner, prevent double-submit |
| Barangay search returns 25+ results | Limit to 20, show message to narrow search |

### 7.5 Automated Testing (Future)

**Unit Tests:**
- `fuzzyMatchAddresses` function with various input combinations
- AddressCombobox state management

**Integration Tests:**
- API route responses with mocked database
- Form submission with autocompleted addresses

**E2E Tests (Playwright/Cypress):**
- Full registration flow with address autocomplete
- OCR scan → fuzzy match → form fill → submit

---

## 8. Edge Cases & Solutions

### 8.1 Data Quality Issues

**Problem:** OCR extracts "MABALACAT CITY" but database has "Mabalacat"

**Solution:** Fuzzy matching with case-insensitive search normalizes variations
- Search uses `ilike` (case-insensitive)
- Trigram matching handles minor variations
- First match is selected as best guess

**Problem:** ZIP code missing for some cities in PSGC data

**Solution:**
- Leave `zip_code` as nullable field
- Allow users to manually enter ZIP if not auto-filled
- Show placeholder "Enter ZIP code" instead of blank

**Problem:** User's barangay is newly created (not in 2022 PSGC data)

**Solution:**
- "Can't find your barangay?" fallback to manual input
- Form validation still accepts custom barangays
- Future: Admin panel to add missing barangays

### 8.2 User Interaction Issues

**Problem:** Province field is optional but City dropdown requires province for filtering

**Solution:**
- If no province selected, city dropdown shows ALL cities (no filter)
- User can still search and select any city
- After city selection, encourage province selection for data quality

**Problem:** User types faster than API can respond

**Solution:**
- Debounce search input (300ms delay)
- Cancel previous fetch requests when new search starts
- Show loading spinner during fetch

**Problem:** Search returns too many results (e.g., "San" matches 100+ barangays)

**Solution:**
- Limit to 20 results
- Show message: "Showing first 20 results. Type more to narrow down."
- Prefix matches prioritized over contains matches

### 8.3 OCR Integration Issues

**Problem:** OCR fails to extract address fields

**Solution:**
- Fall back to empty fields (user enters manually)
- No error shown to user
- wasScanned flag remains false (no green highlight)

**Problem:** OCR extracts address but fuzzy match fails (too ambiguous)

**Solution:**
- Use original OCR text as-is
- Allow user to correct via autocomplete or manual input
- Log failed matches for data quality review (future)

**Problem:** OCR extracts full address as single string (no field separation)

**Solution:**
- Current OCR parser handles this via `parseAddressComponents`
- Fuzzy matcher works with individual components after parsing
- If parsing fails, entire address goes into one field (user corrects)

### 8.4 Performance Issues

**Problem:** 42,000 barangays cause slow initial load

**Solution:**
- Barangay dropdown requires city selection first (filtered query)
- Indexes on `city_code` ensure fast filtering
- Edge runtime with 1-hour cache reduces database load

**Problem:** Multiple users seeding database simultaneously

**Solution:**
- Seeding script uses upsert (`ON CONFLICT DO UPDATE`)
- Database handles concurrent writes safely
- Seeding is one-time operation (not user-facing)

### 8.5 Security & Data Integrity

**Problem:** Malicious user could inject SQL via search parameter

**Solution:**
- Supabase client auto-escapes parameters
- Search uses parameterized queries (`ilike` operator)
- No raw SQL concatenation

**Problem:** User could bypass required fields by switching to custom input

**Solution:**
- Custom input mode still respects `required` prop
- Form validation checks required fields before submission
- Empty required fields trigger error message

---

## 9. Future Enhancements (Out of Scope)

### 9.1 Admin Features

- **Admin Panel:** CRUD interface for adding/editing addresses
- **Sync Button:** Manual trigger to refresh data from PSGC Cloud API
- **Audit Log:** Track user-submitted custom addresses for review
- **Data Quality Dashboard:** Report missing ZIP codes, duplicate entries

### 9.2 Advanced Features

- **Historical Addresses:** Track when residents move to new addresses
- **Geolocation Pre-fill:** Detect user's location and pre-select province/city
- **Address Validation:** Integrate with PHLPost API for official ZIP code validation
- **Smart OCR:** Machine learning to improve OCR accuracy over time
- **Multi-language:** Support for regional languages (Tagalog, Cebuano, etc.)

### 9.3 Performance Optimizations

- **Client-side Caching:** Cache recent searches in localStorage
- **Prefetching:** Pre-load common cities/provinces on page load
- **Service Worker:** Offline support for previously searched addresses

### 9.4 Analytics

- **Usage Tracking:** Most commonly selected addresses
- **OCR Accuracy:** Success rate of fuzzy matching
- **User Behavior:** How often users switch to manual input mode

---

## 10. Implementation Checklist

### Phase 1: Database Setup (Est. 1 hour)

- [ ] Create migration file `scripts/006_address_autocomplete.sql`
- [ ] Run migration to create tables and indexes
- [ ] Verify tables created in Supabase dashboard
- [ ] Create seed script `scripts/seed-addresses.ts`
- [ ] Test seed script locally (may take 2-3 minutes)
- [ ] Verify data populated (82 provinces, 1,634 cities, 42,000+ barangays)
- [ ] Verify ZIP codes present in cities table

### Phase 2: Backend APIs (Est. 2 hours)

- [ ] Create `app/api/address/provinces/route.ts`
- [ ] Test provinces endpoint with curl/Postman
- [ ] Verify Edge runtime and caching headers
- [ ] Create `app/api/address/cities/route.ts`
- [ ] Test cities endpoint with province filter
- [ ] Create `app/api/address/barangays/route.ts`
- [ ] Test barangays endpoint with city filter
- [ ] Verify error handling for missing parameters
- [ ] Test search performance (< 200ms)

### Phase 3: Frontend Component (Est. 3 hours)

- [ ] Install shadcn command component: `npx shadcn@latest add command`
- [ ] Create `components/address-combobox.tsx`
- [ ] Implement basic autocomplete with cmdk
- [ ] Add search debouncing (300ms)
- [ ] Add loading and empty states
- [ ] Implement custom input mode toggle
- [ ] Add OCR highlight styling (`wasScanned` prop)
- [ ] Test keyboard navigation
- [ ] Test mobile responsiveness
- [ ] Add TypeScript types for AddressOption

### Phase 4: Form Integration (Est. 2 hours)

- [ ] Update `app/register/page.tsx` imports
- [ ] Add state for `provinceCode` and `cityCode`
- [ ] Convert `wasScanned` from boolean to object
- [ ] Replace Province input with AddressCombobox
- [ ] Replace City/Municipality input with AddressCombobox
- [ ] Replace Barangay input with AddressCombobox
- [ ] Add ZIP auto-fill logic
- [ ] Update ZIP field with helper text
- [ ] Implement cascading clear logic
- [ ] Test full form flow manually

### Phase 5: OCR Integration (Est. 2 hours)

- [ ] Create `lib/address-matcher.ts`
- [ ] Implement `fuzzyMatchAddresses` function
- [ ] Test fuzzy matching with sample OCR data
- [ ] Update `handleIDDataExtracted` in registration form
- [ ] Test with National ID scan
- [ ] Test with Driver's License scan
- [ ] Verify green highlights appear on matched fields
- [ ] Test fallback to OCR text when no match found

### Phase 6: Testing & Polish (Est. 2 hours)

- [ ] Run all verification tests from Section 7
- [ ] Test all edge cases from Section 8
- [ ] Fix any bugs discovered during testing
- [ ] Add error boundaries for component failures
- [ ] Optimize bundle size (verify < 10 KB increase)
- [ ] Add console logging for debugging (development only)
- [ ] Update form validation to handle custom inputs
- [ ] Test with slow network (throttle in DevTools)
- [ ] Final code review and cleanup

---

## 11. Dependencies

### 11.1 External Dependencies

**Already Installed:**
- `cmdk` - Command palette/combobox library
- `@supabase/supabase-js` - Database client
- `next` - Framework (App Router)
- `react` - UI library
- `@radix-ui/react-*` - shadcn/ui primitives

**New Dependencies:**
- None (all required libraries already installed)

### 11.2 shadcn/ui Components

**Already Installed:**
- Button, Card, Input, Label, Checkbox, Select
- Popover (for combobox dropdown)

**To Install:**
```bash
npx shadcn@latest add command
```

### 11.3 External APIs

**PSGC Cloud API:**
- Base URL: `https://psgc.cloud/api`
- Endpoints:
  - `/provinces` - List all provinces
  - `/cities-municipalities` - List all cities/municipalities
  - `/barangays` - List all barangays
- Rate Limit: Unknown (use responsibly)
- Free tier: Yes
- Authentication: Not required

---

## 12. Rollback Plan

If critical issues arise during or after deployment:

### 12.1 Quick Rollback (Keep Database)

1. Revert `app/register/page.tsx` to use Input fields instead of AddressCombobox
2. Remove AddressCombobox imports
3. Keep database tables (no harm in keeping data)
4. Remove API routes (or leave inactive)

**Impact:** Registration form returns to original free-text input mode

### 12.2 Full Rollback (Remove Everything)

1. Drop database tables:
```sql
DROP TABLE IF EXISTS address_barangays;
DROP TABLE IF EXISTS address_cities;
DROP TABLE IF EXISTS address_provinces;
DROP TABLE IF EXISTS address_sync_log;
```

2. Delete files:
- `components/address-combobox.tsx`
- `lib/address-matcher.ts`
- `app/api/address/provinces/route.ts`
- `app/api/address/cities/route.ts`
- `app/api/address/barangays/route.ts`
- `scripts/seed-addresses.ts`
- `scripts/006_address_autocomplete.sql`

3. Revert changes to `app/register/page.tsx`

**Impact:** Complete removal of address autocomplete feature

---

## 13. Success Metrics

### 13.1 Technical Metrics

- [ ] API response time consistently under 200ms
- [ ] Page load time increase under 100ms
- [ ] Bundle size increase under 10 KB
- [ ] Zero database query errors in production
- [ ] 99%+ uptime for address API routes

### 13.2 User Experience Metrics

- [ ] 70%+ of registrations use autocomplete (not manual input)
- [ ] 80%+ of OCR scans result in successful address fuzzy matching
- [ ] Reduction in address typos/inconsistencies in database
- [ ] Positive user feedback on registration flow

### 13.3 Data Quality Metrics

- [ ] 90%+ of addresses match PSGC standard format
- [ ] 95%+ of registrations have valid ZIP codes
- [ ] Reduction in duplicate/misspelled barangay names
- [ ] Increase in completed address fields (especially province)

---

## 14. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | Claude Sonnet 4.5 | Initial specification document |

---

## 15. Appendix

### 15.1 PSGC Data Structure

**Philippine Standard Geographic Code (PSGC):**
- Official coding system by PSA for Philippine geographic areas
- Hierarchical structure: Region → Province → City/Municipality → Barangay
- Updated quarterly by PSA
- Used by government agencies for statistical reporting

**Code Format:**
- Province: 4 digits (e.g., "0345" for Pampanga)
- City: 6 digits (e.g., "034502" for Mabalacat)
- Barangay: 9-12 digits (e.g., "034502001" for Atlu-Bola)

### 15.2 Philippine ZIP Code System

**ZIP Code Format:**
- 4 digits (e.g., "2010" for Mabalacat)
- Assigned by PHLPost (Philippine Postal Corporation)
- One ZIP code per city/municipality (some cities have multiple)
- Not all cities have ZIP codes in PSGC data (some missing)

**Coverage:**
- Range: 0400 (NCR) to 9811 (Tawi-Tawi)
- Total: ~2,000 ZIP codes nationwide

### 15.3 Sample Data

**Province:**
```json
{
  "code": "0345",
  "name": "Pampanga",
  "region_code": "03"
}
```

**City:**
```json
{
  "code": "034502",
  "name": "Mabalacat",
  "province_code": "0345",
  "zip_code": "2010",
  "type": "City"
}
```

**Barangay:**
```json
{
  "code": "034502001",
  "name": "Atlu-Bola",
  "city_code": "034502"
}
```

### 15.4 Technology Stack Summary

- **Frontend:** React 18, Next.js 14 (App Router), TypeScript
- **UI Library:** shadcn/ui (Radix UI primitives), Tailwind CSS
- **Component:** cmdk (Command palette library)
- **Backend:** Next.js API Routes (Edge runtime)
- **Database:** Supabase (PostgreSQL)
- **OCR:** Azure Computer Vision API (Read API v3.1)
- **External API:** PSGC Cloud API (data source)

---

**End of Specification Document**
