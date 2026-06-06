"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/role-guard";
import { generateSlug } from "@/lib/slug";
import { cn, Currency, formatMoney } from "@/lib/format";
import { LandlordMinEmploymentMonths } from "@/lib/employment-duration";
import { EmploymentDurationSelect } from "@/components/employment-duration-select";
import {
  FORM_ACTION_FOOTER_CLASS,
  FORM_FIELD_LABEL_CLASS,
  FORM_SECTION_HEADING_CLASS,
  PRIMARY_CARD_CLASS,
} from "@/lib/ui-classes";

const CURRENCY_SELECT_CLASS =
  "h-[40px] rounded-md border border-ink-200 bg-white px-2.5 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:focus:ring-accent-400/30";

export default function NewRequestPage() {
  return (
    <RoleGuard role="landlord">
      <NewPropertyScreening />
    </RoleGuard>
  );
}

function NewPropertyScreening() {
  const router = useRouter();
  const { address } = useAccount();
  const create = useMutation(api.requests.create);

  const [title, setTitle] = useState("");
  const [propertyLabel, setPropertyLabel] = useState("");
  const [rent, setRent] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [multiplier, setMultiplier] = useState("3");
  const [credit, setCredit] = useState("650");
  const [employmentMinMonths, setEmploymentMinMonths] =
    useState<LandlordMinEmploymentMonths>(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rentNum = Number(rent || 0);
  const multNum = Number(multiplier || 0);
  const requiredIncome = rentNum > 0 && multNum > 0 ? rentNum * multNum : 0;
  const showIncomeSummary = rentNum > 0 && multNum > 0;
  const currencySymbol = currency === "INR" ? "₹" : "$";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const id = await create({
        landlordAddress: address.toLowerCase(),
        title: title.trim() || "Property screening",
        propertyLabel: propertyLabel.trim() || undefined,
        monthlyRent: Number(rent),
        rentCurrency: currency,
        salaryMultiplier: Number(multiplier),
        minCreditScore: Number(credit),
        minEmploymentMonths: employmentMinMonths,
        shareSlug: generateSlug(14),
      });
      router.push(`/landlord/requests/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create screening.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
          Create Property Screening
        </h1>

        <Card className={PRIMARY_CARD_CLASS}>
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-0 px-5 py-5 sm:px-6">
              <div className="space-y-2.5">
                <Input
                  label="Property Name"
                  labelClassName={FORM_FIELD_LABEL_CLASS}
                  name="title"
                  placeholder="2BR at 123 Market St"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={busy}
                  required
                />
                <Input
                  label="Property Label (Optional)"
                  labelClassName={FORM_FIELD_LABEL_CLASS}
                  name="propertyLabel"
                  placeholder="Unit 4B"
                  value={propertyLabel}
                  onChange={(e) => setPropertyLabel(e.target.value)}
                  disabled={busy}
                />
              </div>

              <section className="mt-4 border-t border-accent-400/10 pt-4 dark:border-accent-400/8">
                <h2 className={FORM_SECTION_HEADING_CLASS}>
                  Screening Requirements
                </h2>

                <div className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="w-full">
                      <label
                        htmlFor="rent"
                        className={cn("mb-1.5 block", FORM_FIELD_LABEL_CLASS)}
                      >
                        Monthly Rent
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={currency}
                          onChange={(e) =>
                            setCurrency(e.target.value as Currency)
                          }
                          disabled={busy}
                          aria-label="Rent currency"
                          className={CURRENCY_SELECT_CLASS}
                        >
                          <option value="INR">INR ₹</option>
                          <option value="USD">USD $</option>
                        </select>
                        <div className="flex flex-1 items-center rounded-md border border-ink-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/40 dark:border-white/12 dark:bg-white/[0.04] dark:focus-within:border-accent-400/60 dark:focus-within:ring-accent-400/30">
                          <span className="pl-3 text-sm text-ink-400 select-none dark:text-white/40">
                            {currencySymbol}
                          </span>
                          <input
                            id="rent"
                            name="rent"
                            type="number"
                            inputMode="decimal"
                            placeholder={currency === "INR" ? "25000" : "2500"}
                            value={rent}
                            onChange={(e) => setRent(e.target.value)}
                            required
                            disabled={busy}
                            className="w-full bg-transparent px-2 py-2 text-sm text-ink-900 outline-none dark:text-white"
                          />
                          <span className="pr-3 text-xs text-ink-400 select-none dark:text-white/40">
                            /mo
                          </span>
                        </div>
                      </div>
                    </div>
                    <Input
                      label="Required Income Multiple"
                      labelClassName={FORM_FIELD_LABEL_CLASS}
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
                    />
                  </div>

                  {showIncomeSummary ? (
                    <p className="rounded-md border border-accent-400/15 bg-accent-400/[0.04] px-3 py-2 text-xs text-ink-600 dark:border-accent-400/12 dark:bg-accent-400/[0.06] dark:text-white/55">
                      Monthly rent{" "}
                      <span className="font-medium text-brand-700 dark:text-accent-200">
                        {formatMoney(rentNum, currency)}
                      </span>
                      <span className="text-ink-400 dark:text-white/30">
                        {" "}
                        ·{" "}
                      </span>
                      Required income{" "}
                      <span className="font-medium text-brand-700 dark:text-accent-200">
                        {multNum}× rent
                      </span>
                      {requiredIncome > 0 ? (
                        <>
                          <span className="text-ink-400 dark:text-white/30">
                            {" "}
                            ·{" "}
                          </span>
                          <span className="font-medium text-brand-700 dark:text-accent-200">
                            ≥ {formatMoney(requiredIncome, currency)}/mo
                          </span>
                        </>
                      ) : null}
                    </p>
                  ) : null}

                  <Input
                    label="Minimum Credit Score"
                    labelClassName={FORM_FIELD_LABEL_CLASS}
                    name="credit"
                    type="number"
                    inputMode="numeric"
                    placeholder="650"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    required
                    disabled={busy}
                  />

                  <div>
                    <p className={cn("mb-1.5", FORM_FIELD_LABEL_CLASS)}>
                      Minimum Employment Duration
                    </p>
                    <EmploymentDurationSelect
                      value={employmentMinMonths}
                      onChange={setEmploymentMinMonths}
                      disabled={busy}
                    />
                  </div>
                </div>
              </section>

              {error ? (
                <div className="mt-3 rounded-md border border-danger-500/30 bg-danger-50 p-2.5 text-xs text-danger-700 dark:bg-danger-500/10 dark:text-danger-500">
                  {error}
                </div>
              ) : null}
            </CardBody>

            <div
              className={cn(
                FORM_ACTION_FOOTER_CLASS,
                "flex items-center justify-end gap-3"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Create screening
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}
