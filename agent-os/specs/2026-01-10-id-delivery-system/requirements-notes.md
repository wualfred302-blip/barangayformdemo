# ID Delivery Feature - Requirements Notes

## Initial Requirements Gathered

### Feature Overview
Interface for users to request ID delivery to their doorstep

### Key Components
- Address input for delivery location
- Option to retake selfie (for ID photo)

### Target Users
- Filipino/Filipina residents using the mobile app

### Problem Being Solved
- Eliminates the need to visit the barangay office twice (once to request, once to pickup)
- Streamlines the ID acquisition process

### Use Case Flow
1. User requests ID in-app
2. User provides delivery address
3. ID gets delivered to their doorstep

### Existing System Context
- ID features already exist in the app
- Delivery interface does NOT currently exist (new feature)

### Technical Constraints
- Online only (no offline mode required)
- Mobile app platform

### Full Feature Scope
1. **User-facing**: Request flow for delivery
2. **Admin-facing**: Workload management for staff coordination

### Design Requirements
- World-class UI/UX design quality
- Reference: Vercel/Airbnb design standards
- No existing visual assets - needs to be designed from scratch

---

## Clarified Requirements (Round 1)

Based on follow-up discussion, the following have been confirmed:

| Topic | Decision |
|-------|----------|
| **Payment** | No delivery fee - service is free to residents |
| **Tracking** | Status updates only (no real-time rider GPS tracking) |
| **Address** | Single delivery address per request |
| **Selfie** | Same parameters as existing registration section |
| **Staff workflow** | Needs dedicated ID delivery management section |
| **Notifications** | In-app only, at every step of the process |
| **Timeframes** | Users can select preferred delivery date/time with disclaimer |

### Critical Context: Barangay Jurisdiction System

> **User describes this as "elaborate and complex"**

- Each user account is tied to a designated address
- That address determines WHICH barangay manages them
- This is a jurisdiction/territory system
- Implication: The delivery request routes to the specific barangay that has authority over that user

---

## Deep-Dive Consultation Questions (Round 2)

The following questions will help us design the complete system properly. These are grouped by topic area.

---

### A. Barangay Jurisdiction System

Understanding how the address-to-barangay relationship works is foundational to the entire system design.

**Q1. How is address-to-barangay mapping determined?**

When a user enters their address, how does the system know which barangay they belong to? Common approaches include:

- **Geographic boundaries (GIS)**: Using polygon maps where coordinates determine jurisdiction
- **Manual assignment**: Staff assigns users to barangays manually
- **Database lookup**: Address components (street, subdivision) map to a barangay table
- **Postal/ZIP code based**: Each postal code links to a barangay

Which approach is currently used, or is this something we need to design?

**Q2. Can a user belong to multiple barangays?**

- Is the relationship strictly one user = one barangay?
- Or can someone be registered in multiple jurisdictions? (e.g., business owner in one barangay, resident in another)

**Q3. What happens when someone moves?**

If a resident relocates to a different barangay:
- Do they need to re-register in the new barangay's system?
- Is there a transfer process between barangays?
- Does their old barangay ID become invalid?

**Q4. Does each barangay have its own staff portal?**

- Do barangay staff log into a separate admin panel per barangay?
- Can staff only see residents from their jurisdiction?
- Is there a "super admin" role that can see across all barangays?

---

### B. LGU Staff Roles & Workflow

Understanding who does what is essential for designing the admin interface. Government offices typically have distinct roles with specific responsibilities.

**Q5. What staff roles exist in the barangay office?**

Please confirm which roles are involved in ID processing:

| Potential Role | Responsibility | Exists? (Y/N) |
|----------------|----------------|---------------|
| Clerk/Encoder | Receives and processes requests | |
| Photo Approver | Reviews selfie quality | |
| Printer Operator | Handles ID card printing | |
| Delivery Coordinator | Assigns and tracks deliveries | |
| Barangay Captain | Final approval authority | |
| Tanod/Staff | Performs physical delivery | |
| Supervisor | Oversees workflow, handles exceptions | |

**Q6. Who receives the ID request first?**

