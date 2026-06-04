"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import type { Eip1193Provider } from "ethers";

export function useEip1193Provider(): Eip1193Provider | null {
  const { connector, isConnected } = useAccount();
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isConnected || !connector) {
      setProvider(null);
      return;
    }
    (async () => {
      try {
        const p = (await connector.getProvider()) as Eip1193Provider;
        if (!cancelled) setProvider(p);
      } catch {
        if (!cancelled) setProvider(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connector, isConnected]);

  return provider;
}
