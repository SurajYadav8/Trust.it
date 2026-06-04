"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { Config } from "wagmi";
import { initAppKit, wagmiConfig } from "@/lib/wallet";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

// Initialise Reown AppKit as soon as the client bundle is evaluated, so any
// component that calls `useAppKit()` on first render has the singleton ready.
initAppKit();

export function Providers({ children }: { children: ReactNode }) {
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

  return (
    <WagmiProvider config={wagmiConfig as unknown as Config}>
      <QueryClientProvider client={queryClient}>
        <ConvexProvider client={convex}>{children}</ConvexProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