When a resident submits a delivery request, which staff member sees it first? Is there:
- A queue system where the next available clerk picks it up?
- Automatic assignment based on workload?
- A supervisor who triages and assigns?

**Q7. Who approves the selfie/photo for the ID?**

The photo that goes on the ID needs verification:
- Is this done automatically (AI-based validation)?
- Does a staff member manually approve photo quality?
- What are the rejection criteria? (blurry, wrong background, sunglasses, etc.)
- If rejected, how is the resident notified to retake?

**Q8. Who handles the physical printing?**

- Is there a dedicated printing staff member?
- Or does the clerk who processed the request also print?
- Is printing done in batches or one-by-one?

**Q9. Who coordinates and performs delivery?**

- Is there a delivery coordinator role?
- How are deliveries assigned to delivery personnel?
- Is there a daily delivery schedule/route planning?

---

### C. The Printing Process

This is an area where we can help design best practices. Let's understand the current state and ideal state.

**Q10. What printing equipment does a typical barangay have?**

Common options in Philippine barangays:

| Equipment Type | Description | Pros | Cons |
|----------------|-------------|------|------|
| **PVC Card Printer** | Dedicated ID card printer (like Fargo, Evolis) | Professional look, durable | Expensive, needs supplies |
| **Inkjet/Laser + Laminator** | Print on paper, then laminate | Cheaper, common equipment | Less durable, looks less official |
| **Pre-printed cards** | Cards with blank photo area, photo printed/attached | Consistent design | Photo attachment may peel |

Which does your target barangay(s) currently use?

**Q11. What information should appear on the Barangay ID?**

Please confirm the ID card fields:

**Front of card:**
- [ ] Photo
- [ ] Full Name
- [ ] Address
- [ ] Date of Birth
- [ ] Gender
- [ ] ID Number
- [ ] Barangay Name/Logo
- [ ] Issue Date
- [ ] Expiry Date
- [ ] QR Code (for verification)
- [ ] Other: ____________

**Back of card:**
- [ ] Emergency Contact
- [ ] Blood Type
- [ ] Signature
- [ ] Terms and conditions
- [ ] Other: ____________

**Q12. Is there a verification step before printing?**

Before an ID is printed, what checks should occur?
- [ ] Photo quality approved
- [ ] Information accuracy verified (name spelling, address)
- [ ] No duplicate ID exists
- [ ] Resident status confirmed
- [ ] Payment verified (if applicable)
- [ ] Other: ____________

**Q13. What happens after printing, before delivery?**

Is there a:
- Quality check of the printed card?
- Registration/logging of the card serial number?
- Staging area where cards await delivery?

---

### D. Delivery Logistics

Getting the ID safely to the resident is the final critical step.

**Q14. Who performs the physical delivery?**

Options we've seen in other LGU systems:

| Option | Pros | Cons |
|--------|------|------|
| **Barangay Tanod** | Trusted, knows the area | Limited availability, not their primary role |
| **Dedicated Barangay Staff** | Can optimize routes | Additional hiring cost |
| **Third-party Courier** (LBC, J&T, etc.) | Professional logistics | Cost, less control, trust concerns |
| **Partner with Postal Service** | Established network | Slow, tracking limitations |

Which approach makes sense for your context?

**Q15. How should delivery be confirmed?**

This is important for audit trail and dispute resolution:

- [ ] **Signature capture**: Recipient signs on staff device
- [ ] **Photo proof**: Photo of resident holding ID
- [ ] **OTP verification**: Resident provides code sent to their phone
- [ ] **Recipient ID check**: Staff verifies recipient identity first
- [ ] **Geolocation**: Staff device records delivery location
- [ ] **Timestamp**: Automatic time logging

Which combination would you like?

**Q16. What if delivery fails?**

Common scenarios and needed policies:

| Scenario | What should happen? |
|----------|---------------------|
| Resident not home | |
| Wrong address | |
| Resident refuses delivery | |
| Someone else wants to receive | |
| Cannot locate address | |
| Multiple failed attempts | |

Should there be a maximum number of delivery attempts before the ID is held for pickup?

