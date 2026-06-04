"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/ui/empty";
import { RoleGuard } from "@/components/role-guard";
import {
  formatAddress,
  formatDate,
  formatMoney,
  formatMonths,
} from "@/lib/format";

export default function RequestDetailPage() {
  return (
    <RoleGuard role="landlord">
      <RequestDetail />
    </RoleGuard>
  );
}

function RequestDetail() {
  const params = useParams<{ requestId: string }>();
  const requestId = params?.requestId as Id<"requests"> | undefined;

  const request = useQuery(api.requests.get, requestId ? { id: requestId } : "skip");
  const results = useQuery(
    api.results.listForRequest,
    requestId ? { requestId } : "skip"
  );

  if (request === undefined) {
    return (
      <Container className="py-10">
        <div className="h-32 bg-ink-50 rounded-md animate-pulse" />
      </Container>
    );
  }
  if (request === null) {
    return (
      <Container className="py-10">
        <EmptyState title="Request not found" />
      </Container>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${request.shareSlug}`
      : `/verify/${request.shareSlug}`;

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="Verification request"
        title={request.title}
        description={request.propertyLabel}
        action={
          <Link href="/landlord">
            <Button variant="ghost" size="sm">
              ← All requests
            </Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>
                Public to applicants. Their values stay encrypted; only pass/fail
                is revealed.
              </CardDescription>
            </CardHeader>
            <CardBody className="grid sm:grid-cols-3 gap-4">
              <ThresholdCell
                label="Income"
                value={`≥ ${formatMoney(
                  request.monthlyRent * request.salaryMultiplier
                )}/mo`}
                hint={`${request.salaryMultiplier}× rent of ${formatMoney(
                  request.monthlyRent
                )}`}
              />
              <ThresholdCell
                label="Credit score"
                value={`≥ ${request.minCreditScore}`}
              />
              <ThresholdCell
                label="Employment"
                value={`≥ ${formatMonths(request.minEmploymentMonths)}`}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Every applicant&apos;s outcome. No raw financial data appears here.
                </CardDescription>
              </div>
              <Badge tone="neutral">
                {results?.length ?? 0} total
              </Badge>
            </CardHeader>
            <CardBody>
              {results === undefined ? (
                <div className="h-12 bg-ink-50 rounded-md animate-pulse" />
              ) : results.length === 0 ? (
                <EmptyState
                  title="No applicants yet"
                  description="Share the link with prospective tenants. Their results will appear here as they run the check."
                />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {results.map((r: any) => (
                    <li
                      key={r._id}
                      className="py-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-mono text-sm text-ink-900">
                          {formatAddress(r.tenantAddress)}
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5">
                          {formatDate(r.evaluatedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <PassPill ok={r.passSalary} label="Income" />
                        <PassPill ok={r.passCredit} label="Credit" />
                        <PassPill ok={r.passEmployment} label="Tenure" />
                        <Badge tone={r.overallEligible ? "success" : "danger"}>
                          {r.overallEligible ? "Eligible" : "Not eligible"}
                        </Badge>
                        <Link href={`/results/${r._id}`}>
                          <Button size="sm" variant="secondary">
                            View
                          </Button>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share link</CardTitle>
              <CardDescription>
                Send this to applicants via email or text.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <div className="rounded-md bg-ink-50 border border-ink-100 p-3 text-xs font-mono text-ink-700 break-all">
                {shareUrl}
              </div>
              <div className="mt-3">
                <CopyButton text={shareUrl} />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-xs text-ink-600">
              Created {formatDate(request.createdAt)}.
            </CardBody>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function ThresholdCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-ink-100 bg-ink-50/50 p-4">
      <div className="text-xs text-ink-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-base font-semibold text-ink-900 mt-1">{value}</div>
      {hint ? <div className="text-xs text-ink-500 mt-1">{hint}</div> : null}
    </div>
  );
}

function PassPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge tone={ok ? "success" : "danger"} className="hidden md:inline-flex">
      {label} {ok ? "✓" : "✗"}
    </Badge>
  );
}
