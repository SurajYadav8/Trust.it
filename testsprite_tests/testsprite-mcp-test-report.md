# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata

- **Project Name:** Trst.it
- **Date:** 2026-06-06
- **Prepared by:** TestSprite AI Team
- **Test Environment:** `http://localhost:3000` (Next.js dev server, `npm run dev`)
- **Scope:** Frontend — 15 high-priority tests (dev-mode cap; full plan has 24 cases)
- **Auth Model:** Wallet-based (Reown AppKit / wagmi) — no email/password login

---

## 2️⃣ Requirement Validation Summary

### Requirement: Wallet Connect and Role Onboarding

**Description:** User connects a Web3 wallet and selects a permanent tenant or landlord role.

#### Test TC001 — Connect wallet and choose tenant role

- **Test Code:** [TC001_Connect_wallet_and_choose_tenant_role.py](./TC001_Connect_wallet_and_choose_tenant_role.py)
- **Test Error:** TEST BLOCKED — MetaMask browser extension not detected; external wallet approval required.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/91329935-ec00-4ce6-b5d1-15af3c7c15e6
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** The Connect Wallet flow opens AppKit correctly, but TestSprite's headless Chromium has no injected wallet provider. MetaMask "Browser" tab shows "Not Detected." Role selection never becomes reachable without extension approval. **Not an app bug** — environment limitation.

---

#### Test TC003 — Connect wallet and choose landlord role

- **Test Code:** [TC003_Connect_wallet_and_choose_landlord_role.py](./TC003_Connect_wallet_and_choose_landlord_role.py)
- **Test Error:** TEST BLOCKED — No in-browser MetaMask provider detected.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/79f8ff64-bc5e-4cc0-a41d-f60cf50a0244
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Same wallet-extension gap as TC001. Landlord onboarding at `/landlord` could not be exercised. Recommend configuring TestSprite with a Synpress/dappeteer wallet mock or pre-seeded test wallets in `.testsprite/config.json`.

---

#### Test TC007 — Tenant reaches the dashboard after role onboarding

- **Test Code:** [TC007_Tenant_reaches_the_dashboard_after_role_onboarding.py](./TC007_Tenant_reaches_the_dashboard_after_role_onboarding.py)
- **Test Error:** TEST BLOCKED — Browser extension and WalletConnect QR both require external approval.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/c6f8258e-19c3-4d1b-9e78-0ffd51af1bdd
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Post-onboarding tenant dashboard (`/dashboard`) was never reached. WalletConnect mobile QR path is also non-automatable in headless CI.

---

#### Test TC008 — Return to the same wallet with the assigned role

- **Test Code:** [TC008_Return_to_the_same_wallet_with_the_assigned_role.py](./TC008_Return_to_the_same_wallet_with_the_assigned_role.py)
- **Test Error:** TEST BLOCKED — MetaMask extension not detected on reconnect.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/462d19f0-633b-4688-9bed-9b3375438f3e
- **Status:** ⚠️ BLOCKED
- **Severity:** MEDIUM
- **Analysis / Findings:** Role persistence per wallet (documented in `convex/users.ts`) could not be validated. Requires a connected wallet session across two visits.

---

#### Test TC009 — Landlord reaches the dashboard after role onboarding

- **Test Code:** [TC009_Landlord_reaches_the_dashboard_after_role_onboarding.py](./TC009_Landlord_reaches_the_dashboard_after_role_onboarding.py)
- **Test Error:** TEST BLOCKED — MetaMask browser extension not detected.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/b3d64188-b48c-4668-996e-8844350ebfcf
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Landlord dashboard and nav (Dashboard | Properties | Results) were not reachable. No in-app fallback exists for wallet-less testing — expected for a Web3 app.

---

### Requirement: Route Protection (Auth Guards)

**Description:** Unauthenticated users are blocked from protected tenant and landlord routes.

#### Test TC004 — Unauthenticated user is prevented from opening tenant profile and verification routes

- **Test Code:** [TC004_Unauthenticated_user_is_prevented_from_opening_tenant_profile_and_verification_routes.py](./TC004_Unauthenticated_user_is_prevented_from_opening_tenant_profile_and_verification_routes.py)
- **Test Error:** —
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/4562f6b4-d659-438e-b8eb-5500b2678d2e
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** `/profile` and `/verify/sample-share` correctly require wallet authentication. Unauthenticated visitors see connect-wallet prompts rather than protected content. Auth guard behavior is working as designed.

---

#### Test TC005 — Unauthenticated user is prevented from opening protected landlord routes

