"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { WalletConnectButton } from "@/components/wallet-connect";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

export function Header() {
  const { address, isConnected } = useAccount();
  const pathname = usePathname() ?? "/";

  // The landing route renders its own dark, minimal chrome.
  const isLanding = pathname === "/";

  const user = useQuery(
    api.users.get,
    isConnected && address ? { walletAddress: address.toLowerCase() } : "skip"
  );

  if (isLanding) return null;

  const role = user?.role;
  const links: { href: string; label: string; active: boolean }[] = [];
  if (role === "tenant") {
    links.push(
      { href: "/dashboard", label: "Dashboard", active: pathname.startsWith("/dashboard") },
      { href: "/profile", label: "Profile", active: pathname.startsWith("/profile") }
    );
  } else if (role === "landlord") {
    const onProperties =
      pathname.startsWith("/landlord/properties") ||
      pathname.startsWith("/landlord/requests");
    links.push(
      {
        href: "/landlord",
        label: "Dashboard",
        active: pathname === "/landlord",
      },
      {
        href: "/landlord/properties",
        label: "Properties",
        active: onProperties,
      },
      {
        href: "/landlord/results",
        label: "Results",
        active: pathname.startsWith("/landlord/results"),
      }
    );
  }

  return (
    <header className="border-b border-ink-200 bg-white dark:border-white/10 dark:bg-night-900/80 dark:backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white"
          >
            Tr<span className="text-accent-500 dark:text-accent-400">*</span>st.it
          </Link>
          {links.length > 0 ? (
            <nav className="hidden sm:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    l.active
                      ? "bg-ink-100 text-ink-900 dark:bg-white/10 dark:text-white"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
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
            <span className="hidden sm:inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-700 capitalize dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              {role}
            </span>
          ) : null}
          <ThemeToggle />
          <WalletConnectButton size="sm" />
        </div>
      </Container>
    </header>
  );
}
