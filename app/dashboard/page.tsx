"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleGuard } from "@/components/role-guard";
import { formatAddress, formatDate } from "@/lib/format";
import { PRIMARY_CARD_CLASS } from "@/lib/ui-classes";
import { extractVerificationSlug } from "@/lib/verify-link";

export default function DashboardPage() {
  return (
    <RoleGuard role="tenant">
      <TenantDashboard />
    </RoleGuard>
  );
}

const PROFILE_ATTRIBUTES = [
  "Salary",
  "Credit Score",
  "Employment Duration",
] as const;

const DASHBOARD_HEADING = {
  title: "Encrypted Profile",
  description: "Private. Reusable. Yours.",
} as const;

type VerificationResult = {
  _id: string;
  overallEligible: boolean;
  evaluatedAt: number;
  passSalary: boolean;
  passCredit: boolean;
  passEmployment: boolean;
  request?: {
    title?: string;
    propertyLabel?: string;
    landlordAddress?: string;
  } | null;
};

type JourneyStepState = "done" | "current" | "pending";

type JourneyStep = {
  label: string;
  state: JourneyStepState;
};

type JourneyContent =
  | { mode: "progress"; title: string; steps: JourneyStep[] }
  | { mode: "status"; title: string; items: Array<{ label: string }> };

function buildJourneyContent(
  hasProfile: boolean,
  resultCount: number
): JourneyContent {
  if (!hasProfile) {
    return {
      mode: "progress",
      title: "Verification Journey",
      steps: [
        { label: "Wallet Connected", state: "done" },
        { label: "Profile Created", state: "current" },
        { label: "Ready For Verification", state: "pending" },
      ],
    };
  }

  if (resultCount === 0) {
    return {
      mode: "progress",
      title: "Verification Journey",
      steps: [
        { label: "Wallet Connected", state: "done" },
        { label: "Profile Created", state: "done" },
        { label: "Ready For Verification", state: "current" },
      ],
    };
  }

  return {
    mode: "status",
    title: "Verification Status",
    items: [
      { label: "Wallet Connected" },
      { label: "Profile Created" },
      { label: "Verification Completed" },
    ],
  };
}