- **Test Code:** [TC005_Unauthenticated_user_is_prevented_from_opening_protected_landlord_routes.py](./TC005_Unauthenticated_user_is_prevented_from_opening_protected_landlord_routes.py)
- **Test Error:** —
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/9088730b-0d2f-4cac-980f-d461ae7e68b2
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** `/landlord` is correctly gated for unauthenticated users. Landlord area remains inaccessible until wallet connect completes.

---

### Requirement: Tenant Verification Flow

**Description:** Tenant opens a share link, reviews requirements, runs encrypted verification, and lands on a result page.

#### Test TC002 — Tenant runs a private verification from a shared link

- **Test Code:** [TC002_Tenant_runs_a_private_verification_from_a_shared_link.py](./TC002_Tenant_runs_a_private_verification_from_a_shared_link.py)
- **Test Error:** TEST BLOCKED — Wallet extension unavailable; cannot reach share verification page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/e0ca8b12-b726-42bf-961c-32eb21af2c85
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** End-to-end verification requires (1) wallet auth, (2) valid share slug from Convex, and (3) FHE contract on testnet. All three are outside headless automation without fixtures. Test plan incorrectly referenced `/login` — app uses wallet auth only.

---

### Requirement: Verification Results (Public / Shared Views)

**Description:** Viewers can inspect pass/fail outcomes and requirement indicators without raw financial data.

#### Test TC006 — Open the shared verification result page

- **Test Code:** [TC006_Open_the_shared_verification_result_page.py](./TC006_Open_the_shared_verification_result_page.py)
- **Test Error:** TEST BLOCKED — No valid share slug available (`/verify/abc123` → "Verification not found").
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/092a9a91-8a75-41d8-996c-08bf21a83cd0
- **Status:** ⚠️ BLOCKED
- **Severity:** MEDIUM
- **Analysis / Findings:** Anonymous result viewing works in principle (`/results/[resultId]` is public per code summary), but tests used invented slugs. **Recommendation:** Seed Convex with a fixture screening + result and pass real `shareSlug` / `resultId` in TestSprite config.

---

#### Test TC010 — Anonymous viewer inspects a shared verification result

- **Test Code:** [TC010_Anonymous_viewer_inspects_a_shared_verification_result.py](./TC010_Anonymous_viewer_inspects_a_shared_verification_result.py)
- **Test Error:** `/verify/demo` returned "Verification not found — This link is invalid or has been removed."
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/71c7961b-d587-4b59-ab6b-45590a2807fb
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Test used a non-existent demo slug. The app correctly shows a not-found state — this is **expected behavior**, not a regression. Classified as failed because assertions could not run, but root cause is **missing test data**, not broken UI. Consider routing anonymous result tests to `/results/{validResultId}` instead of `/verify/{slug}`.

---

### Requirement: Landlord Create Property Screening

**Description:** Landlord defines property details and screening requirements (rent, income multiple, credit, employment).

#### Test TC011 — Create a property screening request successfully

- **Test Code:** [TC011_Create_a_property_screening_request_successfully.py](./TC011_Create_a_property_screening_request_successfully.py)
- **Test Error:** TEST BLOCKED — Wallet connection blocked access to `/landlord/requests/new` form.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/41fba108-57a4-433e-ac49-ddf492eef22c
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Create form (property name, INR/USD rent, income multiple, credit score, employment duration) was not reachable. Form fields and `requests.create` mutation were not exercised.

---

#### Test TC012 — Landlord creates a new property screening request

- **Test Code:** [TC012_Landlord_creates_a_new_property_screening_request.py](./TC012_Landlord_creates_a_new_property_screening_request.py)
- **Test Error:** TEST BLOCKED — MetaMask extension not detected.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/a6be87c7-7393-489f-b1db-fa75838e55b5
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Duplicate coverage of TC011 with same wallet blocker. Once wallet mock is configured, both should validate form submission and post-create redirect to property detail.

---

### Requirement: Tenant Encrypted Profile

**Description:** Tenant saves reusable encrypted salary, credit score, and employment profile.

#### Test TC013 — Create a tenant profile successfully

- **Test Code:** [TC013_Create_a_tenant_profile_successfully.py](./TC013_Create_a_tenant_profile_successfully.py)
- **Test Error:** TEST BLOCKED — `/profile` shows "Wallet required"; form inaccessible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/27544fa9-7777-4cff-9e95-d6dbd8464507
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Profile wizard (salary + currency, credit score, employment range, FHE encrypt) requires authenticated tenant wallet. Guard messaging is correct; flow untested.

---

#### Test TC014 — Tenant creates an encrypted profile

