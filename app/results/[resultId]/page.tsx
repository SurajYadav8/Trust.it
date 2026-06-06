"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Container, PageHeading } from "@/components/ui/container";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import {
  formatAddress,
  formatDate,
  formatMoney,
  rentCurrency,
} from "@/lib/format";
import { formatEmploymentRequirement } from "@/lib/employment-duration";
import {
  ELIGIBLE_STATUS_CLASS,
  NOT_ELIGIBLE_STATUS_CLASS,
  PRIMARY_CARD_CLASS,
  SECONDARY_CARD_CLASS,
} from "@/lib/ui-classes";

type RequestInfo = {
  title?: string;
  propertyLabel?: string;
  landlordAddress?: string;
  _id?: string;
  monthlyRent?: number;
  rentCurrency?: "INR" | "USD";
  salaryMultiplier?: number;
  minCreditScore?: number;
  minEmploymentMonths?: number;
} | null;

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

function propertyDisplayInfo(request: RequestInfo): {
  name: string;
  identifier: string | null;
} {
  if (!request) return { name: "Result", identifier: null };

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
  if (!single) return { name: "Result", identifier: null };

  if (looksLikeUnitIdentifier(single)) {
    return {
      name: request.landlordAddress
        ? formatAddress(request.landlordAddress)
        : "Result",
      identifier: formatPropertyIdentifier(single),
    };
  }

  return { name: single, identifier: null };
}

