# Address Autocomplete System - Architecture

## System Overview

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
│  │  - Search input with debouncing (300ms)              │  │
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
│  │  - 1-hour cache revalidation                         │  │
│  │  - Limit: 20 results                                  │  │
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
│  │  - Composite index on (city_code, name)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables

```sql
-- Enable PostgreSQL trigram extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Provinces table (82 records)
CREATE TABLE IF NOT EXISTS public.address_provinces (
  code VARCHAR(9) PRIMARY KEY,           -- PSGC code (e.g., "035400000" for Pampanga)
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
  code VARCHAR(9) PRIMARY KEY,           -- PSGC code (e.g., "035409000" for Mabalacat)
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
  code VARCHAR(12) PRIMARY KEY,          -- PSGC code (e.g., "035409001")
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

### Index Strategy

1. **GIN Trigram Indexes** - For fuzzy text search (handles typos, partial matches)
2. **B-tree Indexes** - For exact lookups and foreign key relationships
3. **Composite Indexes** - For efficient filtering (e.g., city + name)

## API Design

### GET /api/address/provinces

**Purpose:** Search and retrieve provinces

**Query Parameters:**
- `search` (optional): Search term for filtering (e.g., "pamp")

**Response:**
```json
{
  "provinces": [
    {
      "code": "035400000",
      "name": "Pampanga"
    }
  ]
}
```

**Configuration:**
```typescript
export const runtime = 'edge'      // Edge runtime for speed
export const revalidate = 3600     // 1-hour cache
```

**Performance:** <50ms

---

### GET /api/address/cities

**Purpose:** Search and retrieve cities/municipalities

**Query Parameters:**
- `search` (optional): Search term for filtering (e.g., "mabala")
- `province_code` (optional): Filter cities by province (e.g., "035400000")

**Response:**
```json
{
  "cities": [
    {
      "code": "035409000",
      "name": "Mabalacat City",
      "zip_code": "2010"
    }
  ]
}
```

**Configuration:**
```typescript
export const runtime = 'edge'
export const revalidate = 3600
```

**Performance:** <100ms

---

### GET /api/address/barangays

**Purpose:** Search and retrieve barangays within a city

**Query Parameters:**
- `city_code` (required): City/municipality code (e.g., "035409000")
- `search` (optional): Search term for filtering (e.g., "atlu")

**Response:**
```json
{
  "barangays": [
    {
      "code": "035409001",
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

**Configuration:**
```typescript
export const runtime = 'edge'
export const revalidate = 3600
```

**Performance:** <150ms

---

### Common API Patterns

**Fuzzy Search Implementation:**
```typescript
// Prefix match (higher priority)
query.or(`name.ilike.${search}%`)

// Contains match (fallback)
query.or(`name.ilike.%${search}%`)
```

**Examples:**
- Search "pamp" → Matches "Pampanga" (prefix)
- Search "mabala" → Matches "Mabalacat" (prefix)
- Search "zambales" → Matches "Zambales" (exact)

**Result Limiting:**
- All endpoints limit to 20 results
- Ordered alphabetically by name

## Component Architecture

### AddressCombobox Component

**Props Interface:**
```typescript
interface AddressComboboxProps {
  value: string                           // Current selected value
  onValueChange: (
    value: string,
    code?: string,
    zipCode?: string
  ) => void                               // Callback on selection
  placeholder: string                     // Placeholder text
  type: "province" | "city" | "barangay" // Component type
  parentCode?: string                     // For cascading (province/city code)
  wasScanned?: boolean                    // OCR highlight flag
  disabled?: boolean                      // Disable state
  required?: boolean                      // Required field flag
  className?: string                      // Additional CSS classes
}
```

**State Management:**
```typescript
const [open, setOpen] = useState(false)              // Dropdown open state
const [options, setOptions] = useState<AddressOption[]>([])  // Search results
const [loading, setLoading] = useState(false)        // Loading indicator
const [search, setSearch] = useState("")             // Search query (debounced)
const [customMode, setCustomMode] = useState(false)  // Manual input mode
const debounceTimeout = useRef<NodeJS.Timeout>()    // Debounce timer
```

**Behavior:**
- Fetches options from API when opened or search changes
- Debounces search input (300ms) to prevent excessive API calls
- Filters by parent code for cascading (cities by province, barangays by city)
- Provides toggle to switch between autocomplete and manual text input
- Applies green highlight styling when `wasScanned={true}`
- Shows loading spinner while fetching results
- Full keyboard navigation using cmdk library (Tab, Enter, Escape, Arrows)

**Styling:**
- Normal: Standard input with dropdown chevron
- Focused: Emerald border, dropdown panel appears
- OCR-scanned: `border-emerald-300 bg-emerald-50/50`
- Disabled: Grayed out, no interaction
- Loading: Spinner inside dropdown

### Fuzzy Matching Utility

**Location:** `/lib/address-matcher.ts`

**Function Signature:**
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
3. Search cities with OCR-extracted city text, **filtered by province code** (if found)
4. Take first match and store city code + ZIP code
5. Search barangays with OCR-extracted barangay text, **filtered by city code** (if found)
6. Take first match
7. Return all matched results or null for unmatched fields

**Handles:**
- OCR variations (all caps: "PAMPANGA" → "Pampanga")
- Partial text ("mabala" → "Mabalacat")
- Null/undefined/empty inputs (returns null gracefully)
- API errors (try-catch with null return)

## Data Flow

### Manual Entry Flow

```
1. User clicks Province dropdown
   ↓
2. AddressCombobox opens, shows all provinces (limit 20)
   ↓
3. User types "pamp"
   ↓
4. 300ms debounce → API call: /api/address/provinces?search=pamp
   ↓
5. API queries: SELECT * FROM address_provinces WHERE name ILIKE 'pamp%'
   ↓
6. Returns [{ code: "035400000", name: "Pampanga" }]
   ↓
7. User selects "Pampanga"
   ↓
8. onValueChange fires → setProvinceCode("035400000")
   ↓
9. City dropdown enables, clears barangay + ZIP
```

### OCR-Assisted Flow

```
1. User scans Driver's License
   ↓
2. OCR extracts: { province: "ZAMBALES", city: "SUBIC", barangay: "ILWAS" }
   ↓
3. fuzzyMatchAddresses() called
   ↓
4. Province search: /api/address/provinces?search=ZAMBALES
   → Match: { code: "087100000", name: "Zambales" }
   ↓
5. City search: /api/address/cities?search=SUBIC&province_code=087100000
   → Match: { code: "087109000", name: "Subic", zip_code: "2209" }
   ↓
6. Barangay search: /api/address/barangays?search=ILWAS&city_code=087109000
   → Match: { code: "087109012", name: "Ilwas" }
   ↓
7. Form pre-fills with matched data
   ↓
8. Green highlights applied (wasScanned={true})
   ↓
9. User reviews and can modify if needed
```

## Cascading Logic

**Province Selection:**
1. User selects province (e.g., "Pampanga")
2. Province code stored in state → `setProvinceCode("035400000")`
3. City dropdown **enables**
4. Barangay and ZIP code **clear**

**City Selection:**
1. User selects city (e.g., "Mabalacat")
2. City code stored → `setCityCode("035409000")`
3. ZIP code **auto-fills** from city data → `setZipCode("2010")`
4. Barangay dropdown **enables** and filters by city code
5. Barangay **clears** if previously selected

**Barangay Selection:**
1. User selects barangay (e.g., "Atlu-Bola")
2. No downstream effects
3. Form ready for submission

**Clearing Logic:**
- Changing province → Clears city, barangay, ZIP
- Changing city → Clears barangay only (ZIP updates)
- Independent fields (House/Lot, Street, Purok) are **unaffected**

## Performance Optimizations

1. **Edge Runtime** - Faster cold starts and global distribution
2. **Cache Revalidation** - 1-hour cache reduces database load
3. **Search Debouncing** - 300ms delay prevents API spam
4. **Result Limiting** - Max 20 results per query
5. **Database Indexes** - GIN trigram + B-tree for fast lookups
6. **Bundle Size** - ~5-8 KB client-side impact (all data server-side)

## Security Considerations

- No sensitive data exposed in API responses
- Read-only API endpoints (no mutations)
- PSGC codes are public domain (official PSA data)
- Rate limiting handled by Edge runtime
- No authentication required (public address data)

## Data Source

**PSGC Cloud API:** https://psgc.cloud
- Official data from Philippine Statistics Authority (PSA)
- Includes PSGC codes, names, and ZIP codes
- Free and publicly accessible
- Used for initial seeding only (not runtime)

**Seeding:**
```bash
npx tsx scripts/seed-addresses.ts
```
- Fetches all provinces, cities, barangays
- Batch inserts (1,000 records at a time)
- Idempotent (safe to re-run)
- Duration: 2-3 minutes for full national data
