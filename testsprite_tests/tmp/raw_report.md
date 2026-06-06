
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Trst.it
- **Date:** 2026-06-06
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Connect wallet and choose tenant role
- **Test Code:** [TC001_Connect_wallet_and_choose_tenant_role.py](./TC001_Connect_wallet_and_choose_tenant_role.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the UI requires an external MetaMask browser extension which is not detected and the approval step must be completed outside the app, preventing automation.

Observations:
- The MetaMask modal shows the 'Browser' tab with status 'Not Detected'.
- No in-page approval, role selection, or tenant onboarding UI was available to continue; an external extension interaction is required.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/91329935-ec00-4ce6-b5d1-15af3c7c15e6
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Tenant runs a private verification from a shared link
- **Test Code:** [TC002_Tenant_runs_a_private_verification_from_a_shared_link.py](./TC002_Tenant_runs_a_private_verification_from_a_shared_link.py)
- **Test Error:** TEST BLOCKED

The tenant verification flow could not be completed because the required browser wallet extension (MetaMask) is not available in this test environment, preventing wallet-based authentication and subsequent verification steps.

Observations:
- The MetaMask connection modal shows the 'Browser' option with status 'Not Detected'.
- Wallet-based login cannot proceed without the extension, so the tenant share verification page cannot be reached or executed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/e0ca8b12-b726-42bf-961c-32eb21af2c85
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Connect wallet and choose landlord role
- **Test Code:** [TC003_Connect_wallet_and_choose_landlord_role.py](./TC003_Connect_wallet_and_choose_landlord_role.py)
- **Test Error:** TEST BLOCKED

The wallet connection step could not be completed because no in-browser MetaMask provider is detected in the test environment; therefore the wallet approval (required to choose the landlord role and reach onboarding) cannot be performed.

Observations:
- The MetaMask "Browser" modal is open and displays 'Not Detected'.
- No in-page wallet approval prompt or provider injection appeared after selecting Browser.
- Without an injected provider or extension approval, the app cannot complete wallet-based authentication or role selection.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/79f8ff64-bc5e-4cc0-a41d-f60cf50a0244
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Unauthenticated user is prevented from opening tenant profile and verification routes
- **Test Code:** [TC004_Unauthenticated_user_is_prevented_from_opening_tenant_profile_and_verification_routes.py](./TC004_Unauthenticated_user_is_prevented_from_opening_tenant_profile_and_verification_routes.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/4562f6b4-d659-438e-b8eb-5500b2678d2e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Unauthenticated user is prevented from opening protected landlord routes
- **Test Code:** [TC005_Unauthenticated_user_is_prevented_from_opening_protected_landlord_routes.py](./TC005_Unauthenticated_user_is_prevented_from_opening_protected_landlord_routes.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/9088730b-0d2f-4cac-980f-d461ae7e68b2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Open the shared verification result page
- **Test Code:** [TC006_Open_the_shared_verification_result_page.py](./TC006_Open_the_shared_verification_result_page.py)
- **Test Error:** TEST BLOCKED

A valid shared verification result could not be opened as an anonymous viewer because no accessible shared result was found.

Observations:
- Navigating to /verify/abc123 shows the message: "Verification not found — This link is invalid or has been removed." (visible in the page content and screenshot).
- No public listing of shared verification results was available to select from, and creating or retrieving a valid share link requires wallet-based authentication and flows (Connect Wallet + generate/share), which cannot be completed anonymously in this session.

Conclusion: The anonymous-viewer verification step cannot be completed because no valid public share slug was available and creating one requires wallet authentication and actions outside anonymous access. The test is therefore BLOCKED.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/092a9a91-8a75-41d8-996c-08bf21a83cd0
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Tenant reaches the dashboard after role onboarding
- **Test Code:** [TC007_Tenant_reaches_the_dashboard_after_role_onboarding.py](./TC007_Tenant_reaches_the_dashboard_after_role_onboarding.py)
- **Test Error:** TEST BLOCKED

The test could not be run to completion — the UI requires a browser wallet extension or an external mobile wallet scan which is not available in this automated environment.

Observations:
- The MetaMask modal 'Browser' option displays 'Not Detected'.
- The WalletConnect (Mobile) option shows a QR that requires scanning with an external mobile wallet, which cannot be automated here.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/c6f8258e-19c3-4d1b-9e78-0ffd51af1bdd
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Return to the same wallet with the assigned role
- **Test Code:** [TC008_Return_to_the_same_wallet_with_the_assigned_role.py](./TC008_Return_to_the_same_wallet_with_the_assigned_role.py)
- **Test Error:** TEST BLOCKED

The wallet connection could not be completed because the MetaMask browser extension is not detected and external extension approval is required by the user.

Observations:
- The MetaMask chooser modal displays the 'Browser' tab with the status 'Not Detected'.
- No browser-extension approval prompt appeared and the app cannot proceed without a user-approved MetaMask extension.
- External extension approval dialogs cannot be automated by this test harness.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/462d19f0-633b-4688-9bed-9b3375438f3e
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Landlord reaches the dashboard after role onboarding
- **Test Code:** [TC009_Landlord_reaches_the_dashboard_after_role_onboarding.py](./TC009_Landlord_reaches_the_dashboard_after_role_onboarding.py)
- **Test Error:** TEST BLOCKED

The wallet connection and onboarding flow could not be completed because the MetaMask browser extension is not detected in the test environment. External wallet approval is required to proceed and cannot be automated here.

Observations:
- The MetaMask modal is open with the Browser tab selected and shows 'Not Detected' under the MetaMask logo.
- No browser wallet extension is available to accept the connection; the UI offers only Mobile and Browser connection methods.
- There is no in-app fallback to create or simulate a wallet connection without external wallet approval.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/b3d64188-b48c-4668-996e-8844350ebfcf
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Anonymous viewer inspects a shared verification result
- **Test Code:** [TC010_Anonymous_viewer_inspects_a_shared_verification_result.py](./TC010_Anonymous_viewer_inspects_a_shared_verification_result.py)
- **Test Error:** The shared verification URL (http://localhost:3000/verify/demo) was opened and the page shows: "Verification not found — This link is invalid or has been removed." No verification content, verdict, or requirement indicators are present to inspect. Visible interactive elements: theme toggle (index 164) and Connect wallet (index 165). Because the shared result is missing/invalid, the required assertions (that an anonymous viewer can see the overall verdict and requirement indicators without private data) could not be completed. Success: false.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/71c7961b-d587-4b59-ab6b-45590a2807fb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Create a property screening request successfully
- **Test Code:** [TC011_Create_a_property_screening_request_successfully.py](./TC011_Create_a_property_screening_request_successfully.py)
- **Test Error:** TEST BLOCKED

The test could not be completed because the landlord wallet connection cannot be performed in this automated environment (no browser wallet extension detected and WalletConnect requires an external mobile wallet). UI evidence shows the MetaMask modal 'Browser' tab with a 'Not Detected' message, preventing access to the screening creation form required by the test.

Observations:
- The MetaMask modal is open and the 'Browser' tab is active, but it displays 'Not Detected'.
- No browser extension approval prompt or connected wallet state appeared after selecting MetaMask → Browser.
- The screening creation form remains inaccessible behind the wallet requirement, so form entry and submission cannot be automated here.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/41fba108-57a4-433e-ac49-ddf492eef22c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Landlord creates a new property screening request
- **Test Code:** [TC012_Landlord_creates_a_new_property_screening_request.py](./TC012_Landlord_creates_a_new_property_screening_request.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the UI requires an in-browser MetaMask wallet extension for authentication which is not available in this environment.

Observations:
- The MetaMask modal (Browser option) displays 'Not Detected'.
- No extension approval prompt or alternate in-browser connect option is available to continue the wallet-based authentication; thus the landlord flows that require authentication cannot be exercised.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/a6be87c7-7393-489f-b1db-fa75838e55b5
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Create a tenant profile successfully
- **Test Code:** [TC013_Create_a_tenant_profile_successfully.py](./TC013_Create_a_tenant_profile_successfully.py)
- **Test Error:** TEST BLOCKED

The tenant profile cannot be reached or saved because wallet authentication requires external approval that cannot be automated.

Observations:
- The Connect Wallet modal is open and selecting MetaMask opened a QR/connection modal (MetaMask flow visible in the UI).
- Navigating to /profile shows wallet-required messaging ('Wallet required' / 'Reconnecting wallet…') and the profile form is not accessible.
- Wallet connection requires external/manual approval (QR scan or browser extension approval), which cannot be completed by the automated test harness, so the profile save flow cannot be executed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/27544fa9-7777-4cff-9e95-d6dbd8464507
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Tenant creates an encrypted profile
- **Test Code:** [TC014_Tenant_creates_an_encrypted_profile.py](./TC014_Tenant_creates_an_encrypted_profile.py)
- **Test Error:** TEST BLOCKED

The wallet-based authentication flow could not be completed — the browser wallet extension (MetaMask) is not detected, so the tenant cannot sign in and proceed to the profile flow.

Observations:
- The MetaMask chooser modal (Browser tab) displays 'Not Detected' (visible in the screenshot and browser_state).
- No in-page approval path is available; a browser extension or an external mobile approval is required to complete wallet connection.
- Because wallet authentication failed, the tenant /profile flow (navigate, fill, submit, verify encrypted profile) could not be reached or executed.

Attempted steps (from USER REQUEST):
- Navigate to /login — skipped (app uses wallet-based auth per Extra Info).
- Use Connect Wallet on landing — performed (Connect Wallet clicked; MetaMask chooser opened).
- Selected MetaMask → Browser option — performed; Browser shows 'Not Detected'.
- Navigate to /profile — NOT performed (blocked by missing wallet connection).
- Fill profile fields and submit — NOT performed (blocked).
- Verify profile saved/status displayed — NOT performed (blocked).

Conclusion: The test is blocked by the environment lacking a detectable MetaMask/browser wallet extension. To run the test successfully, a browser with a wallet extension (configured/testnet account) or an alternative programmatic wallet approval method is required. No further UI steps were possible in this session.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/29bf2cd4-a60a-4a69-9b45-0554230641fc
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Landlord reviews property screening cards
- **Test Code:** [TC015_Landlord_reviews_property_screening_cards.py](./TC015_Landlord_reviews_property_screening_cards.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the browser wallet required for authentication is not available, preventing access to landlord pages and verification of property screening cards.

Observations:
- The MetaMask modal is open with the 'Browser' tab selected and the message 'Not Detected'.
- No in-page wallet provider is available to complete wallet-based login, and the mobile/QR option requires an external device (not automatable here).

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bb1b7fb1-90ba-48b5-9207-bb22f4acd79c/416ee306-ca68-4aef-be08-7181b95c4f65
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **13.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---