export default function ResultPage() {
  const params = useParams<{ resultId: string }>();
  const resultId = params?.resultId as Id<"results"> | undefined;

  const { address } = useAccount();
  const data = useQuery(api.results.get, resultId ? { id: resultId } : "skip");
  const user = useQuery(
    api.users.get,
    address ? { walletAddress: address.toLowerCase() } : "skip"
  );

  if (data === undefined) {
    return (
      <Container className="py-10">
        <div className="h-32 rounded-md bg-ink-50 animate-pulse dark:bg-white/[0.06]" />
      </Container>
    );
  }
  if (data === null) {
    return (
      <Container className="py-10">
        <EmptyState title="Result not found" />
      </Container>
    );
  }

  const request = data.request;
  const viewerIsTenant =
    address?.toLowerCase() === data.tenantAddress.toLowerCase();
  const viewerIsLandlord =
    !!request &&
    address?.toLowerCase() === request.landlordAddress.toLowerCase();
  const role = viewerIsTenant
    ? "tenant"
    : viewerIsLandlord
      ? "landlord"
      : "viewer";

  const requiredIncome = request
    ? request.monthlyRent * request.salaryMultiplier
    : 0;
  const currency = rentCurrency(request);

  const { name: propertyName, identifier: propertyIdentifier } =
    propertyDisplayInfo(request);

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="Verification result"
        title={propertyName}
        description={propertyIdentifier ?? undefined}
        action={
          role === "tenant" ? (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Dashboard
              </Button>
            </Link>
          ) : role === "landlord" && request ? (
            <Link href={`/landlord/requests/${request._id}`}>
              <Button variant="ghost" size="sm">
                ← Property
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          <Card className={PRIMARY_CARD_CLASS}>
            <CardHeader className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>Overall verdict</CardTitle>
                <CardDescription className="text-ink-600 dark:text-white/65">
                  Computed on encrypted values via Fhenix CoFHE. Only the
                  pass/fail booleans were decrypted.
                </CardDescription>
              </div>
              <VerdictBadge eligible={data.overallEligible} />
            </CardHeader>
            <CardBody className="grid gap-4 sm:grid-cols-3">
              <ResultCell
                pass={data.passSalary}
                label="Income"
                threshold={
                  request
                    ? `≥ ${formatMoney(requiredIncome, currency)}/mo`
                    : "—"
                }
              />
              <ResultCell
                pass={data.passCredit}
                label="Credit score"
                threshold={request ? `≥ ${request.minCreditScore}` : "—"}
              />
              <ResultCell
                pass={data.passEmployment}
                label="Employment"
                threshold={
                  request
                    ? formatEmploymentRequirement(request.minEmploymentMonths)
                    : "—"
                }
              />
            </CardBody>
          </Card>

          <DetailsDisclosure>
            <Row label="Tenant">
              <span className="font-mono text-ink-900 dark:text-white/90">
                {formatAddress(data.tenantAddress)}
              </span>
            </Row>
            {request ? (
              <Row label="Landlord">
                <span className="font-mono text-ink-900 dark:text-white/90">
                  {formatAddress(request.landlordAddress)}
                </span>
              </Row>
            ) : null}
            <Row label="Evaluated">
              <span className="text-ink-900 dark:text-white/90">
                {formatDate(data.evaluatedAt)}
              </span>
            </Row>
            {data.onChainTxHash ? (
              <Row label="On-chain tx">
                <code className="text-[11px] break-all text-ink-800 dark:text-white/80">
                  {data.onChainTxHash}
                </code>
              </Row>
            ) : null}
          </DetailsDisclosure>
        </div>

        <aside className="space-y-4">
          <Card className={SECONDARY_CARD_CLASS}>
            <CardBody className="py-5">
              <Badge
                tone={
                  role === "tenant"
                    ? "brand"
                    : role === "landlord"
                      ? "neutral"
                      : "neutral"
                }
                className="mb-3 capitalize"
              >
                Viewing as {role}
              </Badge>
              {role === "tenant" ? (
                <p className="text-sm leading-relaxed text-ink-700 dark:text-white/75">
                  Your salary, credit score, and employment history stayed
                  encrypted. Only the pass/fail results above were revealed —
                  never your raw values.
                </p>
              ) : role === "landlord" ? (
                <p className="text-sm leading-relaxed text-ink-700 dark:text-white/75">
                  You see only pass/fail per requirement and the applicant&apos;s
                  wallet address. Their financial details remain encrypted
                  on-chain.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-ink-700 dark:text-white/75">
                  This is a verification result. Only pass/fail per requirement
                  is visible — never raw financial data.
                </p>
              )}
            </CardBody>
          </Card>

          {user?.role === "tenant" && !data.overallEligible ? (
            <Card className={SECONDARY_CARD_CLASS}>
              <CardBody className="py-5">
                <Badge tone="warn" className="mb-3">
                  Tip
                </Badge>
                <p className="text-sm leading-relaxed text-ink-700 dark:text-white/75">
                  You didn&apos;t meet one or more requirements. The landlord
                  only sees which checks failed — not by how much your data
                  differed.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}

function VerdictBadge({ eligible }: { eligible: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-sm font-medium ${
        eligible ? ELIGIBLE_STATUS_CLASS : NOT_ELIGIBLE_STATUS_CLASS
      }`}
    >
      {eligible ? "Eligible" : "Not eligible"}
    </span>
  );
}

function DetailsDisclosure({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className={`overflow-hidden ${SECONDARY_CARD_CLASS}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-ink-50/60 dark:hover:bg-white/[0.03]"
      >
        <div className="min-w-0">
          <span className="text-base font-semibold text-ink-900 dark:text-white">
            Details
          </span>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-white/50">
            {open ? "Hide technical metadata" : "Tenant, landlord, and on-chain references"}
          </p>
        </div>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 dark:text-white/40 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <CardBody className="space-y-0 border-t border-ink-100/40 pt-0 dark:border-white/[0.06]">
          {children}
        </CardBody>
      ) : null}
    </Card>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResultCell({
  pass,
  label,
  threshold,
}: {
  pass: boolean;
  label: string;
  threshold: string;
}) {
  return (
    <div className="rounded-md border border-ink-200 bg-ink-50/40 p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-white/55">
        {label}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink-900 dark:text-white/90">
          {threshold}
        </div>
        <span
          className={`text-xs font-medium ${
            pass
              ? "text-success-700/85 dark:text-success-500/90"
              : "text-danger-700/80 dark:text-danger-500/85"
          }`}
        >
          {pass ? "Pass" : "Fail"}
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100/40 py-3 last:border-0 dark:border-white/[0.06]">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-white/55">
        {label}
      </span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}
