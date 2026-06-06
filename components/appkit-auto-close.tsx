"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { closeAppKit } from "@/lib/wallet";

/** Dismiss AppKit when wagmi reports a fresh connection. */
export function AppKitAutoClose() {
  const { isConnected } = useAccount();
  const wasConnected = useRef<boolean | null>(null);

  useEffect(() => {
    if (wasConnected.current === null) {
      wasConnected.current = isConnected;
      return;
    }
    if (isConnected && !wasConnected.current) {
      closeAppKit();
    }
    wasConnected.current = isConnected;
  }, [isConnected]);

  return null;
}
