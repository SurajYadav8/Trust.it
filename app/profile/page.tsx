"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { RoleGuard } from "@/components/role-guard";
import { useEip1193Provider } from "@/lib/use-eip1193";
import { encryptProfile } from "@/lib/fhe";
import { submitProfileOnChain, isContractConfigured } from "@/lib/contract";
import {
  ACTIVE_CHAIN,
  CREDIT_MAX,
  CREDIT_MIN,
  EMPLOYMENT_MAX_MONTHS,
  SALARY_MAX,
} from "@/lib/constants";

export default function ProfilePage() {
  return (
    <RoleGuard role="tenant">
      <ProfileEditor />
    </RoleGuard>
  );
}

function ProfileEditor() {
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

  const [salary, setSalary] = useState("");
  const [credit, setCredit] = useState("");
  const [employment, setEmployment] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasExisting = existing !== undefined && existing !== null;

  const errors = validate({ salary, credit, employment });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !walletProvider || !publicClient || !walletClient) return;
    if (Object.values(errors).some(Boolean)) return;

    setBusy(true);
    setError(null);
    setStep("Initializing CoFHE…");

    try {
      const encrypted = await encryptProfile({
        publicClient,
        walletClient,
        address,
        salary: Number(salary),
        creditScore: Number(credit),
        employmentMonths: Number(employment),
        onState: (s) => setStep(`Encrypting: ${s}`),
      });

      let txHash: string | undefined;
      if (isContractConfigured()) {
        setStep("Submitting encrypted profile on-chain…");
        const tx = await submitProfileOnChain({
          walletProvider,
          salaryCt: encrypted.salaryCt,
          creditCt: encrypted.creditCt,
          employmentCt: encrypted.employmentCt,
        });
        txHash = tx.txHash;
      }

      setStep("Saving profile…");
      await upsert({
        walletAddress: address.toLowerCase(),
        encSalary: encrypted.serialized.salary,
        encCreditScore: encrypted.serialized.credit,
        encEmploymentMonths: encrypted.serialized.employment,
        onChainTxHash: txHash,
      });

      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile submission failed.");
    } finally {
      setBusy(false);
      setStep(null);
    }
  };

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow={hasExisting ? "Edit profile" : "Create profile"}
        title="Your encrypted profile"
        description="Salary, credit, and employment are encrypted on your device with Fhenix CoFHE before they ever leave it. Submit once — reuse it everywhere."
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Financial profile</CardTitle>
            <CardDescription>
              These values are encrypted client-side. Trst.it and any landlord
              you share with will never see them.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-5">
              <Input
                label="Monthly gross income"
                name="salary"
                type="number"
                inputMode="decimal"
                placeholder="6500"
                prefix="$"
                suffix="/mo"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                error={errors.salary}
                hint="Used to check the landlord's rent-to-income multiplier."
                disabled={busy}
              />
              <Input
                label="Credit score"
                name="credit"
                type="number"
                inputMode="numeric"
                placeholder="720"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                error={errors.credit}
                hint={`Between ${CREDIT_MIN} and ${CREDIT_MAX}.`}
                disabled={busy}
              />
              <Input
                label="Months at current employer"
                name="employment"
                type="number"
                inputMode="numeric"
                placeholder="24"
                suffix="months"
                value={employment}
                onChange={(e) => setEmployment(e.target.value)}
                error={errors.employment}
                hint="Continuous employment with the same employer."
                disabled={busy}
              />

              {error ? (
                <div className="rounded-md bg-danger-50 border border-danger-500/30 p-3 text-xs text-danger-700">
                  {error}
                </div>
              ) : null}

              {onWrongChain ? (
                <div className="rounded-md bg-warn-50 border border-warn-500/30 p-3 text-xs text-warn-700 flex items-center justify-between gap-3">
                  <span>
                    Your wallet is on chain id {connectedChainId}. Switch to{" "}
                    {ACTIVE_CHAIN.name} ({ACTIVE_CHAIN.id}) to encrypt and
                    submit on-chain.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={switching}
                    onClick={() => switchChain({ chainId: ACTIVE_CHAIN.id })}
                  >
                    Switch network
                  </Button>
                </div>
              ) : null}
            </CardBody>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs text-ink-500 flex items-center gap-2 min-h-[20px]">
                {busy ? (
                  <>
                    <Spinner />
                    <span>{step ?? "Working…"}</span>
                  </>
                ) : hasExisting ? (
                  <>Last updated {new Date(existing.updatedAt).toLocaleDateString()}</>
                ) : null}
              </div>
              <Button
                type="submit"
                loading={busy}
                disabled={
                  !walletProvider ||
                  !publicClient ||
                  !walletClient ||
                  onWrongChain ||
                  Object.values(errors).some(Boolean) ||
                  !salary ||
                  !credit ||
                  !employment
                }
                title={disabledReason({
                  walletProvider,
                  publicClient,
                  walletClient,
                  onWrongChain,
                  errors,
                  salary,
                  credit,
                  employment,
                })}
              >
                {hasExisting ? "Update encrypted profile" : "Encrypt and save"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <Badge tone="brand" className="mb-2">
                What gets shared
              </Badge>
              <ul className="space-y-3 text-sm text-ink-700">
                <li className="flex gap-2">
                  <span className="text-ink-300">—</span>
                  <span>
                    <strong className="text-ink-900">Landlord sees:</strong>{" "}
                    pass / fail per requirement and a final eligibility verdict.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-ink-300">—</span>
                  <span>
                    <strong className="text-ink-900">Landlord never sees:</strong>{" "}
                    your salary, credit score, or employment duration.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-ink-300">—</span>
                  <span>
                    <strong className="text-ink-900">Trst.it never sees:</strong>{" "}
                    plaintext of any of your values.
                  </span>
                </li>
              </ul>
            </CardBody>
          </Card>

          {!isContractConfigured() ? (
            <Card>
              <CardBody>
                <Badge tone="warn" className="mb-2">
                  Setup required
                </Badge>
                <p className="text-sm text-ink-700">
                  No CoFHE contract address is configured. Encryption will
                  still happen locally, but the encrypted profile won&apos;t be
                  stored on-chain until you set{" "}
                  <code className="text-xs">
                    NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS
                  </code>
                  .
                </p>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}

function disabledReason(args: {
  walletProvider: unknown;
  publicClient: unknown;
  walletClient: unknown;
  onWrongChain: boolean;
  errors: { salary?: string; credit?: string; employment?: string };
  salary: string;
  credit: string;
  employment: string;
}): string | undefined {
  if (!args.walletProvider) return "Connect your wallet to continue.";
  if (!args.publicClient) return "Loading network client…";
  if (args.onWrongChain) return `Switch to ${ACTIVE_CHAIN.name} first.`;
  if (!args.walletClient) return "Loading wallet client…";
  if (!args.salary || !args.credit || !args.employment)
    return "Fill in all three fields.";
  if (Object.values(args.errors).some(Boolean))
    return "Fix the highlighted fields.";
  return undefined;
}

function validate({
  salary,
  credit,
  employment,
}: {
  salary: string;
  credit: string;
  employment: string;
}) {
  const errors: { salary?: string; credit?: string; employment?: string } = {};
  if (salary !== "") {
    const n = Number(salary);
    if (!Number.isFinite(n) || n < 0) errors.salary = "Must be a positive number.";
    else if (n > SALARY_MAX) errors.salary = "That's unusually high — check the value.";
  }
  if (credit !== "") {
    const n = Number(credit);
    if (!Number.isFinite(n) || n < CREDIT_MIN || n > CREDIT_MAX)
      errors.credit = `Must be ${CREDIT_MIN}..${CREDIT_MAX}.`;
  }
  if (employment !== "") {
    const n = Number(employment);
    if (!Number.isFinite(n) || n < 0 || n > EMPLOYMENT_MAX_MONTHS)
      errors.employment = `Must be 0..${EMPLOYMENT_MAX_MONTHS} months.`;
  }
  return errors;
}
