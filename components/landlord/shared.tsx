import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { formatDate } from "@/lib/format";
import { propertyDisplayInfo } from "@/lib/property-display";
import {
  LandlordProperty,
  propertyShareUrl,
} from "@/lib/landlord-property";
import {
  ELIGIBLE_STATUS_CLASS,
  NOT_ELIGIBLE_STATUS_CLASS,
  PRIMARY_CARD_CLASS,
  SECONDARY_CARD_CLASS,
} from "@/lib/ui-classes";

const GETTING_STARTED_STEPS = [
  "Create Screening",
  "Share Verification Link",
  "Receive Applicant Verification",
  "Review Results",
] as const;

export function DashboardStatGrid({
  activeProperties,
  totalApplicants,
  eligibleApplicants,
  pendingApplicants,
  failedApplicants,
}: {
  activeProperties: number;
  totalApplicants: number;
  eligibleApplicants: number;
  pendingApplicants: number;
  failedApplicants: number;
}) {
  const stats = [
    { label: "Active properties", value: activeProperties },
    { label: "Total applicants", value: totalApplicants },
    { label: "Eligible applicants", value: eligibleApplicants },
    { label: "Pending applicants", value: pendingApplicants },
    { label: "Failed applicants", value: failedApplicants },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label} className={SECONDARY_CARD_CLASS}>
          <CardBody className="py-4">
            <p className="text-xs text-ink-500 dark:text-white/45">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
              {s.value}
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function PropertyCard({ property }: { property: LandlordProperty }) {
  const { name, identifier } = propertyDisplayInfo(property, "Property");
  const shareUrl = propertyShareUrl(property.shareSlug);
  const pendingCount = 0;

  return (
    <Card className={PRIMARY_CARD_CLASS}>
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">
              {name}
            </h2>
            <Badge tone="brand">Active</Badge>
          </div>
          {identifier ? (
            <p className="mt-0.5 text-sm text-ink-600 dark:text-white/60">
              {identifier}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-500 dark:text-white/45">
            <span>
              <span className="font-medium text-ink-700 dark:text-white/70">
                {property.totalResults}
              </span>{" "}
              applicants
            </span>
            <span>
              <span className="font-medium text-brand-700 dark:text-accent-200">
                {property.eligibleCount}
              </span>{" "}
              <span className="text-brand-600/80 dark:text-accent-300/80">
                eligible
              </span>
            </span>
            <span>
              <span className="font-medium text-ink-700 dark:text-white/70">
                {pendingCount}
              </span>{" "}
              pending
            </span>
            <span>{formatDate(property.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <CopyButton text={shareUrl} label="Copy link" />
          <Link href={`/landlord/requests/${property._id}`}>
            <Button size="sm">View</Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

export function LandlordOnboarding() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
      <Card className={`overflow-hidden ${PRIMARY_CARD_CLASS}`}>
        <CardBody className="px-6 py-12 text-center sm:px-10 sm:py-14">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent-400/30 bg-accent-400/10 dark:border-accent-400/25 dark:bg-accent-400/[0.08]">
            <ScreeningIcon className="h-5 w-5 text-accent-600 dark:text-accent-300" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            Create Your First Screening
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-600 dark:text-white/60">
            Create a reusable applicant screening for a property. One
            verification link can be shared with multiple applicants.
          </p>

          <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-ink-500 dark:text-white/45">
            Encrypted with Fhenix coFHE. You receive only pass/fail outcomes —
            never raw salary, credit, or employment data.
          </p>

          <div className="mt-8">
            <Link href="/landlord/requests/new">
              <Button size="lg" className="min-w-[240px]">
                Create Screening
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <aside className="space-y-4">
        <GettingStartedCard />
        <PrivacyCard />
      </aside>
    </div>
  );
}

export function GettingStartedCard() {
  return (
    <Card className={SECONDARY_CARD_CLASS}>
      <CardHeader className="border-ink-100/80 px-5 py-2.5 dark:border-white/8">
        <CardTitle className="text-sm font-medium text-ink-600 dark:text-white/55">
          Getting Started
        </CardTitle>
      </CardHeader>
      <CardBody className="px-5 pb-3.5 pt-2">
        <ul className="space-y-1.5">
          {GETTING_STARTED_STEPS.map((step, i) => (
            <li
              key={step}
              className={`flex items-center gap-2 text-xs leading-snug ${
                i === 0
                  ? "font-medium text-brand-700 dark:text-accent-100"
                  : "text-ink-400 dark:text-white/30"
              }`}
            >
              <span
                className={`w-3 shrink-0 text-center ${
                  i === 0
                    ? "text-accent-500 dark:text-accent-400"
                    : "text-ink-300 dark:text-white/25"
                }`}
                aria-hidden="true"
              >
                {i === 0 ? "◉" : "○"}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function PrivacyCard() {
  return (
    <Card className={SECONDARY_CARD_CLASS}>
      <CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <p className="mb-2.5 text-xs font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-white/50">
            What You&apos;ll See
          </p>
          <ul className="space-y-2 text-sm text-ink-700 dark:text-white/75">
            <li className="flex items-center gap-2">
              <span className="text-accent-600 dark:text-accent-300">✓</span>
              Eligibility Result
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-600 dark:text-accent-300">✓</span>
              Pass / Fail Checks
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-600 dark:text-accent-300">✓</span>
              Applicant Wallet
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2.5 text-xs font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-white/50">
            What Stays Encrypted
          </p>
          <ul className="space-y-2 text-sm text-ink-500 dark:text-white/45">
            <li className="flex items-center gap-2">
              <span>✗</span> Salary
            </li>
            <li className="flex items-center gap-2">
              <span>✗</span> Credit Score
            </li>
            <li className="flex items-center gap-2">
              <span>✗</span> Employment History
            </li>
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

export function ApplicantStatusBadge({
  eligible,
}: {
  eligible: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        eligible ? ELIGIBLE_STATUS_CLASS : NOT_ELIGIBLE_STATUS_CLASS
      }`}
    >
      {eligible ? "Eligible" : "Not eligible"}
    </span>
  );
}

function ScreeningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 7h16M4 12h10M4 17h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
