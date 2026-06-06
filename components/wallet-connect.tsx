"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/format";
import { isE2EMode, type E2ERole } from "@/lib/e2e";
import { openAppKit } from "@/lib/wallet";

function detectE2ERole(): E2ERole {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/landlord")) {
    return "landlord";
  }
  return "tenant";
}

export function WalletConnectButton({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <Button
          variant="secondary"
          size={size}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="h-2 w-2 rounded-full bg-success-500" />
          {formatAddress(address)}
        </Button>
        {menuOpen ? (
          <div className="absolute right-0 mt-2 w-44 rounded-md border border-ink-200 bg-white shadow-soft z-50 overflow-hidden dark:border-white/12 dark:bg-night-800 dark:shadow-glow-sm">
            <button
              className="block w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50 dark:text-white/80 dark:hover:bg-white/5"
              onClick={() => {
                setMenuOpen(false);
                openAppKit("Account");
              }}
            >
              Account
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50 dark:text-white/80 dark:hover:bg-white/5"
              onClick={() => {
                setMenuOpen(false);
                disconnect();
              }}
            >
              Disconnect
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      onClick={() =>
        openAppKit("Connect", isE2EMode() ? detectE2ERole() : undefined)
      }
    >
      Connect wallet
    </Button>
  );
}
