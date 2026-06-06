"use client";

import { ReactNode, useLayoutEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { Config } from "wagmi";
import { initAppKit, wagmiConfig } from "@/lib/wallet";
import { isE2EMode } from "@/lib/e2e";
import { ThemeProvider } from "@/lib/theme";
import { AppKitAutoClose } from "@/components/appkit-auto-close";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

initAppKit();

function useResolvedWagmiConfig(): Config | null {
  const [config, setConfig] = useState<Config | null>(
    isE2EMode() ? null : (wagmiConfig as unknown as Config)
  );

  useLayoutEffect(() => {
    if (!isE2EMode()) return;
    void import("@/lib/e2e-wagmi")
      .then((m) => {
        setConfig(m.getE2EWagmiConfig() as unknown as Config);
      })
      .catch((err) => {
        console.error("[Trst.it E2E] wagmi config failed, falling back:", err);
        setConfig(wagmiConfig as unknown as Config);
      });
  }, []);

  return config;
}

export function Providers({ children }: { children: ReactNode }) {
  const wagmi = useResolvedWagmiConfig();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  if (!wagmi) {
    return (
      <div className="min-h-screen bg-ink-50 dark:bg-night-950" aria-busy="true" />
    );
  }

  return (
    <ThemeProvider>
      <WagmiProvider config={wagmi}>
        <QueryClientProvider client={queryClient}>
          <AppKitAutoClose />
          <ConvexProvider client={convex}>{children}</ConvexProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
