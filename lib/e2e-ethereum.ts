"use client";

import type { Eip1193Provider } from "ethers";
import { ACTIVE_CHAIN } from "./constants";

type Listener = (...args: unknown[]) => void;

let activeAccount: `0x${string}` | null = null;

export function setE2EActiveAccount(address: `0x${string}` | null) {
  activeAccount = address;
}

export function getE2EActiveAccount(): `0x${string}` | null {
  return activeAccount;
}

export function createE2EEthereumProvider(): Eip1193Provider & {
  on: (event: string, listener: Listener) => void;
  removeListener: (event: string, listener: Listener) => void;
} {
  const listeners = new Map<string, Set<Listener>>();

  const emit = (event: string, ...args: unknown[]) => {
    listeners.get(event)?.forEach((fn) => fn(...args));
  };

  return {
    on(event: string, listener: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    },
    removeListener(event: string, listener: Listener) {
      listeners.get(event)?.delete(listener);
    },
    async request({ method, params }: { method: string; params?: unknown[] }) {
      const chainHex = `0x${ACTIVE_CHAIN.id.toString(16)}`;

      switch (method) {
        case "eth_chainId":
          return chainHex;
        case "net_version":
          return String(ACTIVE_CHAIN.id);
        case "eth_accounts":
        case "eth_requestAccounts":
          return activeAccount ? [activeAccount] : [];
        case "wallet_requestPermissions":
        case "wallet_getPermissions":
          return [{ parentCapability: "eth_accounts" }];
        case "personal_sign":
        case "eth_sign":
        case "eth_signTypedData":
        case "eth_signTypedData_v4":
          return `0x${"00".repeat(65)}`;
        case "eth_sendTransaction":
          return `0x${"ab".repeat(32)}`;
        case "eth_getBalance":
          return "0x56bc75e2d63100000";
        case "eth_blockNumber":
          return "0x1";
        default:
          if (method.startsWith("eth_") || method.startsWith("wallet_")) {
            return null;
          }
          throw new Error(`E2E provider: unsupported method ${method}`);
      }
    },
    // Called after connect to notify wagmi injected connector
    _emitAccountsChanged: (accounts: string[]) => emit("accountsChanged", accounts),
    _emitChainChanged: (chainId: string) => emit("chainChanged", chainId),
  } as Eip1193Provider & {
    on: (event: string, listener: Listener) => void;
    removeListener: (event: string, listener: Listener) => void;
    _emitAccountsChanged: (accounts: string[]) => void;
    _emitChainChanged: (chainId: string) => void;
  };
}

export function installE2EEthereumProvider(): Eip1193Provider {
  const provider = createE2EEthereumProvider();
  if (typeof window !== "undefined") {
    (window as Window & { ethereum?: Eip1193Provider }).ethereum = provider;
  }
  return provider;
}
