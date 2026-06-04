"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { WalletConnectButton } from "@/components/wallet-connect";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

export function Header() {
  const { address, isConnected } = useAccount();
  const pathname = usePathname() ?? "/";

  const user = useQuery(
    api.users.get,
    isConnected && address ? { walletAddress: address.toLowerCase() } : "skip"
  );

  const role = user?.role;
  const links: { href: string; label: string; active: boolean }[] = [];
  if (role === "tenant") {
    links.push(
      { href: "/dashboard", label: "Dashboard", active: pathname.startsWith("/dashboard") },
      { href: "/profile", label: "Profile", active: pathname.startsWith("/profile") }
    );
  } else if (role === "landlord") {
    links.push(
      { href: "/landlord", label: "Requests", active: pathname.startsWith("/landlord") }
    );
  }

  return (
    <header className="border-b border-ink-200 bg-white">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-ink-900"
          >
            Tr<span className="text-brand-500">*</span>st.it
          </Link>
          {links.length > 0 ? (
            <nav className="hidden sm:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium",
                    l.active
                      ? "bg-ink-100 text-ink-900"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {role ? (
            <span className="hidden sm:inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-700 capitalize">
              {role}
            </span>
          ) : null}
          <WalletConnectButton size="sm" />
        </div>
      </Container>
    </header>
  );
}
