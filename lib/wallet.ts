"use client";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arbitrumSepolia, sepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { APP_METADATA, ACTIVE_CHAIN, REOWN_PROJECT_ID } from "./constants";

const networks: [AppKitNetwork, ...AppKitNetwork[]] =
  ACTIVE_CHAIN.id === sepolia.id
    ? [sepolia, arbitrumSepolia]
    : [arbitrumSepolia, sepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: REOWN_PROJECT_ID || "trstit-dev",
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export function initAppKit() {
  if (appKitInstance) return appKitInstance;
  if (typeof window === "undefined") return null;
  if (!REOWN_PROJECT_ID) {
    console.warn(
      "[Trst.it] NEXT_PUBLIC_REOWN_PROJECT_ID is missing. Wallet connect will not work until set."
    );
  }
  appKitInstance = createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId: REOWN_PROJECT_ID || "trstit-dev",
    metadata: APP_METADATA,
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
    themeMode: "light",
    themeVariables: {
      "--w3m-accent": "#3a66f5",
      "--w3m-border-radius-master": "8px",
    },
  });
  return appKitInstance;
}
