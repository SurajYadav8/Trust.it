"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleGuard } from "@/components/role-guard";
import { useEip1193Provider } from "@/lib/use-eip1193";
import { encryptProfile, ensureFheReady } from "@/lib/fhe";
import { submitProfileOnChain, isContractConfigured } from "@/lib/contract";
import { ACTIVE_CHAIN, CREDIT_MIN, SALARY_MAX } from "@/lib/constants";
import { TENANT_EMPLOYMENT_OPTIONS } from "@/lib/employment-duration";

type Currency = "INR" | "USD";
type Step =
  | "intro"
  | "salary"
  | "credit"
  | "employment"
  | "review"
  | "encrypting"
  | "success";

type EncryptField = "salary" | "credit" | "employment";

type EncryptPhase =
  | "preparing"
  | "wallet_wait"
  | "encrypting"
  | "creating"
  | "finalizing";

type ProfileError = { title: string; message: string };

type EncryptUI = {
  phase: EncryptPhase;
  activeField: EncryptField | null;
  completed: Record<EncryptField, boolean>;
};

const ENCRYPT_FIELDS: EncryptField[] = ["salary", "credit", "employment"];

const FIELD_LABELS: Record<EncryptField, string> = {
  salary: "Salary",
  credit: "Credit Score",
  employment: "Employment Duration",
};

const FIELD_STEP_MS = 520;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function completedUpTo(count: number): Record<EncryptField, boolean> {
  return {
    salary: count > 0,
    credit: count > 1,
    employment: count > 2,
  };
}

const CREDIT_WIZARD_MAX = 900;

const ease = [0.16, 1, 0.3, 1] as const;

export default function ProfilePage() {
  return (
    <RoleGuard role="tenant">
      <ProfileWizard />
    </RoleGuard>
  );
}

function detectCurrency(): Currency {
  if (typeof navigator === "undefined") return "INR";
  const locale = navigator.language?.toLowerCase() ?? "";
  if (locale.includes("in") || locale.endsWith("-in")) return "INR";
  if (locale.includes("us") || locale === "en-us") return "USD";
  return "INR";
}

function formatSalaryDisplay(amount: string, currency: Currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const formatted = n.toLocaleString(
    currency === "INR" ? "en-IN" : "en-US",
    { maximumFractionDigits: 0 }
  );
  return currency === "INR" ? `₹${formatted}` : `$${formatted}`;
}

