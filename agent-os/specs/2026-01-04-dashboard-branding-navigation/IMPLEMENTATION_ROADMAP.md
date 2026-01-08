# Implementation Roadmap

## Current State vs Proposed State

### Before (Current)
\`\`\`
┌─────────────────────────────────────────┐
│ Dashboard Header (60px)                 │
│ [Logo] Barangay Mawaque                 │
│        Digital Services                 │
│                                    [🔔] │
└─────────────────────────────────────────┘
│                                         │
│  Dashboard Content                      │
│  Services | Requests | Payments (tabs)  │
│                                         │
│  Service tiles (8 items)                │
│  Updates section                        │
│  Announcements section                  │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Bottom Navigation (5 items)             │
│ [🏠]Home  [📋]Services  [✓]Requests    │
│           [📢]News      [👤]Profile    │
└─────────────────────────────────────────┘
\`\`\`

### After (Proposed)
\`\`\`
┌─────────────────────────────────────────┐
│ Dashboard Header (MODIFIED/REMOVED)     │
│ [Option A/B/C - user to decide]         │
│                                    [🔔] │
└─────────────────────────────────────────┘
│                                         │
│  Dashboard Content                      │
│  Services | Requests | Payments (tabs)  │
│                                         │
│  Service tiles (8 items)                │
│  Updates section                        │
│  Announcements section                  │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Bottom Navigation (3 items)             │
│ [🏠]Home  [📢]News  [👤]Profile        │
└─────────────────────────────────────────┘
\`\`\`

---

## Implementation Phases

### Phase 1: Clarification (CURRENT - User Input Needed)
**Status**: Research complete, awaiting user answers

**Questions to Resolve**:
1. Header replacement strategy
2. Navigation confirmation
3. Requests access pattern
4. Report footer branding
5. Logo handling
6. Multi-barangay architecture
7. Home button behavior

**Output**: Refined requirements.md

---

### Phase 2: Code Modifications (PENDING USER INPUT)
**Estimated Time**: 30-45 minutes

**File 1: Dashboard Header**
- File: `/app/dashboard/page.tsx`
- Lines: 72-85
- Action: Remove/replace branding elements
- Complexity: Low-Medium (depends on user choice)

**File 2: Bottom Navigation**
- File: `/components/bottom-nav.tsx`
- Lines: 8-14, 23-26
- Action: Remove Services and Requests items
- Complexity: Low (straightforward removal)

**File 3: Report Footer**
- File: `/app/staff/reports/page.tsx`
- Lines: 277
- Action: Replace hardcoded text
- Complexity: Low (single line change)

---

### Phase 3: Testing (PENDING IMPLEMENTATION)
**Estimated Time**: 20-30 minutes

**Responsive Testing**:
- Mobile (375px width)
- Tablet (768px width)
- Desktop (1024px width)

**Functional Testing**:
- Bottom nav links navigate correctly
- Active state highlighting works
- Dashboard tabs function
- Header displays properly

**Content Testing**:
- No hardcoded Mawaque branding
- Logo handles correctly
- Reports generate without branding

---

### Phase 4: Deployment (AFTER TESTING)
**Steps**:
1. Build verification
2. No console errors
3. Performance check
4. Mobile responsiveness
5. Ready for production

---

## Decision Tree for Header

\`\`\`
Q: What replaces the Barangay Mawaque branding?

├─ A) Remove entirely
│  └─ Action: Delete lines 72-85 entirely
│     Result: Logo and text gone, just white space/padding
│
├─ B) Keep logo only
│  └─ Action: Keep Image component, remove text divs
│     Result: Just app logo, no text labels
│
├─ C) Generic text
│  └─ Action: Replace "Barangay Mawaque" with "Digital Services"
│     Result: App name instead of location name
│
├─ D) Multi-barangay selector
│  └─ Action: Add dropdown/selector component
│     Result: User can switch barangay (future-proofing)
│
└─ E) Custom approach
   └─ Action: [User specifies]
      Result: [Custom implementation]
\`\`\`

---

## Decision Tree for Bottom Navigation

\`\`\`
Q: Remove Services and Requests buttons?

├─ YES (Recommended)
│  └─ Simplify navItems from 5 to 3 items
│     Remove: Services, Requests
│     Keep: Home, News, Profile
│
└─ NO (Keep something)
   ├─ Keep Services?
   │  └─ Clarify purpose (redundant with Home?)
   │
   └─ Keep Requests?
      └─ Clarify reasoning (dashboard tab available?)
\`\`\`

---

## Risk Assessment

### Low Risk Changes
- **Bottom Navigation Removal** - Safe, tested UI pattern
- **Report Footer Update** - Single line, low impact

### Medium Risk Changes
- **Header Replacement** - Depends on chosen approach
  - Option A (remove): Low risk
  - Option B (logo only): Low risk
  - Option C (generic text): Medium risk
  - Option D (selector): Higher risk

### No Risk to
- Dashboard tabs functionality
- User flow (requests still accessible)
- Backend operations
- Other pages (login, register, staff portal)

---

## Success Criteria

After implementation, verify:

1. **Branding Removed**
   - [ ] No "Barangay Mawaque" text visible
   - [ ] Header consistent with choice
   - [ ] Report footer updated

2. **Navigation Simplified**
   - [ ] Bottom nav shows correct items
   - [ ] No redundant buttons
   - [ ] Active states work correctly

3. **Functionality Preserved**
   - [ ] All navigation links work
   - [ ] Dashboard tabs function
   - [ ] Requests accessible via dashboard
   - [ ] Profile page accessible
   - [ ] News/Announcements accessible

4. **Design Quality**
   - [ ] Responsive on mobile/tablet
   - [ ] No visual gaps or broken layout
   - [ ] Proper spacing and alignment
   - [ ] Accessibility maintained

---

## Timeline Estimate

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Research & Questions | ✓ Complete | DONE |
| 2 | User Answers Questions | TBD | PENDING |
| 2 | Refine Requirements | 15 min | PENDING |
| 3 | Code Modifications | 30-45 min | PENDING |
| 4 | Testing | 20-30 min | PENDING |
| 5 | Build & Deploy | 10-15 min | PENDING |
| | **TOTAL** | ~2 hours | **READY** |

---

## Documentation Files

All research artifacts are in: `/home/user/barangayformdemo/agent-os/specs/2026-01-04-dashboard-branding-navigation/`

1. **requirements.md** - Full technical requirements
2. **clarifying-questions.md** - Detailed 7 questions with context
3. **CLARIFYING_QUESTIONS_SUMMARY.txt** - Concise format for user
4. **RESEARCH_SUMMARY.md** - Research findings and impact
5. **IMPLEMENTATION_ROADMAP.md** - This document
6. **/assets/** - Folder for diagrams/mockups

---

## Next Steps for Orchestration

1. Present CLARIFYING_QUESTIONS_SUMMARY.txt to user
2. Collect user answers (7 key decisions)
3. Update requirements.md with user decisions
4. Trigger implementation phase
5. Run tests
6. Deploy changes
