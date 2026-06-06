"use client";

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { connect, disconnect } from "wagmi/actions";
import { ACTIVE_CHAIN } from "./constants";
import { e2eAddressForRole, isE2EMode, type E2ERole } from "./e2e";
import {
  getE2EActiveAccount,
  installE2EEthereumProvider,
  setE2EActiveAccount,
} from "./e2e-ethereum";

let e2eConfig: ReturnType<typeof createConfig> | null = null;

function resolveConnectAddress(role: E2ERole): `0x${string}` {
  if (typeof window !== "undefined") {
    const override = sessionStorage.getItem("e2eAddress");
    if (override?.startsWith("0x")) {
      return override as `0x${string}`;
    }
  }
  return e2eAddressForRole(role);
}

export function getE2EWagmiConfig() {
  if (!e2eConfig) {
    installE2EEthereumProvider();
    e2eConfig = createConfig({
      chains: [ACTIVE_CHAIN],
      connectors: [injected()],
      transports: {
        [ACTIVE_CHAIN.id]: http(),
      },
      ssr: true,
    });
  }
  return e2eConfig;
}

export async function connectE2EWallet(role: E2ERole = "tenant") {
  if (!isE2EMode()) {
    throw new Error("connectE2EWallet is only available in E2E mode.");
  }

  const config = getE2EWagmiConfig();
  const address = resolveConnectAddress(role);

  try {
    await disconnect(config);
  } catch {
    // ignore if not connected
  }

  setE2EActiveAccount(address);
  const provider = installE2EEthereumProvider();
  const extended = provider as typeof provider & {
    _emitAccountsChanged?: (accounts: string[]) => void;
  };
  extended._emitAccountsChanged?.([address]);

  const connector = config.connectors[0];
  await connect(config, { connector, chainId: ACTIVE_CHAIN.id });
}

export function getConnectedE2EAddress(): `0x${string}` | null {
  return getE2EActiveAccount();
}