function ProfileWizard() {
  const router = useRouter();
  const { address } = useAccount();
  const walletProvider = useEip1193Provider();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const { data: walletClient } = useWalletClient({ chainId: ACTIVE_CHAIN.id });
  const connectedChainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const onWrongChain = !!address && connectedChainId !== ACTIVE_CHAIN.id;

  const existing = useQuery(
    api.profiles.get,
    address ? { walletAddress: address.toLowerCase() } : "skip"
  );
  const upsert = useMutation(api.profiles.upsert);

  const hasExisting = existing !== undefined && existing !== null;

  const [step, setStep] = useState<Step>("intro");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [salary, setSalary] = useState("");
  const [credit, setCredit] = useState("");
  const [employmentMonths, setEmploymentMonths] = useState<number | null>(null);
  const [employmentLabel, setEmploymentLabel] = useState("");
  const [error, setError] = useState<ProfileError | null>(null);
  const [encryptUI, setEncryptUI] = useState<EncryptUI>({
    phase: "preparing",
    activeField: null,
    completed: { salary: false, credit: false, employment: false },
  });

  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  const salaryError = validateSalary(salary);
  const creditError = validateCredit(credit);

  const handleEncrypt = async () => {
    if (!address || !walletProvider || !publicClient || !walletClient) return;
    if (employmentMonths === null) return;

    setStep("encrypting");
    setError(null);
    setEncryptUI({
      phase: "preparing",
      activeField: null,
      completed: { salary: false, credit: false, employment: false },
    });

    const flow = { walletHold: false };

    const runSequentialEncryptUI = async () => {
      for (let i = 0; i < ENCRYPT_FIELDS.length; i++) {
        while (flow.walletHold) await sleep(150);

        setEncryptUI({
          phase: "encrypting",
          activeField: ENCRYPT_FIELDS[i],
          completed: completedUpTo(i),
        });
        await sleep(FIELD_STEP_MS);

        while (flow.walletHold) await sleep(150);

        setEncryptUI({
          phase: "encrypting",
          activeField:
            i + 1 < ENCRYPT_FIELDS.length ? ENCRYPT_FIELDS[i + 1] : null,
          completed: completedUpTo(i + 1),
        });
      }
    };

    try {
      await ensureFheReady({ publicClient, walletClient, address });

      setEncryptUI({
        phase: "encrypting",
        activeField: "salary",
        completed: completedUpTo(0),
      });

      const encrypted = await Promise.all([
        encryptProfile({
          publicClient,
          walletClient,
          address,
          salary: Number(salary),
          creditScore: Number(credit),
          employmentMonths,
          onWalletRequest: () => {
            flow.walletHold = true;
            setEncryptUI((u) => ({
              ...u,
              phase: "wallet_wait",
              activeField: null,
            }));
          },
          onEncryptProgress: () => {
            flow.walletHold = false;
            setEncryptUI((u) =>
              u.phase === "wallet_wait" ? { ...u, phase: "encrypting" } : u
            );
          },
        }),
        runSequentialEncryptUI(),
      ]).then(([result]) => result);

      flow.walletHold = false;
      setEncryptUI({
        phase: "encrypting",
        activeField: null,
        completed: { salary: true, credit: true, employment: true },
      });

      let txHash: string | undefined;
      if (isContractConfigured()) {
        const tx = await submitProfileOnChain({
          walletProvider,
          salaryCt: encrypted.salaryCt,
          creditCt: encrypted.creditCt,
          employmentCt: encrypted.employmentCt,
          onTxRequested: () => {
            flow.walletHold = true;
            setEncryptUI((u) => ({
              ...u,
              phase: "wallet_wait",
              activeField: null,
            }));
          },
        });
        txHash = tx.txHash;
        flow.walletHold = false;
      }

      setEncryptUI({
        phase: "creating",
        activeField: null,
        completed: { salary: true, credit: true, employment: true },
      });

      await upsert({
        walletAddress: address.toLowerCase(),
        encSalary: encrypted.serialized.salary,
        encCreditScore: encrypted.serialized.credit,
        encEmploymentMonths: encrypted.serialized.employment,
        salaryCurrency: currency,
        onChainTxHash: txHash,
      });

      setEncryptUI({
        phase: "finalizing",
        activeField: null,
        completed: { salary: true, credit: true, employment: true },
      });
      await sleep(750);
      setStep("success");
    } catch (e) {
      setError(mapProfileError(e));
      setStep("review");
    }
  };

  if (existing === undefined) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-ink-100 dark:bg-white/10" />
          <div className="h-4 w-full rounded bg-ink-50 dark:bg-white/[0.06]" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-lg">
        {step === "salary" || step === "credit" || step === "employment" ? (
          <StepIndicator step={step} />
        ) : null}

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <WizardScreen key="intro">
              <IntroStep
                isUpdate={hasExisting}
                onStart={() => setStep("salary")}
              />
            </WizardScreen>
          )}

          {step === "salary" && (
            <WizardScreen key="salary">
              <SalaryStep
                salary={salary}
                currency={currency}
                error={salaryError}
                onSalaryChange={setSalary}
                onCurrencyChange={setCurrency}
                onBack={() => setStep("intro")}
                onContinue={() => setStep("credit")}
                canContinue={!!salary && !salaryError}
              />
            </WizardScreen>
          )}

          {step === "credit" && (
            <WizardScreen key="credit">
              <CreditStep
                credit={credit}
                error={creditError}
                onCreditChange={setCredit}
                onBack={() => setStep("salary")}
                onContinue={() => setStep("employment")}
                canContinue={!!credit && !creditError}
              />
            </WizardScreen>
          )}

          {step === "employment" && (
            <WizardScreen key="employment">
              <EmploymentStep
                selectedMonths={employmentMonths}
                onSelect={(months, label) => {
                  setEmploymentMonths(months);
                  setEmploymentLabel(label);
                }}
                onBack={() => setStep("credit")}
                onContinue={() => setStep("review")}
                canContinue={employmentMonths !== null}
              />
            </WizardScreen>
          )}

          {step === "review" && (
            <WizardScreen key="review">
              <ReviewStep
                salary={salary}
                currency={currency}
                credit={credit}
                employmentLabel={employmentLabel}
                error={error}
                onWrongChain={onWrongChain}
                switching={switching}
                onSwitchChain={() => switchChain({ chainId: ACTIVE_CHAIN.id })}
                onBack={() => setStep("employment")}
                onEncrypt={handleEncrypt}
                canEncrypt={
                  !!walletProvider &&
                  !!publicClient &&
                  !!walletClient &&
                  !onWrongChain
                }
              />
            </WizardScreen>
          )}

          {step === "encrypting" && (
            <WizardScreen key="encrypting">
              <EncryptingStep ui={encryptUI} />
            </WizardScreen>
          )}

          {step === "success" && (
            <WizardScreen key="success">
              <SuccessStep onDashboard={() => router.push("/dashboard")} />
            </WizardScreen>
          )}
        </AnimatePresence>
      </div>
    </Container>
  );
}

