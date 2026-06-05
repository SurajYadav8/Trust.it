"use client";

import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/format";

export function Footer() {
  const pathname = usePathname() ?? "/";

  // The landing route is a full-screen, self-contained experience.
  if (pathname === "/") return null;

  return (
    <footer className="border-t border-ink-200 bg-white dark:border-white/10 dark:bg-night-900/80 dark:backdrop-blur">
      <Container className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500 dark:text-white/45">
        <div>
          &copy; {new Date().getFullYear()} Trst.it &middot; Confidential
          rental screening
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            Powered by <FhenixLogo />
          </span>
        </div>
      </Container>
    </footer>
  );
}

function FhenixLogo({ className }: { className?: string }) {
  return (
    <a
      href="https://fhenix.io"
      target="_blank"
      rel="noreferrer"
      aria-label="Fhenix"
      className={cn(
        "inline-flex items-baseline font-mono text-[0.95rem] font-bold leading-none no-underline transition-opacity hover:opacity-80",
        className
      )}
    >
      <span className="text-ink-400 dark:text-white/45">(</span>
      <span className="text-ink-900 dark:text-white">fhenix</span>
      <span className="text-accent-500 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] dark:text-accent-400 dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.75)]">
        *
      </span>
      <span className="text-ink-400 dark:text-white/45">)</span>
    </a>
  );
}
