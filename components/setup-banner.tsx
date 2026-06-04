"use client";

import { useEffect, useState } from "react";
import { CONTRACT_ADDRESS, REOWN_PROJECT_ID } from "@/lib/constants";

export function SetupBanner() {
  const [dismissed, setDismissed] = useState(true);

  const missing: string[] = [];
  if (!REOWN_PROJECT_ID) missing.push("NEXT_PUBLIC_REOWN_PROJECT_ID");
  if (!process.env.NEXT_PUBLIC_CONVEX_URL)
    missing.push("NEXT_PUBLIC_CONVEX_URL");
  if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS))
    missing.push("NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(
      window.sessionStorage.getItem("trstit-setup-banner-dismissed") === "1"
    );
  }, []);

  if (dismissed || missing.length === 0) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-2 flex items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
        <span>
          <strong className="font-semibold">Setup required:</strong>{" "}
          {missing.length === 1
            ? `${missing[0]} is missing.`
            : `${missing.length} environment variables missing: ${missing.join(", ")}.`}{" "}
          See <code>README.md</code>.
        </span>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.setItem(
              "trstit-setup-banner-dismissed",
              "1"
            );
            setDismissed(true);
          }}
          className="text-amber-700 hover:text-amber-900 flex-shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
