# QRT ID Card Redesign - Clarifying Questions

**Research Date**: January 4, 2026
**Status**: Ready for User Review

---

## Research Summary

The spec shaping research has identified the following:

**Key Findings**:
- QRT ID cards are generated using HTML5 Canvas (856×540px) via `/lib/qrt-id-generator-canvas.ts`
- Staff dashboard exists at `/app/staff/qrt-management/page.tsx` but has NO precinct filtering
- Data model lacks `precinctNumber` field in `QRTIDRequest` interface
- 5 logo assets already available in `/public/images/`
- Current card structure allows space for additional elements

---

## 5 Critical Clarifying Questions

### 1. Precinct Number Format & Source

**What is the source and format of precinct numbers?**

- [ ] **Format**: Are they numeric (1-10), alphanumeric (P001-P999), or text ("Precinct 1")?
- [ ] **Assignment**: Generated automatically or manually assigned by staff?
- [ ] **Quantity**: Should each QRT member have ONE precinct or MULTIPLE precincts?
- [ ] **Database**: Is precinct data already in the Supabase database, or does it need to be added?

**Why this matters**: This determines the data model structure, database schema, and validation logic.

---

### 2. Mawaque App Logo Selection

**Which logo file should represent the Mawaque app?**

Available assets in `/public/images/`:
- `linkod-app-logo-main.png` (722KB)
- `mawaque-logo.png` (1.08MB)
- `mawaque-20logo.jpeg` (475KB)
- Other generic logos

- [ ] Which file is the correct "Mawaque app logo"?
- [ ] Should it be optimized/compressed further?
- [ ] Are these the final version or should they be updated?

**Why this matters**: Ensures correct branding and visual consistency.

---

### 3. Logo Sizing & Placement Details

**What are the exact dimensions and positioning requirements for the logos?**

Current state:
- Bagong Pilipinas logo: 45×40px at position (20, 10)
- Top left is currently empty space
- Top middle can be adjusted

- [ ] **Mawaque logo size**: How many pixels (width × height)?
- [ ] **Bagong Pilipinas adjustment**: Keep at 45×40px or change it?
- [ ] **Opacity**: Full opacity or semi-transparent for subtle branding?
- [ ] **Positioning**: Exact pixel coordinates or relative positioning?

**Why this matters**: Prevents visual clutter and ensures professional appearance.

---

### 4. Staff Dashboard Precinct Features

**How should the staff dashboard use precinct classification?**

- [ ] **Filtering**: Staff can filter to see only their assigned precinct's QRT members?
- [ ] **Column display**: Should precinct appear as a visible column in list view?
- [ ] **Grouping**: Kanban board grouped by precinct (Precinct 1, Precinct 2, etc.)?
- [ ] **Role-based**: Should there be a "Precinct Coordinator" role with limited access?
- [ ] **Bulk operations**: Can staff generate multiple IDs per precinct at once?

**Why this matters**: Defines staff workflow and dashboard UX/architecture.

---

### 5. Precinct Number Display on Card

**How should the precinct number appear on the physical card?**

- [ ] **Position**: Bottom-left confirmed? Or another location?
- [ ] **Styling**:
  - Plain text only?
  - Badge/box background?
  - Color scheme (emerald like card, or distinct)?
- [ ] **Label**: Display as "PRECINCT: 3" or just "3"?
- [ ] **Font size**: 18px, 24px, or larger? (Must be readable on printed card)
- [ ] **Visibility on both sides**: Show on front AND back, or just front?

**Why this matters**: Ensures precinct numbers are clearly visible and easily readable in real-world use.

---

## Implementation Blocking Points

The following tasks CANNOT proceed without answers:

1. **Q1 Answer Required For**:
   - Database schema decisions
   - Data model updates (`lib/qrt-types.ts`)
   - Context mapping (`lib/qrt-context.tsx`)

2. **Q2 Answer Required For**:
   - Image asset selection
   - Canvas rendering code

3. **Q3 Answer Required For**:
   - Canvas coordinate calculations (`lib/qrt-id-generator-canvas.ts`)
   - Testing and QA

4. **Q4 Answer Required For**:
   - Staff dashboard UI (`app/staff/qrt-management/page.tsx`)
   - Filtering logic
   - Role-based access control

5. **Q5 Answer Required For**:
   - Canvas rendering decisions
   - Final visual design approval
   - Print/display testing

---

## Recommended Next Steps

1. **User provides answers** to the 5 questions above
2. **Orchestrator consolidates responses** and updates requirements.md
3. **Spec writer creates** detailed implementation spec with code examples
4. **Implementation team** proceeds with development phase
5. **QA validates** precinct filtering and card appearance

---

## Research Artifacts

**Location**: `/home/user/barangayformdemo/agent-os/specs/2026-01-04-qrt-card-redesign/`

- ✓ `requirements.md` - Comprehensive current state analysis and proposed changes
- ✓ `CLARIFYING_QUESTIONS.md` - This file with 5 critical questions
- ✓ `assets/` - Empty, ready for screenshots/diagrams after clarifications
