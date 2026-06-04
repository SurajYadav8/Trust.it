"use client";

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
  formatMonths,
} from "@/lib/format";

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
        <div className="h-32 bg-ink-50 rounded-md animate-pulse" />
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

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="Verification result"
        title={request?.title ?? "Result"}
        description={request?.propertyLabel}
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
                ← Request
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Overall verdict</CardTitle>
                <CardDescription>
                  Computed on encrypted values via Fhenix CoFHE. Only the
                  pass/fail booleans were decrypted.
                </CardDescription>
              </div>
              <Badge
                tone={data.overallEligible ? "success" : "danger"}
                className="text-sm px-3 py-1"
              >
                {data.overallEligible ? "Eligible" : "Not eligible"}
              </Badge>
            </CardHeader>
            <CardBody className="grid sm:grid-cols-3 gap-4">
              <ResultCell
                pass={data.passSalary}
                label="Income"
                threshold={
                  request
                    ? `≥ ${formatMoney(requiredIncome)}/mo`
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
                    ? `≥ ${formatMonths(request.minEmploymentMonths)}`
                    : "—"
                }
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardBody className="text-sm text-ink-700 space-y-2">
              <Row label="Tenant">
                <span className="font-mono">
                  {formatAddress(data.tenantAddress)}
                </span>
              </Row>
              {request ? (
                <Row label="Landlord">
                  <span className="font-mono">
                    {formatAddress(request.landlordAddress)}
                  </span>
                </Row>
              ) : null}
              <Row label="Evaluated">{formatDate(data.evaluatedAt)}</Row>
              {data.onChainTxHash ? (
                <Row label="On-chain tx">
                  <code className="text-[11px] break-all">
                    {data.onChainTxHash}
                  </code>
                </Row>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <Badge
                tone={role === "tenant" ? "brand" : role === "landlord" ? "neutral" : "neutral"}
                className="mb-2 capitalize"
              >
                Viewing as {role}
              </Badge>
              {role === "tenant" ? (
                <p className="text-sm text-ink-700">
                  Your raw values were never sent to the landlord or to Trst.it.
                  Only the booleans above were decrypted.
                </p>
              ) : role === "landlord" ? (
                <p className="text-sm text-ink-700">
                  You see only pass/fail per requirement and the applicant&apos;s
                  wallet address. Their salary, credit score, and tenure stay
                  encrypted on-chain.
                </p>
              ) : (
                <p className="text-sm text-ink-700">
                  This is a verification result. Only pass/fail per requirement
                  is visible — never raw financial data.
                </p>
              )}
            </CardBody>
          </Card>

          {user?.role === "tenant" && !data.overallEligible ? (
            <Card>
              <CardBody>
                <Badge tone="warn" className="mb-2">
                  Tip
                </Badge>
                <p className="text-sm text-ink-700">
                  You didn&apos;t meet one or more bars. The landlord only sees
                  which requirements failed — not by how much.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </Container>
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
    <div
      className={`rounded-md border p-4 ${pass ? "border-success-500/30 bg-success-50/50" : "border-danger-500/30 bg-danger-50/50"}`}
    >
      <div className="text-xs text-ink-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-base font-semibold text-ink-900">{threshold}</div>
        <Badge tone={pass ? "success" : "danger"}>
          {pass ? "Pass" : "Fail"}
        </Badge>
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
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-ink-100 last:border-0">
      <span className="text-xs text-ink-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}