---

### E. System Architecture

This helps us understand how to structure the database and admin system.

**Q17. Is there currently one central database or per-barangay databases?**

- **Centralized**: One database, all barangays share it, data filtered by jurisdiction
- **Federated**: Each barangay has their own database, may sync to central
- **Isolated**: Each barangay completely separate, no data sharing

Which architecture exists or is preferred?

**Q18. Do all barangays share the same app/system?**

- **Single instance**: One app serves all barangays (multi-tenant)
- **White-label**: Same codebase, branded separately per barangay
- **Separate deployments**: Each barangay has their own installation

This affects how we design the admin panel and user routing.

**Q19. Is there a Municipal/City-level oversight?**

- Can the Municipal/City LGU see data across all their barangays?
- Do they need reports aggregated at the municipal level?
- Is there approval workflow that involves municipal staff?

---

## Guidance: Best Practices for LGU Printing Workflow

Based on successful implementations in other Philippine LGU systems, here's a recommended workflow you might consider:

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED ID PRINTING WORKFLOW             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REQUEST RECEIVED                                            │
│     └─→ Auto-assigned to Clerk queue                            │
│                                                                 │
│  2. CLERK REVIEW                                                │
│     └─→ Verify information accuracy                             │
│     └─→ Check for duplicates                                    │
│     └─→ Approve/Reject with reason                              │
│                                                                 │
│  3. PHOTO APPROVAL                                              │
│     └─→ Can be same clerk or dedicated role                     │
│     └─→ Check: face visible, proper background, recent photo    │
│     └─→ Request retake if needed                                │
│                                                                 │
│  4. PRINT QUEUE                                                 │
│     └─→ Approved requests enter print queue                     │
│     └─→ Batch printing recommended (efficiency)                 │
│     └─→ Print operator marks as "printed"                       │
│                                                                 │
│  5. QUALITY CHECK                                               │
│     └─→ Visual inspection of printed card                       │
│     └─→ Reprint if defective                                    │
│     └─→ Log card serial number                                  │
│                                                                 │
│  6. DELIVERY STAGING                                            │
│     └─→ Cards grouped by delivery area                          │
│     └─→ Route optimization                                      │
│     └─→ Assignment to delivery personnel                        │
│                                                                 │
│  7. OUT FOR DELIVERY                                            │
│     └─→ Status update sent to resident                          │
│     └─→ Delivery personnel has checklist                        │
│                                                                 │
│  8. DELIVERY CONFIRMATION                                       │
│     └─→ Proof of delivery captured                              │
│     └─→ Resident notified of completion                         │
│     └─→ Record closed                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

This can be adapted based on your specific barangay's capacity and resources.

---

---

## THE BIG PICTURE - System Architecture (Round 3 Answers)

This section captures critical architectural decisions that inform the entire system design.

### Scale

| Aspect | Decision |
|--------|----------|
| **Scope** | Nationwide app for the Philippines |
| **Coverage** | 42,000+ barangays to be served |
| **User Segregation** | Auto-segregated to their barangay based on registration address |
| **MVP Strategy** | Starting with Barangay Mawaque to meet deadlines |

### Architecture

| Aspect | Decision |
|--------|----------|
| **Database** | Single Supabase database with Role-Based Access Control (RBAC) |
| **Multi-tenancy** | All barangays share ONE app instance |
| **Admin Panel** | Each barangay has their own panel (same universal interface, filtered by barangay) |
| **Data Access** | Stats and data filtered by barangay permissions |

### Jurisdiction (Answers to Q1-Q4)

| Question | Answer |
|----------|--------|
| **Address Mapping** | Address-to-Barangay mapping happens at registration (user enters address like "Mawaque") |
| **User-Barangay Relationship** | One user = One barangay (stationary individuals, based on residence) |
| **Address Changes** | Users need ability to UPDATE their information (address changes should reflect in Supabase and potentially re-segregate them) |
| **Admin Panel Design** | Each barangay has unified panel, but sees only THEIR residents |

### Staff Workflow (Answers to Q5-Q9)

