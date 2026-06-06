import { arbitrumSepolia, sepolia } from "viem/chains";
import type { Chain } from "viem";

export const REOWN_PROJECT_ID = (
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? ""
).trim();

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS ?? ""
).trim() as `0x${string}`;

const overrideChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0);

export const ACTIVE_CHAIN: Chain =
  overrideChainId === sepolia.id ? sepolia : arbitrumSepolia;

export const APP_METADATA = {
  name: "Trst.it",
  description:
    "Confidential rental screening - prove you qualify without revealing why.",
  url: "https://trst.it",
  icons: ["https://trst.it/icon.png"],
};

export const FHE_ENVIRONMENT: "MOCK" | "TESTNET" | "MAINNET" | "LOCAL" =
  "TESTNET";

export const SALARY_MIN = 0;
export const SALARY_MAX = 10_000_000;
export const CREDIT_MIN = 300;
export const CREDIT_MAX = 850;
export const EMPLOYMENT_MAX_MONTHS = 600;
