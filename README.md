# Tr*st.it

> **Prove you qualify. Without revealing why.**

Confidential rental screening. Tenants build one reusable, encrypted profile (salary, credit score, employment duration). Landlords publish eligibility requirements (rent, income multiplier, minimum credit, minimum tenure). Both sides see a clean **pass / fail per requirement and an overall verdict** — never the raw underlying numbers.

Encryption + threshold comparison runs on real **Fhenix CoFHE** end-to-end. Only the boolean outcomes are ever decrypted.

---

## Stack

| Layer | Tool |
| --- | --- |
| Web app | Next.js 14 (App Router) + TypeScript + Tailwind |
| Database | [Convex](https://convex.dev) |
| Wallet connect | [Reown AppKit](https://reown.com) (WalletConnect v2) + wagmi |
| Confidential compute | [Fhenix CoFHE](https://fhenix.zone) (`cofhejs` + `FHE.sol`) |
| Chain | Arbitrum Sepolia (default) or Ethereum Sepolia |

---

## Architecture

```
┌──────────────┐    encrypted profile     ┌──────────────────────┐
│ Tenant       │ ───────────────────────► │ TrstItVerifier (FHE) │
│ Browser      │                          │ on Arbitrum Sepolia  │
│ (cofhejs)    │ ◄── async decrypt of ─── │                      │
│              │     booleans only        └──────────────────────┘
└──────┬───────┘
       │ booleans + metadata
       ▼
┌──────────────┐                           ┌──────────────┐
│ Convex DB    │ ◄──────── reads ───────── │ Landlord     │
│ (no PII)     │                           │ Dashboard    │
└──────────────┘                           └──────────────┘
```

**Privacy guarantees:**
- Raw salary / credit / tenure are encrypted client-side via `cofhejs` and never leave the device in plaintext.
- The encrypted profile lives on-chain in `TrstItVerifier`. Convex stores only ciphertext handles + metadata.
- `verify(...)` runs three encrypted `>=` comparisons (`FHE.gte`). Only the **three boolean outcomes** are decrypted via the Fhenix Threshold Network.
- Convex `results` table stores **only booleans** — never magnitudes — so landlords cannot infer how close anyone was to a threshold.
- Wallet = identity. Each wallet has a locked role (tenant or landlord), enforced server-side.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Reown WalletConnect project id

Create a project at [cloud.reown.com](https://cloud.reown.com) and copy the project id.

### 3. Convex deployment

```bash
npx convex dev
```

This opens a browser to authenticate, creates a Convex project, generates `convex/_generated/*` with full types, and watches `convex/*.ts`. Keep it running in a separate terminal. It also writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local` automatically.

### 4. Deploy the FHE contract

`contracts/TrstItVerifier.sol` is the on-chain piece. Use the [Fhenix Hardhat starter kit](https://github.com/FhenixProtocol/cofhe-hardhat-starter):

```bash
git clone https://github.com/FhenixProtocol/cofhe-hardhat-starter
cd cofhe-hardhat-starter
pnpm install
cp ../<this-repo>/contracts/TrstItVerifier.sol contracts/
# Configure .env with ARBITRUM_SEPOLIA_RPC_URL and PRIVATE_KEY (testnet only)
pnpm hardhat compile
pnpm hardhat run --network arb-sepolia scripts/deploy.ts
```

Copy the deployed contract address.

### 5. Fill in `.env.local`

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_REOWN_PROJECT_ID=<from step 2>
NEXT_PUBLIC_CONVEX_URL=<set by step 3>
NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS=<from step 4>
NEXT_PUBLIC_CHAIN_ID=421614
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How a verification works end-to-end

1. **Tenant** connects wallet → picks "Tenant" role on `/onboarding` (locked to their wallet).
2. On `/profile`, tenant enters salary / credit / employment. Values are encrypted by `cofhejs` and submitted to `TrstItVerifier.submitProfile(...)` on-chain. Ciphertext handles are also mirrored to Convex for fast lookup.
3. **Landlord** connects wallet → picks "Landlord" role → on `/landlord/requests/new`, defines rent, income multiplier, min credit, min tenure. Convex generates an unguessable `shareSlug`.
4. Landlord copies `/verify/[shareSlug]` and sends it (off-platform) to the tenant.
5. Tenant opens the link, reviews the requirements, clicks **Run verification**:
   - Wallet signs a tx calling `TrstItVerifier.verify(minSalary, minCredit, minEmployment)`.
   - Contract computes three `FHE.gte(...)` comparisons on the encrypted profile, queues `FHE.decrypt(...)` for each boolean.
   - Frontend polls `readVerification(vid)` until the threshold network produces the three booleans.
   - Booleans + overall verdict are written to Convex `results`.
6. **Both parties** can open `/results/[id]` and see per-requirement pass/fail + overall eligibility. Neither side ever sees the raw numbers.

---

## Project layout

```
app/                    # Next.js App Router pages
  /onboarding           # First-connect role selection (locked)
  /dashboard            # Tenant home
  /profile              # Tenant: create/edit encrypted profile
  /landlord             # Landlord home
  /landlord/requests/   # Create + view requests
  /verify/[shareSlug]   # Tenant runs verification
  /results/[resultId]   # Shared result page
components/             # UI primitives + wallet + role guard
convex/                 # Schema + queries + mutations
  schema.ts             # users / profiles / requests / results
  users.ts profiles.ts requests.ts results.ts
contracts/
  TrstItVerifier.sol    # FHE smart contract
  TrstItVerifier.abi.json
  README.md             # Deploy instructions
lib/
  fhe.ts                # cofhejs init + encrypt
  contract.ts           # ethers-based contract reads/writes
  wallet.ts             # Reown AppKit + wagmi adapter
  constants.ts          # chain + env config
  use-eip1193.ts        # hook to get raw EIP-1193 provider
```

---

## What's intentionally **not** in this MVP

- Property marketplace, listings, messaging, payments, reviews
- Real-world KYC, credit bureau integrations
- Verifiable income/credit attestations (roadmap: replace self-reported values)
- Request templates, notifications, multi-unit management

## Roadmap signals

- **Verifiable inputs.** Today the tenant self-reports values. Next: pluggable attestation sources (employer, bank, payroll) so landlords can trust the underlying numbers.
- **Eligibility badge.** Reusable proof-of-pass that works across landlords without re-running.
- **"What the landlord sees" preview.** Show tenants exactly what is and isn't revealed before they click Run.
- **Expiring requests / results.** Time-boxed verifications.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run convex:dev` | Watch Convex functions, regenerate types |
| `npm run convex:deploy` | Deploy Convex to production |

---

## License

MIT