function TenantDashboard() {
  const { address } = useAccount();
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const profile = useQuery(
    api.profiles.get,
    address ? { walletAddress: address.toLowerCase() } : "skip"
  );
  const results = useQuery(
    api.results.listForTenant,
    address ? { tenantAddress: address.toLowerCase() } : "skip"
  );

  const loading = profile === undefined;
  const hasProfile = !!profile;
  const resultCount = results?.length ?? 0;

  if (loading) {
    return (
      <Container className="py-10">
        <PageHeading
          title={DASHBOARD_HEADING.title}
          description={DASHBOARD_HEADING.description}
        />
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <SkeletonRow />
          <div className="h-48 rounded-lg bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
        </div>
      </Container>
    );
  }

  if (!hasProfile) {
    return (
      <Container className="py-10">
        <PageHeading
          title={DASHBOARD_HEADING.title}
          description={DASHBOARD_HEADING.description}
        />

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <ProfileOnboarding />

          <aside className="space-y-4">
            <ProfileStatusCard profile={null} />
          </aside>
        </div>

        <DeemphasizedVerificationHistory
          results={results ?? []}
          onVerifyClick={() => setVerifyModalOpen(true)}
        />

        <VerifyLinkModal
          open={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
        />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <PageHeading
        title={DASHBOARD_HEADING.title}
        description={DASHBOARD_HEADING.description}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-5">
          {results === undefined ? (
            <Card>
              <CardHeader>
                <CardTitle>Verification History</CardTitle>
              </CardHeader>
              <CardBody>
                <SkeletonRow />
              </CardBody>
            </Card>
          ) : results.length === 0 ? (
            <VerificationEmptyState
              onVerifyClick={() => setVerifyModalOpen(true)}
            />
          ) : (
            <Card className={PRIMARY_CARD_CLASS}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Verification History</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setVerifyModalOpen(true)}
                  className="shrink-0"
                >
                  Verify New Request
                </Button>
              </CardHeader>
              <CardBody>
                <VerificationList results={results} />
              </CardBody>
            </Card>
          )}

          <VerificationJourneyCard
            content={buildJourneyContent(true, resultCount)}
          />
        </div>

        <aside className="space-y-4">
          <ProfileStatusCard profile={profile} />
        </aside>
      </div>

      <VerifyLinkModal
        open={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
      />
    </Container>
  );
}

function VerifyLinkModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setValue("");
      setError(null);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = extractVerificationSlug(value);
    if (!slug) {
      setError("Enter a verification link or code from your landlord.");
      return;
    }
    onClose();
    router.push(`/verify/${slug}`);
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-night-950/40 backdrop-blur-[2px] dark:bg-night-950/60"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-labelledby="verify-link-title"
            aria-modal="true"
            className="relative w-full max-w-md rounded-lg border border-ink-200 bg-white p-6 shadow-card dark:border-white/12 dark:bg-night-900"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              id="verify-link-title"
              className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white"
            >
              Paste Verification Link
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-white/50">
              Paste the share link or code your landlord sent you.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://…/verify/abc123 or abc123"
                aria-label="Verification link or code"
                autoFocus
              />
              {error ? (
                <p className="text-xs text-danger-600 dark:text-danger-500">
                  {error}
                </p>
              ) : null}
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Verify</Button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function ProfileOnboarding() {
  return (
    <Card className={`overflow-hidden ${PRIMARY_CARD_CLASS}`}>
      <CardBody className="px-6 py-12 sm:px-10 sm:py-14 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent-400/30 bg-accent-400/10 dark:border-accent-400/25 dark:bg-accent-400/[0.08]">
          <LockIcon className="h-5 w-5 text-accent-600 dark:text-accent-300" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
          Create Your Encrypted Profile
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-600 dark:text-white/60">
          Store your information privately and verify eligibility without
          revealing sensitive data. Only verification results are shared.
        </p>

        <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
          {PROFILE_ATTRIBUTES.map((label) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-400/15 text-accent-600 dark:bg-accent-400/10 dark:text-accent-300">
                <LockIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-medium text-ink-800 dark:text-white/85">
                {label}
              </span>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-ink-500 dark:text-white/45">
          Encrypted using Fhenix coFHE. Only pass/fail eligibility results are
          revealed. Never raw values.
        </p>

        <div className="mt-8">
          <Link href="/profile">
            <Button size="lg" className="min-w-[240px]">
              Create Encrypted Profile
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

function ProfileStatusCard({
  profile,
}: {
  profile: {
    updatedAt: number;
    onChainTxHash?: string;
  } | null;
}) {
  const attributeCount = profile ? PROFILE_ATTRIBUTES.length : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Encrypted Profile</CardTitle>
        {profile === null ? (
          <CardDescription>
            Create your profile to begin verifying.
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardBody className="pt-4">
        {profile === null ? (
          <>
            <Badge tone="warn" className="mb-3">
              Not Created
            </Badge>
            <p className="text-sm text-ink-600 mb-4 dark:text-white/60">
              Create your profile to begin verifying against landlord
              requirements.
            </p>
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5 dark:text-white/45">
                <span>{attributeCount} / {PROFILE_ATTRIBUTES.length} Attributes Added</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-accent-500 transition-all duration-300"
                  style={{
                    width: `${(attributeCount / PROFILE_ATTRIBUTES.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <Link href="/profile">
              <Button size="sm">Create Encrypted Profile</Button>
            </Link>
          </>
        ) : (
          <>
            <Badge tone="success" className="mb-4">
              Encrypted &amp; Saved
            </Badge>

            <p className="mb-3 text-xs text-ink-500 dark:text-white/45">
              {attributeCount} / {PROFILE_ATTRIBUTES.length} Attributes Added
            </p>

            <ul className="mb-5 space-y-2">
              {PROFILE_ATTRIBUTES.map((label) => (
                <li
                  key={label}
                  className="flex items-center justify-between text-sm text-ink-700 dark:text-white/70"
                >
                  <span>{label}</span>
                  <span className="text-accent-600 dark:text-accent-300">
                    ✓
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-ink-500 mb-4 dark:text-white/45">
              Last updated {formatDate(profile.updatedAt)}
            </p>

            <Link href="/profile">
              <Button size="sm" variant="secondary">
                Edit Profile
              </Button>
            </Link>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function VerificationJourneyCard({ content }: { content: JourneyContent }) {
  return (
    <Card className="border-ink-200/60 bg-ink-50/25 dark:border-white/8 dark:bg-white/[0.015]">
      <CardHeader className="border-ink-100/80 px-5 py-2.5 dark:border-white/8">
        <CardTitle className="text-sm font-medium text-ink-600 dark:text-white/55">
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardBody className="px-5 pb-3.5 pt-2">
        {content.mode === "progress" ? (
          <ul className="space-y-1.5">
            {content.steps.map((step) => (
              <li
                key={step.label}
                className={`flex items-center gap-2 text-xs leading-snug ${
                  step.state === "current"
                    ? "font-medium text-brand-700 dark:text-accent-100"
                    : step.state === "done"
                      ? "text-ink-500 dark:text-white/50"
                      : "text-ink-400 dark:text-white/30"
                }`}
              >
                <span
                  className={`w-3 shrink-0 text-center ${
                    step.state === "done"
                      ? "text-accent-600 dark:text-accent-300"
                      : step.state === "current"
                        ? "text-accent-500 dark:text-accent-400"
                        : "text-ink-300 dark:text-white/25"
                  }`}
                  aria-hidden="true"
                >
                  {step.state === "done"
                    ? "✓"
                    : step.state === "current"
                      ? "◉"
                      : "○"}
                </span>
                {step.label}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1.5">
            {content.items.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-xs leading-snug text-ink-500 dark:text-white/50"
              >
                <span
                  className="w-3 shrink-0 text-center text-accent-600 dark:text-accent-300"
                  aria-hidden="true"
                >
                  ✓
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function VerificationEmptyState({
  onVerifyClick,
}: {
  onVerifyClick: () => void;
}) {
  return (
    <Card className={PRIMARY_CARD_CLASS}>
      <CardHeader>
        <CardTitle>Verification History</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-6 py-14 text-center dark:border-white/12 dark:bg-white/[0.02]">
          <h3 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
            Ready For Verification
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-sm text-ink-600 dark:text-white/60">
            Your encrypted profile is ready.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500 dark:text-white/45">
            Verify against landlord requirements without revealing your data.
          </p>
          <div className="mt-7">
            <Button onClick={onVerifyClick}>Verify New Request</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function DeemphasizedVerificationHistory({
  results,
  onVerifyClick,
}: {
  results: VerificationResult[];
  onVerifyClick: () => void;
}) {
  if (results.length > 0) {
    return (
      <Card className="mt-8 border-ink-200/80 bg-ink-50/40 dark:border-white/8 dark:bg-white/[0.02]">
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base text-ink-700 dark:text-white/70">
            Verification History
          </CardTitle>
          <Button size="sm" variant="secondary" onClick={onVerifyClick}>
            Verify New Request
          </Button>
        </CardHeader>
        <CardBody className="pt-0">
          <VerificationList results={results} />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mt-8">
      <VerificationJourneyCard content={buildJourneyContent(false, 0)} />
    </div>
  );
}

function looksLikeUnitIdentifier(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  if (/^(unit|property|apt|#)\s*/i.test(text)) return true;
  if (/^\d+[a-zA-Z]?$/.test(text)) return true;
  return text.length <= 8 && /\d/.test(text) && !/\s{2,}/.test(text);
}

function formatPropertyIdentifier(value: string): string {
  const text = value.trim();
  if (/^(unit|property|apt|#)\s*/i.test(text)) return text;
  if (/^\d+[a-zA-Z]?$/.test(text)) return `Property ${text}`;
  return text;
}

function verificationPropertyInfo(request: VerificationResult["request"]): {
  name: string;
  identifier: string | null;
} {
  if (!request) return { name: "Verification", identifier: null };

  const { title, propertyLabel } = request;

  if (title && propertyLabel) {
    const titleIsUnit = looksLikeUnitIdentifier(title);
    const labelIsUnit = looksLikeUnitIdentifier(propertyLabel);

    if (titleIsUnit && !labelIsUnit) {
      return {
        name: propertyLabel,
        identifier: formatPropertyIdentifier(title),
      };
    }

    if (labelIsUnit && !titleIsUnit) {
      return {
        name: title,
        identifier: formatPropertyIdentifier(propertyLabel),
      };
    }

    return {
      name: title,
      identifier: formatPropertyIdentifier(propertyLabel),
    };
  }

  const single = title ?? propertyLabel;
  if (!single) return { name: "Verification", identifier: null };

  if (looksLikeUnitIdentifier(single)) {
    return {
      name: request.landlordAddress
        ? formatAddress(request.landlordAddress)
        : "Verification",
      identifier: formatPropertyIdentifier(single),
    };
  }

  return { name: single, identifier: null };
}

function verificationSummary(result: VerificationResult): string {
  const passed = [result.passSalary, result.passCredit, result.passEmployment]
    .filter(Boolean).length;

  if (result.overallEligible) return "Eligible";
  if (passed > 0) return `Passed ${passed} of 3 Requirements`;
  return "Not Eligible";
}

function verificationSummaryClass(result: VerificationResult): string {
  const passed = [result.passSalary, result.passCredit, result.passEmployment]
    .filter(Boolean).length;

  if (result.overallEligible) {
    return "text-accent-700 dark:text-accent-200";
  }
  if (passed > 0) {
    return "text-warn-700 dark:text-warn-500";
  }
  return "text-ink-500 dark:text-white/45";
}

function VerificationList({ results }: { results: VerificationResult[] }) {
  return (
    <ul className="divide-y divide-ink-100 dark:divide-white/8">
      {results.map((r) => {
        const summary = verificationSummary(r);
        const { name, identifier } = verificationPropertyInfo(r.request);

        return (
          <li key={r._id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-base font-semibold tracking-tight text-ink-900 dark:text-white">
                {name}
              </p>
              <Badge
                tone={r.overallEligible ? "success" : "danger"}
                className="shrink-0"
              >
                {r.overallEligible ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>

            {identifier ? (
              <p className="mt-1 text-sm text-ink-600 dark:text-white/60">
                {identifier}
              </p>
            ) : null}

            <p className="mt-0.5 text-xs text-ink-400 dark:text-white/35">
              {formatDate(r.evaluatedAt)}
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">
              <p className={`text-sm ${verificationSummaryClass(r)}`}>
                {summary}
              </p>
              <Link href={`/results/${r._id}`} className="shrink-0">
                <Button size="sm" variant="secondary">
                  View Results →
                </Button>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
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
  );
}

function SkeletonRow() {
  return (
    <div className="space-y-3">
      <div className="h-12 rounded-md bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
      <div className="h-12 rounded-md bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
    </div>
  );
}
