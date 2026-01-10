# ID Delivery System Spec

## Overview
Nationwide barangay ID delivery system for the Philippines, serving 42,000+ barangays with a single Supabase database and RBAC-based multi-tenant architecture. Users request ID delivery through the app, a 3rd party handles printing, and barangay staff handles delivery with user-side confirmation.

## Status
**Phase**: Spec Shaping (Round 4 - Final Targeted Questions)

## Key Architecture Decisions
- **Scale**: 42,000+ barangays, MVP starting with Barangay Mawaque
- **Database**: Single Supabase instance with RBAC
- **Multi-tenancy**: All barangays share one app, filtered by permissions
- **Staff Role**: Delivery management only (selfie verification is automatic)
- **Printing**: 3rd party PVC card printer
- **Delivery Confirmation**: User confirms in-app (not staff)

## Goals
- [x] Define feature requirements (Round 1-3 complete)
- [ ] Finalize delivery confirmation flow (Q20-Q21)
- [ ] Define failed delivery interface handling (Q22-Q24)
- [ ] Clarify address-to-barangay mapping (Q25-Q26)
- [ ] Determine print trigger mechanism (Q27-Q29)
- [ ] Handle address update edge cases (Q30-Q32)

## Documents
- `README.md` - This overview document
- `requirements-notes.md` - Full requirements gathering with all Q&A rounds

## Next Steps
1. Get answers to Round 4 final targeted questions
2. Create technical requirements document
3. Define implementation tasks
4. Approve for implementation
