# TrstItVerifier — FHE contract

Confidential rental screening on Fhenix CoFHE. Stores encrypted tenant profiles, runs encrypted threshold comparisons against landlord requirements, decrypts only the boolean outcomes via the Fhenix Threshold Network.

This folder is a **self-contained Hardhat workspace** — install + deploy from here, no external repo needed.

## What it does

- `submitProfile(InEuint64 salary, InEuint32 credit, InEuint32 employmentMonths)` — tenant stores an encrypted profile.
- `verify(uint64 minSalary, uint32 minCredit, uint32 minEmployment)` — tenant runs three encrypted `>=` comparisons. Queues async decryption of the three booleans.
- `readVerification(uint256 id)` — anyone polls; returns `ready` plus the three pass flags + overall.

Only booleans are ever decrypted. Raw salary / credit / tenure stay encrypted on-chain forever.

## Deploy

### 1. Install

```bash
cd contracts
npm install
```

### 2. Configure deployer

```bash
cp .env.example .env
```

Open `.env` and set:

```env
PRIVATE_KEY=<your testnet wallet private key, without 0x prefix>
```

> **Testnet only.** Never put a real private key here. Use a fresh MetaMask account dedicated to dev. In MetaMask: Account menu → Account details → Show private key.

### 3. Fund the deployer

Get Arbitrum Sepolia ETH from a faucet (you'll need ~0.001 ETH):

- [Alchemy faucet](https://www.alchemy.com/faucets/arbitrum-sepolia)
- [QuickNode faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- [Chainlink faucet](https://faucets.chain.link/arbitrum-sepolia)

Send the deployer address (the one from your `PRIVATE_KEY`) some testnet ETH.

### 4. Compile

```bash
npm run compile
```

### 5. Deploy to Arbitrum Sepolia

```bash
npm run deploy:arb-sepolia
```

The script prints the deployer address, balance, and the deployed contract address. Copy the address.

### 6. Wire into the app

In the **project root** `.env.local` (one folder up):

```env
NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS=0x<your address>
```

Restart `npm run dev` so Next.js picks it up.

## Networks

| Network | chainId | Script |
| --- | --- | --- |
| Arbitrum Sepolia (recommended) | 421614 | `npm run deploy:arb-sepolia` |
| Ethereum Sepolia | 11155111 | `npm run deploy:sepolia` |

Both have CoFHE coprocessor support. Arbitrum Sepolia is cheaper and faster.

## Files

```
contracts/
  TrstItVerifier.sol         # the contract
  TrstItVerifier.abi.json    # ABI used by the Next.js app
  hardhat.config.ts          # Hardhat config (Solidity 0.8.25, evmVersion: cancun)
  scripts/deploy.ts          # deploy script
  package.json               # isolated workspace
  .env.example               # PRIVATE_KEY template
```
