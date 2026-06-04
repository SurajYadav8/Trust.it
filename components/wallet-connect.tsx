"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/format";
import { initAppKit } from "@/lib/wallet";

function openAppKit(view: "Connect" | "Account") {
  if (typeof window === "undefined") return;
  const kit = initAppKit();
  if (!kit) return;
  void (kit as unknown as {
    open: (opts?: { view?: string }) => Promise<unknown>;
  }).open({ view });
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
          <div className="absolute right-0 mt-2 w-44 rounded-md border border-ink-200 bg-white shadow-soft z-50 overflow-hidden">
            <button
              className="block w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
              onClick={() => {
                setMenuOpen(false);
                openAppKit("Account");
              }}
            >
              Account
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
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
      onClick={() => openAppKit("Connect")}
    >
      Connect wallet
    </Button>
  );
}