- **Test Code:** [TC014_Tenant_creates_an_encrypted_profile.py](./TC014_Tenant_creates_an_encrypted_profile.py)
- **Test Error:** TEST BLOCKED — MetaMask "Not Detected" after Connect Wallet.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/29bf2cd4-a60a-4a69-9b45-0554230641fc
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Agent correctly skipped `/login` per wallet-auth instructions. Profile save and `profiles.upsert` mutation remain unverified.

---

### Requirement: Landlord Dashboard and Properties

**Description:** Landlord views stats, property screening cards, and copies verification links.

#### Test TC015 — Landlord reviews property screening cards

- **Test Code:** [TC015_Landlord_reviews_property_screening_cards.py](./TC015_Landlord_reviews_property_screening_cards.py)
- **Test Error:** TEST BLOCKED — Wallet auth unavailable for `/landlord/properties`.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/416ee306-ca68-4aef-be08-7181b95c4f65
- **Status:** ⚠️ BLOCKED
- **Severity:** MEDIUM
- **Analysis / Findings:** Property card list, copy-link, and navigation between Dashboard / Properties / Results were not exercised. Requires landlord wallet with at least one seeded screening for full validation.

---

## 3️⃣ Coverage & Matching Metrics

- **13.33%** of executed tests passed (2 of 15)
- **80%** of tests blocked by environment (wallet extension / missing fixtures)
- **6.67%** failed due to invalid test data (demo slugs)

| Requirement                         | Total Tests | ✅ Passed | ❌ Failed | ⚠️ Blocked |
|-------------------------------------|-------------|-----------|-----------|------------|
| Wallet Connect and Role Onboarding  | 5           | 0         | 0         | 5          |
| Route Protection (Auth Guards)      | 2           | 2         | 0         | 0          |
| Tenant Verification Flow            | 1           | 0         | 0         | 1          |
| Verification Results (Public Views) | 2           | 0         | 1         | 1          |
| Landlord Create Property Screening  | 2           | 0         | 0         | 2          |
| Tenant Encrypted Profile            | 2           | 0         | 0         | 2          |
| Landlord Dashboard and Properties   | 1           | 0         | 0         | 1          |
| **Total**                           | **15**      | **2**     | **1**     | **12**     |

**Generated test artifacts:** 15 Playwright Python scripts in `testsprite_tests/TC*.py`

**Not executed (dev-mode cap):** TC016–TC024 from full plan (theme toggle, landlord results table, copy link, etc.)

---

## 4️⃣ Key Gaps / Risks

### What passed

- **Auth guards work correctly.** Unauthenticated users cannot access `/profile`, `/verify/*`, or `/landlord` without connecting a wallet. This is the only fully validated requirement group.

### Primary blocker: wallet automation

> 12 of 15 tests were **BLOCKED**, not failed. TestSprite runs headless Chromium without MetaMask/Rabby injected. Reown AppKit correctly surfaces "Not Detected" for browser extensions. This is an **environment gap**, not an application defect.

**Recommended fixes for next run:**

1. **Configure wallet mock in TestSprite** — Use Synpress, dappeteer, or TestSprite's wallet config UI (opened during bootstrap) with a test private key and pre-funded testnet account.
2. **Seed Convex fixtures** — Provide real `shareSlug` and `resultId` values in `additionalInstruction` or `.testsprite/config.json` so public result tests don't use `abc123` / `demo`.
3. **Run in production mode** — `npm run build && npm run start` removes the 15-test dev cap and allows TC016–TC024 (theme, navigation, results table).
4. **Separate wallets for roles** — Tenant and landlord tests need different wallet addresses (role is permanent per wallet in Convex).

### Secondary risks

| Risk | Severity | Notes |
|------|----------|-------|
| FHE verification untested | HIGH | `lib/contract.ts` requires deployed contract + testnet funds; even with wallet mock, on-chain step may fail |
| No email login (test plan drift) | LOW | TC002 referenced `/login`; app is wallet-only — instructions were corrected at runtime |
| Invalid demo URLs treated as failures | MEDIUM | TC010 "failed" because `/verify/demo` doesn't exist; use seeded data or mark as blocked |
| Dev server instability | LOW | Circular chunk warnings in CoFHE SDK; consider production build for TestSprite |

### Summary

> **13.33% pass rate** reflects environment constraints, not product quality. The two passing tests confirm route protection is solid. To unlock meaningful coverage, the next TestSprite run should use wallet injection + Convex seed data + production server mode.

---

*Report generated from `testsprite_tests/tmp/raw_report.md` and `testsprite_tests/tmp/test_results.json`.*
