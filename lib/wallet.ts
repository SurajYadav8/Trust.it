"use client";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arbitrumSepolia, sepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { APP_METADATA, ACTIVE_CHAIN, REOWN_PROJECT_ID } from "./constants";
import { isE2EMode, type E2ERole } from "./e2e";

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
  if (isE2EMode()) return null;
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
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#06b6d4",
      "--w3m-border-radius-master": "10px",
    },
  });
  return appKitInstance;
}

type AppKitModal = {
  open: (opts?: { view?: string }) => Promise<unknown>;
  close: () => Promise<void>;
};

function getAppKitModal(): AppKitModal | null {
  const kit = initAppKit();
  return kit ? (kit as unknown as AppKitModal) : null;
}

/**
 * Open the wallet modal. Do not pass view: "Connect" — that pins the modal and
 * it stays on "Continue in wallet" after approval (reown-com/appkit#3632).
 */
export function openAppKit(view?: "Connect" | "Account", e2eRole?: E2ERole) {
  if (isE2EMode()) {
    void import("./e2e-wagmi").then((m) =>
      m.connectE2EWallet(e2eRole ?? "tenant")
    );
    return;
  }
  const modal = getAppKitModal();
  if (!modal) return;
  if (view === "Account") {
    void modal.open({ view: "Account" });
    return;
  }
  void modal.open();
}

export function closeAppKit() {
  const modal = getAppKitModal();
  if (!modal) return;
  void modal.close();
}