function WizardScreen({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease }}
    >
      {children}
    </motion.div>
  );
}

function StepIndicator({ step }: { step: "salary" | "credit" | "employment" }) {
  const n = step === "salary" ? 1 : step === "credit" ? 2 : 3;
  return (
    <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.18em] text-ink-400 dark:text-white/40">
      Step {n} of 3
    </p>
  );
}

function IntroStep({
  isUpdate,
  onStart,
}: {
  isUpdate: boolean;
  onStart: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-accent-400/30 bg-accent-400/10 dark:border-accent-400/25 dark:bg-accent-400/[0.08]">
        <LockIcon className="h-6 w-6 text-accent-600 dark:text-accent-300" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
        {isUpdate ? "Update Your Encrypted Profile" : "Create Your Encrypted Profile"}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-600 dark:text-white/60">
        Verify eligibility without revealing sensitive information.
      </p>
      <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed text-ink-500 dark:text-white/45">
        Your profile will be encrypted using Fhenix coFHE. Only verification
        results are shared. Never raw values.
      </p>
      <div className="mt-10">
        <Button size="lg" onClick={onStart}>
          Get Started
        </Button>
      </div>
    </div>
  );
}

function SalaryStep({
  salary,
  currency,
  error,
  onSalaryChange,
  onCurrencyChange,
  onBack,
  onContinue,
  canContinue,
}: {
  salary: string;
  currency: Currency;
  error?: string;
  onSalaryChange: (v: string) => void;
  onCurrencyChange: (v: Currency) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
        Salary
      </h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-white/60">
        Used to verify income requirements without revealing your actual salary.
      </p>

      <div className="mt-8">
        <label className="block text-sm font-medium text-ink-700 mb-1.5 dark:text-white/70">
          Monthly Income
        </label>
        <div className="flex gap-2">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="h-[42px] rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:focus:ring-accent-400/30"
            aria-label="Currency"
          >
            <option value="INR">INR ₹</option>
            <option value="USD">USD $</option>
          </select>
          <div className="flex flex-1 items-center rounded-md border border-ink-200 bg-white focus-within:ring-2 focus-within:ring-brand-500/40 dark:border-white/12 dark:bg-white/[0.04] dark:focus-within:ring-accent-400/30">
            <span className="pl-3 text-sm text-ink-400 dark:text-white/40">
              {currency === "INR" ? "₹" : "$"}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder={currency === "INR" ? "50,000" : "5,000"}
              value={salary}
              onChange={(e) => onSalaryChange(e.target.value)}
              className="flex-1 bg-transparent px-2 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-white dark:placeholder:text-white/35"
            />
          </div>
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-danger-700 dark:text-danger-500">
            {error}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-ink-500 dark:text-white/45">
            Your salary remains encrypted.
          </p>
        )}
      </div>

      <WizardNav onBack={onBack} onContinue={onContinue} canContinue={canContinue} />
    </div>
  );
}

function CreditStep({
  credit,
  error,
  onCreditChange,
  onBack,
  onContinue,
  canContinue,
}: {
  credit: string;
  error?: string;
  onCreditChange: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
        Credit Score
      </h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-white/60">
        Used for encrypted threshold checks.
      </p>
      <p className="mt-1 text-xs text-ink-400 dark:text-white/40">Example: 650+</p>

      <div className="mt-8">
        <Input
          label="Credit Score"
          name="credit"
          type="number"
          inputMode="numeric"
          placeholder="720"
          value={credit}
          onChange={(e) => onCreditChange(e.target.value)}
          error={error}
          hint="Your credit score remains encrypted."
        />
      </div>

      <WizardNav onBack={onBack} onContinue={onContinue} canContinue={canContinue} />
    </div>
  );
}