| Question | Answer |
|----------|--------|
| **Selfie Verification** | AUTOMATIC - handled in registration with face detection parameters |
| **Staff Role** | Staff only manage the DELIVERY process |
| **Admin Interface** | ONE unified screen for incoming ID delivery requests |
| **Photo Approval** | No manual photo approval needed |

### Printing Process (Answers to Q10-Q13)

| Question | Answer |
|----------|--------|
| **Printing Provider** | 3rd party company handles printing (PVC card printer) |
| **Delivery Logistics** | Same 3rd party coordinates delivery logistics |
| **Verification Step** | No in-app verification step (already done at registration) |
| **Quality Control** | In-person, not in interface |

### Delivery Process (Answers to Q14-Q16)

| Question | Answer |
|----------|--------|
| **Delivery Personnel** | Barangay staff delivers |
| **Delivery Confirmation** | User confirms delivery IN THE APP (not staff) |
| **Failed Delivery** | Scenarios need interface handling (user requested guidance) |

### System Architecture (Answers to Q17-Q19)

| Question | Answer |
|----------|--------|
| **Database Structure** | Single centralized database |
| **Access Control** | Supabase RBAC for barangay-level permissions |
| **Municipal Oversight** | Not required |

---

## FINAL Targeted Questions (Round 4)

Based on the comprehensive answers above, we need clarification on these FINAL implementation details:

### 1. User Delivery Confirmation Flow

The user confirms delivery in the app (not staff). We need to understand the exact flow:

**Q20. What is the exact user flow for confirming delivery?**

When the barangay staff arrives to deliver the ID, how does the user confirm receipt?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Push notification tap** | User receives notification, taps "I received my ID" | Simple, fast | Could be accidentally confirmed |
| **QR code scan** | Staff shows QR, user scans with app | Proves proximity | Requires staff to have code |
| **Confirmation code** | Staff gives verbal code, user enters in app | Proves interaction | User might mishear |
| **In-app button + selfie** | User takes selfie holding new ID | Strong proof | More friction |
| **Simple in-app toggle** | User opens app, marks as received | Very simple | No proof of actual receipt |

Which approach, or combination, should we implement?

**Q21. What happens after the user confirms delivery?**

- Does the user see a "success" screen?
- Is there a digital copy of their ID stored in the app?
- Should they be prompted to rate the service?
- Is the request automatically archived/closed?

---

### 2. Failed Delivery Interface Handling

You mentioned this needs interface handling. Let's define each scenario:

**Q22. What interface elements are needed for failed delivery scenarios?**

| Scenario | What should the USER see/do? | What should STAFF see/do? |
|----------|------------------------------|---------------------------|
| **Resident not home** | Notification: "We attempted delivery but you were not home. Reschedule?" | Mark attempt, schedule retry |
| **Wrong address** | Notification: "Please verify your delivery address" + edit option | Flag for address correction |
| **Resident refuses** | ? | Mark refusal + reason |
| **Cannot locate** | Notification: "We couldn't find your address. Please provide landmarks" | Request additional directions |
| **Multiple failures** | ? | Escalate / hold for pickup? |

For each scenario above, please confirm or modify the expected behavior.

**Q23. How many delivery attempts before the ID is held for barangay pickup?**

- 2 attempts?
- 3 attempts?
- Unlimited with user rescheduling?

**Q24. Should there be a "Hold for Pickup" option the user can choose?**

- Can the user opt-out of delivery and pick up at the barangay instead?
- Is this available from the start, or only after failed deliveries?

---

### 3. Address-to-Barangay Mapping Mechanism

You said users enter addresses like "Mawaque" and get auto-assigned. We need technical clarity:

**Q25. How does text "mawaque" map to Barangay Mawaque in the database?**

| Approach | Description | Complexity |
|----------|-------------|------------|
| **Dropdown selection** | User selects barangay from a list (no free text) | Simple, accurate |
| **Autocomplete/typeahead** | User types, sees suggestions, selects from matches | Good UX, accurate |
| **Free text + fuzzy match** | System tries to match free text to barangay names | Error-prone |
| **Address parser + lookup** | Full address parsed, street/area determines barangay | Complex, needs mapping table |

