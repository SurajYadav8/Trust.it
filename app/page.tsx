"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useAccount } from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { initAppKit } from "@/lib/wallet";
import { formatAddress } from "@/lib/format";
import { ThemeToggle } from "@/components/theme-toggle";
import { Spinner } from "@/components/ui/spinner";

function openAppKit(view: "Connect" | "Account") {
  if (typeof window === "undefined") return;
  const kit = initAppKit();
  if (!kit) return;
  void (
    kit as unknown as {
      open: (opts?: { view?: string }) => Promise<unknown>;
    }
  ).open({ view });
}

const WORDMARK = ["T", "r", "*", "s", "t", ".", "i", "t"];
// Letters + numbers + symbols for the decode cipher (no </>{}[] to avoid
// clashing with the static frame brackets around the logo).
const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$@=+?";

type Step = "connect" | "confirm" | "role";

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const { address, isConnected } = useAccount();

  // Onboarding step machine:
  //   connect  -> hero + "Connect wallet to enter"
  //   confirm  -> hero + "Wallet connected ✓" (brief success beat)
  //   role     -> hero fades out, replaced by role selection
  const [step, setStep] = useState<Step>(isConnected ? "confirm" : "connect");

  useEffect(() => {
    if (!isConnected) {
      setStep("connect");
    } else {
      setStep((s) => (s === "connect" ? "confirm" : s));
    }
  }, [isConnected]);

  useEffect(() => {
    if (step !== "confirm") return;
    const t = setTimeout(() => setStep("role"), reduceMotion ? 0 : 1000);
    return () => clearTimeout(t);
  }, [step, reduceMotion]);

  const ease = HERO_EASE;

  // Entry sequence on every load/refresh:
  //   idle (background only) → enter hero → decode wordmark → enable UI.
  const [entryPhase, setEntryPhase] = useState<EntryPhase>(
    reduceMotion ? "ready" : "idle"
  );

  useEffect(() => {
    if (reduceMotion || entryPhase !== "idle") return;
    const t = setTimeout(() => setEntryPhase("enter"), 160);
    return () => clearTimeout(t);
  }, [entryPhase, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || entryPhase !== "enter") return;
    const t = setTimeout(() => setEntryPhase("decode"), HERO_ENTER_MS + 280);
    return () => clearTimeout(t);
  }, [entryPhase, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || entryPhase !== "decode") return;
    const t = setTimeout(() => setEntryPhase("ready"), DECODE_TOTAL_MS);
    return () => clearTimeout(t);
  }, [entryPhase, reduceMotion]);

  const entryReady = entryPhase === "ready";
  const decodeActive = entryPhase === "decode";

  const showRole = step === "role" && !!address;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50 text-ink-900 transition-colors duration-500 dark:bg-night-950 dark:text-white">
      <Background reduceMotion={!!reduceMotion} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <LandingHeader
          address={address}
          isConnected={isConnected}
          entryReady={entryReady}
          reduceMotion={!!reduceMotion}
        />

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:py-32">
          <AnimatePresence mode="wait" initial={false}>
            {showRole ? (
              /* ---- Step 2: role selection replaces the hero entirely ---- */
              <motion.div
                key="role"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease }}
                className="w-full"
              >
                <RoleSelect address={address} reduceMotion={!!reduceMotion} />
              </motion.div>
            ) : (
              /* ---- Step 1: hero (connect / confirm action slot) ---- */
              <motion.div
                key="hero"
                variants={heroContainerVariants}
                initial={reduceMotion ? false : "hidden"}
                animate={
                  reduceMotion
                    ? undefined
                    : entryPhase === "idle"
                      ? "hidden"
                      : entryPhase === "enter"
                        ? "enter"
                        : "visible"
                }
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease }}
                className="flex flex-col items-center"
              >
                <Wordmark
                  reduceMotion={!!reduceMotion}
                  decodeActive={decodeActive}
                  interactionsEnabled={entryReady}
                />

                {/* Tagline */}
                <motion.p
                  variants={heroItemVariants}
                  className="mt-12 max-w-md text-base font-light tracking-wide text-ink-500 sm:text-lg dark:text-white/70"
                >
                  Prove trust. Not your data.
                </motion.p>

                {/* Powered by Fhenix */}
                <motion.div
                  variants={heroItemVariants}
                  className="mt-10 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-ink-400 dark:text-white/35"
                >
                  <span className="h-px w-6 bg-ink-300/60 dark:bg-white/15" />
                  <span>
                    Powered by{" "}
                    <span className="text-brand-600 dark:text-white/55">
                      Fhenix
                    </span>
                  </span>
                  <span className="h-px w-6 bg-ink-300/60 dark:bg-white/15" />
                </motion.div>

                {/* Action slot — appears after decode completes */}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={
                    entryReady
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 16 }
                  }
                  transition={{ duration: 0.55, ease }}
                  className={`mt-16 w-full ${entryReady ? "" : "pointer-events-none"}`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {step === "confirm" ? (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex justify-center"
                      >
                        <span className="inline-flex items-center gap-2.5 rounded-full border border-accent-400/40 bg-accent-400/10 px-5 py-2.5 text-sm font-medium text-brand-700 shadow-glow-sm dark:text-accent-100">
                          <CheckBadge />
                          Wallet connected
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="connect"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex justify-center"
                      >
                        <button
                          type="button"
                          disabled={!entryReady}
                          onClick={() => openAppKit("Connect")}
                          className="group inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-7 py-3 text-sm font-medium text-ink-800 shadow-[0_1px_2px_rgba(15,18,24,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#001623] hover:bg-[#001623] hover:text-white hover:shadow-glow-sm disabled:cursor-default disabled:opacity-0 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/80 dark:shadow-none dark:backdrop-blur-sm dark:hover:border-[#001623] dark:hover:bg-[#001623] dark:hover:text-white"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                          Connect wallet to enter
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wordmark with the signature decrypt / scramble hover interaction.   */
/* ------------------------------------------------------------------ */

// Decode timing (ms). Calm + smooth, not "hacker-fast".
const LOAD_BASE_MS = 440; // base cipher time for the load intro
const LOAD_STAGGER_MS = 90; // extra cipher time per character index
const GLYPH_INTERVAL_MS = 72; // cadence of glyph swaps (higher = slower/smoother)
const SETTLE_GLYPHS = 3; // glyph swaps after the cursor leaves, before locking

// Hero entry sequence (runs on every page load / refresh).
const HERO_ENTER_MS = 900; // fade + rise duration for hero block
const HERO_STAGGER_S = 0.13; // stagger between wordmark / tagline / powered-by
const HERO_EASE = [0.16, 1, 0.3, 1] as const;
const DECODE_TOTAL_MS =
  LOAD_BASE_MS + (WORDMARK.length - 1) * LOAD_STAGGER_MS + 700;

type EntryPhase = "idle" | "enter" | "decode" | "ready";

const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { staggerChildren: HERO_STAGGER_S, delayChildren: 0.06 },
  },
  visible: { opacity: 1 },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: HERO_ENTER_MS / 1000, ease: HERO_EASE },
  },
  visible: { opacity: 1, y: 0 },
};