function EmploymentStep({
  selectedMonths,
  onSelect,
  onBack,
  onContinue,
  canContinue,
}: {
  selectedMonths: number | null;
  onSelect: (months: number, label: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
        Employment Duration
      </h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-white/60">
        Used to verify employment stability.
      </p>

      <div className="mt-8 space-y-2">
        {TENANT_EMPLOYMENT_OPTIONS.map((opt) => {
          const selected = selectedMonths === opt.months;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onSelect(opt.months, opt.label)}
              className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-200 ${
                selected
                  ? "border-accent-400/50 bg-accent-400/10 font-medium text-brand-700 dark:border-accent-400/40 dark:bg-accent-400/[0.08] dark:text-accent-100"
                  : "border-ink-200 bg-white text-ink-800 hover:border-ink-300 dark:border-white/12 dark:bg-white/[0.03] dark:text-white/85 dark:hover:border-white/20"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <WizardNav onBack={onBack} onContinue={onContinue} canContinue={canContinue} />
    </div>
  );
}

function ReviewStep({
  salary,
  currency,
  credit,
  employmentLabel,
  error,
  onWrongChain,
  switching,
  onSwitchChain,
  onBack,
  onEncrypt,
  canEncrypt,
}: {
  salary: string;
  currency: Currency;
  credit: string;
  employmentLabel: string;
  error: ProfileError | null;
  onWrongChain: boolean;
  switching: boolean;
  onSwitchChain: () => void;
  onBack: () => void;
  onEncrypt: () => void;
  canEncrypt: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
        Ready to Encrypt
      </h1>

      <ul className="mt-8 space-y-3">
        <ReviewRow label="Salary" value={formatSalaryDisplay(salary, currency)} />
        <ReviewRow label="Credit Score" value={credit} />
        <ReviewRow label="Employment Duration" value={employmentLabel} />
      </ul>

      <p className="mt-8 text-xs leading-relaxed text-ink-500 dark:text-white/45">
        This information will be encrypted using Fhenix coFHE before storage.
        Only pass/fail verification results will ever be revealed.
      </p>

      {error ? (
        <div className="mt-4 rounded-md border border-danger-500/30 bg-danger-50 p-3 dark:bg-danger-500/10">
          <p className="text-sm font-medium text-danger-700 dark:text-danger-500">
            {error.title}
          </p>
          <p className="mt-1 text-xs text-danger-600 dark:text-danger-500/90">
            {error.message}
          </p>
        </div>
      ) : null}

      {onWrongChain ? (
        <div className="mt-4 rounded-md border border-warn-500/30 bg-warn-50 p-3 text-xs text-warn-700 flex items-center justify-between gap-3 dark:bg-warn-500/10 dark:text-warn-500">
          <span>
            Switch to {ACTIVE_CHAIN.name} to encrypt and submit on-chain.
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={switching}
            onClick={onSwitchChain}
          >
            Switch network
          </Button>
        </div>
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onEncrypt}
          disabled={!canEncrypt}
        >
          Encrypt &amp; Create Profile
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-4 text-sm">
      <span className="flex items-center gap-2 text-ink-700 dark:text-white/70">
        <span className="text-accent-600 dark:text-accent-300" aria-hidden="true">
          ✓
        </span>
        {label}
      </span>
      <span className="font-medium text-ink-900 dark:text-white">{value}</span>
    </li>
  );
}

function AnimatedEllipsis({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 480);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className}>
      {text}
      {".".repeat(dots)}
    </span>
  );
}

function PulsingDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-accent-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.15, 0.8] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.22,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function BreathingRing() {
  return (
    <motion.div
      className="mx-auto h-14 w-14 rounded-full border-2 border-accent-400/50"
      animate={{ scale: [1, 1.08, 1], opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function SpinIndicator() {
  return (
    <motion.span
      className="inline-block text-base leading-none text-accent-600 dark:text-accent-300"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      aria-hidden="true"
    >
      ⟳
    </motion.span>
  );
}

function EncryptFieldList({ ui }: { ui: EncryptUI }) {
  return (
    <ul className="mx-auto mt-10 max-w-xs space-y-3 text-left">
      {ENCRYPT_FIELDS.map((field) => {
        const done = ui.completed[field];
        const active = ui.activeField === field;
        return (
          <motion.li
            key={field}
            layout
            className={`flex items-center justify-between text-sm ${
              done
                ? "text-ink-700 dark:text-white/70"
                : active
                  ? "font-medium text-brand-700 dark:text-accent-100"
                  : "text-ink-400 dark:text-white/30"
            }`}
          >
            <span>{FIELD_LABELS[field]}</span>
            <span className="w-5 text-center text-accent-600 dark:text-accent-300">
              {done ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease }}
                >
                  ✓
                </motion.span>
              ) : active ? (
                <SpinIndicator />
              ) : (
                <span className="text-ink-300 dark:text-white/20">○</span>
              )}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}

function EncryptingStep({ ui }: { ui: EncryptUI }) {
  if (ui.phase === "preparing") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
          <AnimatedEllipsis text="Preparing Secure Session" />
        </h1>
        <p className="mt-3 text-sm text-ink-500 dark:text-white/45">
          Initializing encrypted connection
        </p>
        <div className="mx-auto mt-8 h-1 w-28 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
          <motion.div
            className="h-full w-1/2 rounded-full bg-accent-400/60"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  if (ui.phase === "wallet_wait") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
          Waiting For Wallet Approval
        </h1>
        <p className="mx-auto mt-4 flex items-center justify-center gap-1 text-sm text-ink-600 dark:text-white/60">
          <span>Check your wallet</span>
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            →
          </motion.span>
        </p>
        <div className="mx-auto mt-10 space-y-6">
          <BreathingRing />
          <PulsingDots />
        </div>
      </div>
    );
  }

  if (ui.phase === "creating") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
          <AnimatedEllipsis text="Creating Encrypted Profile" />
        </h1>
        <p className="mt-3 text-sm text-ink-500 dark:text-white/45">
          Securing your profile
        </p>
        <div className="mx-auto mt-8 flex justify-center">
          <motion.div
            className="h-8 w-8 rounded-full border-2 border-accent-400/30 border-t-accent-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  if (ui.phase === "finalizing") {
    return (
      <motion.div
        className="text-center"
        animate={{ opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <EncryptFieldList ui={ui} />
      </motion.div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
        <AnimatedEllipsis text="Encrypting Profile" />
      </h1>
      <EncryptFieldList ui={ui} />
    </div>
  );
}

function mapProfileError(err: unknown): ProfileError {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request") ||
    lower.includes("action_rejected") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  ) {
    return {
      title: "Wallet Rejected",
      message: "Transaction approval was cancelled.",
    };
  }

  if (
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("timeout") ||
    lower.includes("econnrefused") ||
    lower.includes("failed to fetch")
  ) {
    return {
      title: "Network Error",
      message: "Unable to connect to the network.",
    };
  }

  if (lower.includes("encrypt")) {
    return {
      title: "Encryption Failed",
      message: "Your profile could not be encrypted.",
    };
  }

  return {
    title: "Unknown Error",
    message: "Something went wrong. Please try again.",
  };
}

function SuccessStep({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-night-950 shadow-[0_0_24px_rgba(34,211,238,0.45)]"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <motion.h1
        className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease }}
      >
        Profile Created ✓
      </motion.h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-600 dark:text-white/60">
        Your encrypted profile is now ready. You can now verify eligibility
        against landlord requirements without revealing your data.
      </p>
      <div className="mt-10">
        <Button size="lg" onClick={onDashboard}>
          Go To Dashboard
        </Button>
      </div>
    </div>
  );
}

function WizardNav({
  onBack,
  onContinue,
  canContinue,
}: {
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      <Button type="button" variant="ghost" onClick={onBack}>
        Back
      </Button>
      <Button type="button" onClick={onContinue} disabled={!canContinue}>
        Continue
      </Button>
    </div>
  );
}

function validateSalary(salary: string): string | undefined {
  if (!salary) return undefined;
  const n = Number(salary);
  if (!Number.isFinite(n) || n <= 0) return "Must be a positive number.";
  if (n > SALARY_MAX) return "That's unusually high — check the value.";
  return undefined;
}

function validateCredit(credit: string): string | undefined {
  if (!credit) return undefined;
  const n = Number(credit);
  if (!Number.isFinite(n) || n < CREDIT_MIN || n > CREDIT_WIZARD_MAX)
    return `Must be ${CREDIT_MIN}–${CREDIT_WIZARD_MAX}.`;
  return undefined;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
