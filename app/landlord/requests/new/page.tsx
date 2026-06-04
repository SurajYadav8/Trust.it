"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/role-guard";
import { generateSlug } from "@/lib/slug";
import { formatMoney } from "@/lib/format";

export default function NewRequestPage() {
  return (
    <RoleGuard role="landlord">
      <NewRequest />
    </RoleGuard>
  );
}

function NewRequest() {
  const router = useRouter();
  const { address } = useAccount();
  const create = useMutation(api.requests.create);

  const [title, setTitle] = useState("");
  const [propertyLabel, setPropertyLabel] = useState("");
  const [rent, setRent] = useState("");
  const [multiplier, setMultiplier] = useState("3");
  const [credit, setCredit] = useState("650");
  const [employment, setEmployment] = useState("12");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rentNum = Number(rent || 0);
  const multNum = Number(multiplier || 0);
  const requiredIncome = rentNum > 0 && multNum > 0 ? rentNum * multNum : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const id = await create({
        landlordAddress: address.toLowerCase(),
        title: title.trim() || "Verification request",
        propertyLabel: propertyLabel.trim() || undefined,
        monthlyRent: Number(rent),
        salaryMultiplier: Number(multiplier),
        minCreditScore: Number(credit),
        minEmploymentMonths: Number(employment),
        shareSlug: generateSlug(14),
      });
      router.push(`/landlord/requests/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="New request"
        title="Define eligibility"
        description="Set the requirements applicants must meet. Trst.it never asks for or stores the applicant's actual numbers — only whether they clear each bar."
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>
              All thresholds are public to the applicant; their financials are not visible to you.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-5">
              <Input
                label="Title"
                name="title"
                placeholder="2BR at 123 Market St"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
              />
              <Input
                label="Property label (optional)"
                name="propertyLabel"
                placeholder="Unit 4B"
                value={propertyLabel}
                onChange={(e) => setPropertyLabel(e.target.value)}
                disabled={busy}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Monthly rent"
                  name="rent"
                  type="number"
                  inputMode="decimal"
                  placeholder="2500"
                  prefix="$"
                  suffix="/mo"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  required
                  disabled={busy}
                />
                <Input
                  label="Income multiplier"
                  name="multiplier"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder="3"
                  suffix="× rent"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  required
                  disabled={busy}
                  hint={
                    requiredIncome > 0
                      ? `Tenant must earn ≥ ${formatMoney(requiredIncome)}/mo.`
                      : undefined
                  }
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Minimum credit score"
                  name="credit"
                  type="number"
                  inputMode="numeric"
                  placeholder="650"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  required
                  disabled={busy}
                />
                <Input
                  label="Minimum employment"
                  name="employment"
                  type="number"
                  inputMode="numeric"
                  placeholder="12"
                  suffix="months"
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>

              {error ? (
                <div className="rounded-md bg-danger-50 border border-danger-500/30 p-3 text-xs text-danger-700">
                  {error}
                </div>
              ) : null}
            </CardBody>
            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Create request
              </Button>
            </CardFooter>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <Badge tone="brand" className="mb-2">
                What you&apos;ll see
              </Badge>
              <ul className="space-y-2.5 text-sm text-ink-700">
                <li>— Pass / fail per requirement.</li>
                <li>— Overall eligibility verdict.</li>
                <li>— Wallet address of the applicant.</li>
              </ul>
              <Badge tone="neutral" className="mt-4 mb-2">
                What stays hidden
              </Badge>
              <ul className="space-y-2.5 text-sm text-ink-700">
                <li>— Actual income, credit score, tenure.</li>
                <li>— How much they exceed (or miss) each bar by.</li>
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