Which approach is expected? If dropdown or autocomplete, do we have the list of 42,000 barangay names?

**Q26. What fields are collected at registration for address?**

Please confirm:
- [ ] Region
- [ ] Province
- [ ] City/Municipality
- [ ] Barangay (this is the key field)
- [ ] Street/Purok/Sitio
- [ ] House/Unit Number
- [ ] Landmark
- [ ] ZIP Code

---

### 4. Print Trigger Mechanism

The 3rd party printer handles production. We need to understand the handoff:

**Q27. What triggers the 3rd party printer - is it automated or does staff click "Send to Print"?**

| Option | How it works |
|--------|--------------|
| **Automatic batch** | System automatically sends print jobs at scheduled times (e.g., daily at 5PM) |
| **Manual trigger per request** | Staff clicks "Send to Print" for each request |
| **Manual batch trigger** | Staff selects multiple requests, clicks "Send Batch to Print" |
| **Threshold trigger** | Auto-sends when queue reaches X items |

Which model fits your operations?

**Q28. How does the data get to the 3rd party printer?**

| Method | Description |
|--------|-------------|
| **API integration** | Our system calls their API with print data |
| **Export file** | Staff downloads CSV/PDF and uploads to printer portal |
| **Email** | System emails print data to printer company |
| **Printer portal access** | Printer company has read access to our print queue |

Which method is expected or available?

**Q29. What status updates come back from the printer?**

- [ ] Print job received
- [ ] Printing in progress
- [ ] Printed successfully
- [ ] Print failed (with reason)
- [ ] Shipped/Ready for delivery pickup
- [ ] Other: ____________

---

### 5. Address Update Impact on Pending Requests

Users can update their address, which may re-segregate them to a different barangay.

**Q30. What happens to a pending ID delivery request if the user updates their address?**

| Scenario | Current Behavior Needed |
|----------|------------------------|
| **Request is "submitted"** (not yet printed) | Cancel old request? Auto-update address? Transfer to new barangay? |
| **Request is "printing"** (at 3rd party) | Too late to change? Print with old address? |
| **Request is "out for delivery"** | Delivery to old address still valid? |
| **Request is "delivered"** | No impact (already complete) |

**Q31. Should there be a "freeze" on address changes while a request is in progress?**

- Option A: Block address changes until current request completes
- Option B: Allow changes but warn user it may affect their pending request
- Option C: Allow changes and automatically handle the implications

**Q32. If a user moves to a DIFFERENT barangay mid-request, what happens?**

- Does the old barangay still fulfill the delivery?
- Does the request transfer to the new barangay?
- Does the user need to cancel and re-submit?

---

## Summary of What We Know vs. What We Still Need

| Area | Status | Remaining Questions |
|------|--------|---------------------|
| Scale & Architecture | COMPLETE | - |
| Jurisdiction Logic | MOSTLY COMPLETE | Q25, Q26 (mapping mechanism) |
| Staff Workflow | COMPLETE | - |
| Printing Process | MOSTLY COMPLETE | Q27, Q28, Q29 (trigger & integration) |
| Delivery Confirmation | NEED ANSWERS | Q20, Q21 (user flow) |
| Failed Delivery | NEED ANSWERS | Q22, Q23, Q24 (interface handling) |
| Address Updates | NEED ANSWERS | Q30, Q31, Q32 (pending request impact) |

---

## Session Log

**Date**: 2026-01-10
**Status**: Requirements gathering in progress - Round 4 FINAL questions pending

**Round 1**: Initial feature scope established
**Round 2**: Clarified payment, tracking, address, selfie, notifications, timeframes
**Round 2b**: Deep-dive questions generated for jurisdiction, staff roles, printing, delivery, and architecture
**Round 3**: THE BIG PICTURE answers received - architecture, scale, jurisdiction, workflow, printing, delivery confirmed
**Round 4**: FINAL targeted questions generated for delivery confirmation, failed delivery handling, address mapping, print triggers, and address update impacts