function randomGlyph() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

/**
 * A single, independently interactive logo character. Only letters decode.
 * Hovering ONE letter cycles ONLY that letter — and it keeps cycling for as
 * long as the cursor stays on it, then settles back smoothly on leave.
 * Monospace + per-character padding give each glyph room, so swaps read clearly
 * and never shift the hero. The "*" and "." never change.
 */
function DecodeChar({
  target,
  index,
  reduceMotion,
  decodeActive,
  interactionsEnabled,
}: {
  target: string;
  index: number;
  reduceMotion: boolean;
  decodeActive: boolean;
  interactionsEnabled: boolean;
}) {
  const isStar = target === "*";
  const isDot = target === ".";
  const animatable = !isStar && !isDot; // ONLY letters animate
  const [glyph, setGlyph] = useState(target);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoveredRef = useRef(false);
  const settleRef = useRef(0);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startLoop = useCallback(() => {
    if (reduceMotion || !animatable) return;
    if (intervalRef.current != null) return; // already running
    intervalRef.current = setInterval(() => {
      if (hoveredRef.current) {
        setGlyph(randomGlyph()); // keep cycling for as long as it's hovered
      } else if (settleRef.current > 0) {
        settleRef.current -= 1;
        setGlyph(randomGlyph()); // a couple more frames, then resolve
      } else {
        setGlyph(target); // lock back to the real character
        stopLoop();
      }
    }, GLYPH_INTERVAL_MS);
  }, [reduceMotion, animatable, target, stopLoop]);

  const onEnter = () => {
    if (!animatable || !interactionsEnabled) return;
    hoveredRef.current = true;
    settleRef.current = 0;
    startLoop();
  };
  const onLeave = () => {
    if (!animatable || !interactionsEnabled) return;
    hoveredRef.current = false;
    settleRef.current = SETTLE_GLYPHS;
  };

  // Staggered decode — starts only after the hero entrance settles.
  useEffect(() => {
    if (!decodeActive || reduceMotion || !animatable) return;
    setGlyph(randomGlyph());
    hoveredRef.current = true;
    startLoop();
    const dur = LOAD_BASE_MS + index * LOAD_STAGGER_MS;
    const release = setTimeout(() => {
      hoveredRef.current = false;
      settleRef.current = 2;
    }, dur);
    // Hard safety: always resolve to the real glyph, even if a frame stalls.
    const hardStop = setTimeout(() => {
      hoveredRef.current = false;
      settleRef.current = 0;
      stopLoop();
      setGlyph(target);
    }, dur + 600);
    return () => {
      clearTimeout(release);
      clearTimeout(hardStop);
    };
  }, [
    decodeActive,
    reduceMotion,
    animatable,
    index,
    target,
    startLoop,
    stopLoop,
  ]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  // The "*" signature: never changes, constant cyan glow (both themes).
  if (isStar) {
    return (
      <span
        aria-hidden="true"
        className="inline-block px-[0.07em] text-accent-500 dark:text-accent-400"
        style={{
          filter:
            "drop-shadow(0 0 7px rgba(34,211,238,0.55)) drop-shadow(0 0 18px rgba(34,211,238,0.3))",
        }}
      >
        *
      </span>
    );
  }

  if (isDot) {
    return (
      <span
        aria-hidden="true"
        className="inline-block px-[0.05em] text-ink-900 transition-colors duration-500 dark:text-white"
      >
        .
      </span>
    );
  }

  return (
    <span
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={interactionsEnabled ? 0 : -1}
      aria-hidden="true"
      className={`inline-block w-[0.66em] text-center text-ink-900 outline-none transition-colors duration-500 dark:text-white ${
        interactionsEnabled
          ? "cursor-default"
          : "pointer-events-none cursor-default"
      }`}
    >
      {glyph}
    </span>
  );
}

function Wordmark({
  reduceMotion,
  decodeActive,
  interactionsEnabled,
}: {
  reduceMotion: boolean;
  decodeActive: boolean;
  interactionsEnabled: boolean;
}) {
  const bracket =
    "select-none font-light leading-none text-ink-300/80 dark:text-white/20 text-[0.5em]";

  return (
    <motion.div
      variants={heroItemVariants}
      role="img"
      aria-label="Trst.it"
      className="flex cursor-default select-none items-center justify-center gap-[0.22em] text-[clamp(2.6rem,9vw,7rem)] font-semibold leading-none"
    >
      <span aria-hidden="true" className={bracket}>
        &lt;
      </span>

      <span aria-hidden="true" className="flex items-end font-mono tracking-tight">
        {WORDMARK.map((char, i) => (
          <DecodeChar
            key={i}
            target={char}
            index={i}
            reduceMotion={reduceMotion}
            decodeActive={decodeActive}
            interactionsEnabled={interactionsEnabled}
          />
        ))}
      </span>

      <span aria-hidden="true" className={bracket}>
        &gt;
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function LandingHeader({
  address,
  isConnected,
  entryReady,
  reduceMotion,
}: {
  address?: `0x${string}`;
  isConnected: boolean;
  entryReady: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={
        entryReady || reduceMotion
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: -10 }
      }
      transition={{ duration: 0.65, ease: HERO_EASE }}
      className={`flex items-center justify-between px-6 py-6 sm:px-10 ${
        entryReady ? "" : "pointer-events-none"
      }`}
    >
      <Link
        href="/"
        className="text-base font-semibold tracking-tight text-ink-900 transition-colors hover:text-brand-600 dark:text-white/90 dark:hover:text-white"
      >
        Tr<span className="text-accent-500 dark:text-accent-400">*</span>st.it
      </Link>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {isConnected && address ? (
          <button
            type="button"
            onClick={() => openAppKit("Account")}
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-4 py-2 text-xs font-medium text-ink-700 backdrop-blur-sm transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-white/12 dark:bg-white/[0.04] dark:text-white/80 dark:hover:border-accent-400/50 dark:hover:text-white"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            {formatAddress(address)}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAppKit("Connect")}
            className="inline-flex items-center rounded-full border border-ink-300 bg-white/70 px-4 py-2 text-xs font-medium text-ink-800 backdrop-blur-sm transition-all hover:border-[#001623] hover:bg-[#001623] hover:text-white dark:border-white/15 dark:bg-white/[0.04] dark:text-white/85 dark:hover:border-[#001623] dark:hover:bg-[#001623] dark:hover:text-white"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/* Onboarding success badge + role selection                           */
/* ------------------------------------------------------------------ */

function CheckBadge() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-night-950 shadow-[0_0_10px_rgba(34,211,238,0.7)]">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Radio-style indicator: empty ring (○) by default, cyan check (✓) on
 *  hover and when selected. */
function RoleRadio({ selected }: { selected: boolean }) {
  return (
    <span
      className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
        selected
          ? "border-accent-500 bg-accent-500 text-night-950"
          : "border-ink-300 text-accent-500 group-hover:border-accent-400 group-hover:bg-accent-400/10 dark:border-white/25 dark:text-accent-300"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-3 w-3 transition-opacity duration-200 ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function RoleCard({
  title,
  description,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`group relative flex flex-col gap-2 rounded-2xl border p-5 text-left transition-all duration-300 disabled:cursor-not-allowed ${
        selected
          ? "-translate-y-0.5 border-accent-500 bg-accent-50/70 shadow-glow ring-1 ring-accent-400/40 dark:border-accent-400 dark:bg-accent-400/10"
          : "border-ink-200 bg-white shadow-[0_1px_2px_rgba(15,18,24,0.05)] hover:-translate-y-0.5 hover:border-accent-400 hover:shadow-glow-sm disabled:opacity-50 dark:border-white/12 dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-sm dark:hover:border-accent-400/50"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <RoleRadio selected={selected} />
        <span className="text-base font-semibold text-ink-900 dark:text-white">
          {selected ? "Entering…" : title}
        </span>
      </span>
      <span className="text-xs leading-relaxed text-ink-500 dark:text-white/50">
        {description}
      </span>
    </button>
  );
}

function RoleSelect({
  address,
  reduceMotion,
}: {
  address: `0x${string}`;
  reduceMotion: boolean;
}) {
  const router = useRouter();
  const user = useQuery(api.users.get, {
    walletAddress: address.toLowerCase(),
  });
  const setRole = useMutation(api.users.setRole);
  const [busy, setBusy] = useState<"tenant" | "landlord" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enter = async (role: "tenant" | "landlord") => {
    setBusy(role);
    setError(null);
    try {
      await setRole({ walletAddress: address.toLowerCase(), role });
      router.push(role === "tenant" ? "/dashboard" : "/landlord");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  };

  // Returning user who already has a role: offer a single clean entry.
  if (user && user.role) {
    const href = user.role === "tenant" ? "/dashboard" : "/landlord";
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-full border border-accent-400/50 bg-accent-400/10 px-7 py-3 text-sm font-medium text-brand-700 shadow-glow transition-all duration-300 hover:border-[#001623] hover:bg-[#001623] hover:text-white dark:text-accent-100 dark:hover:text-white"
        >
          Enter Trst.it
          <span className="transition-transform duration-300 group-hover:translate-x-0.5">
            &rarr;
          </span>
        </Link>
      </motion.div>
    );
  }

  // Still resolving the wallet's role.
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-ink-500 dark:text-white/45">
        <Spinner /> Reading your wallet…
      </div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-md"
    >
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-2xl">
          Choose Your Role
        </h2>
        <p className="mt-1.5 text-sm text-ink-500 dark:text-white/55">
          How would you like to use Tr
          <span className="text-accent-500 dark:text-accent-400">*</span>st.it?
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RoleCard
          title="Tenant"
          description="Prove you qualify without exposing your data."
          selected={busy === "tenant"}
          disabled={busy !== null}
          onSelect={() => enter("tenant")}
        />
        <RoleCard
          title="Landlord"
          description="Verify applicants without viewing sensitive information."
          selected={busy === "landlord"}
          disabled={busy !== null}
          onSelect={() => enter("landlord")}
        />
      </div>
      <div className="mt-5 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/10 px-3 py-1.5 text-[0.72rem] font-medium text-brand-700 dark:border-accent-400/30 dark:bg-accent-400/[0.08] dark:text-accent-200">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-accent-600 dark:text-accent-300"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="5"
              y="11"
              width="14"
              height="9"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M8 11V8a4 4 0 1 1 8 0v3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Your role is locked to this wallet.
        </span>
      </div>
      {error ? (
        <p className="mt-3 text-xs text-danger-600 dark:text-danger-500">
          {error}
        </p>
      ) : null}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Ambient background (theme-aware)                                    */
/* ------------------------------------------------------------------ */

function Background({ reduceMotion }: { reduceMotion: boolean }) {
  // Deterministic positions so SSR and client markup match (no hydration drift).
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const rnd = seed / 233280;
        const seed2 = (i * 4096 + 150889) % 714025;
        const rnd2 = seed2 / 714025;
        return {
          left: 6 + rnd * 88,
          top: 12 + rnd2 * 70,
          size: 1.5 + (i % 3),
          duration: 9 + (i % 5) * 2,
          delay: (i % 7) * 0.6,
        };
      }),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base surface — paired layers crossfade on theme change (no flash). */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FCFCFB] via-[#F3F5F8] to-[#E6EAF0] opacity-100 transition-opacity duration-[600ms] ease-in-out dark:opacity-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900 via-night-950 to-black opacity-0 transition-opacity duration-[600ms] ease-in-out dark:opacity-100" />

      {/* Light-only: soft cyan radial glow from the top for depth + life. */}
      <div className="landing-aurora absolute inset-0 opacity-100 transition-opacity duration-[600ms] ease-in-out dark:opacity-0" />

      {/* Drifting privacy grid */}
      <div
        className={`absolute inset-0 landing-grid ${
          reduceMotion ? "" : "animate-grid-drift"
        }`}
      />

      {/* Soft cyan glow behind the logo */}
      <div
        className={`absolute inset-0 landing-glow ${
          reduceMotion ? "" : "animate-pulse-glow"
        }`}
      />

      {/* Gentle encryption particles */}
      {!reduceMotion &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-accent-500/40 dark:bg-accent-300/40"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.1, 0.45, 0.1] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* Bottom grounding fade — crossfaded per theme */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#E6EAF0] to-transparent opacity-100 transition-opacity duration-[600ms] ease-in-out dark:opacity-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent opacity-0 transition-opacity duration-[600ms] ease-in-out dark:opacity-100" />
    </div>
  );
}
