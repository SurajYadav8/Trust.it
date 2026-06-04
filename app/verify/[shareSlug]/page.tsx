"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty";
import { WalletConnectButton } from "@/components/wallet-connect";
import { useEip1193Provider } from "@/lib/use-eip1193";
import { ensureFheReady } from "@/lib/fhe";
import { isContractConfigured, runVerification } from "@/lib/contract";
import { ACTIVE_CHAIN } from "@/lib/constants";
import {
  formatAddress,
  formatMoney,
  formatMonths,
} from "@/lib/format";

type Phase =
  | "idle"
  | "initializing"
  | "submitting"
  | "decrypting"
  | "saving"
  | "done"
  | "error";

export default function VerifyPage() {
  const params = useParams<{ shareSlug: string }>();
  const slug = params?.shareSlug;
  return <VerifyByCslug slug={slug ?? ""} />;
}

function VerifyByCslug({ slug }: { slug: string }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const walletProvider = useEip1193Provider();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const { data: walletClient } = useWalletClient({ chainId: ACTIVE_CHAIN.id });

  const request = useQuery(
    api.requests.getBySlug,
    slug ? { slug } : "skip"
  );
  const user = useQuery(
    api.users.get,
    isConnected && address ? { walletAddress: address.toLowerCase() } : "skip"
  );
  const profile = useQuery(
    api.profiles.get,
    user?.role === "tenant" && address
      ? { walletAddress: address.toLowerCase() }
      : "skip"
  );
  const existingResult = useQuery(
    api.results.findExisting,
    request && address && user?.role === "tenant"
      ? { requestId: request._id, tenantAddress: address.toLowerCase() }
      : "skip"
  );

  const recordResult = useMutation(api.results.record);

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (request === undefined) {
    return (
      <Container className="py-16">
        <div className="h-32 bg-ink-50 rounded-md animate-pulse" />
      </Container>
    );
  }

  if (request === null) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Verification not found"
          description="This link is invalid or has been removed."
        />
      </Container>
    );
  }

  const requiredIncome = request.monthlyRent * request.salaryMultiplier;

  const handleRun = async () => {
    if (
      !address ||
      !walletProvider ||
      !publicClient ||
      !walletClient ||
      !profile ||
      !request
    )
      return;
    setError(null);
    setPhase("initializing");
    setStatusMsg("Preparing CoFHE client…");
    try {
      await ensureFheReady({ publicClient, walletClient, address });

      if (!isContractConfigured()) {
        throw new Error(
          "NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS is not set. Deploy contracts/TrstItVerifier.sol and add the address to .env.local before running verifications."
        );
      }

      setPhase("submitting");
      const readout = await runVerification({
        walletProvider,
        publicClient,
        walletClient,
        address,
        monthlyRent: request.monthlyRent,
        salaryMultiplier: request.salaryMultiplier,
        minCreditScore: request.minCreditScore,
        minEmploymentMonths: request.minEmploymentMonths,
        onProgress: (msg) => {
          setStatusMsg(msg);
          if (msg.toLowerCase().includes("decrypt")) setPhase("decrypting");
        },
      });

      setPhase("saving");
      setStatusMsg("Saving result…");
      const resultId = await recordResult({
        requestId: request._id,
        tenantAddress: address.toLowerCase(),
        passSalary: readout.passSalary,
        passCredit: readout.passCredit,
        passEmployment: readout.passEmployment,
        overallEligible: readout.overallEligible,
        onChainTxHash: readout.txHash,
      });

      setPhase("done");
      router.push(`/results/${resultId}`);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Verification failed.");
    }
  };

  const busy =
    phase === "initializing" ||
    phase === "submitting" ||
    phase === "decrypting" ||
    phase === "saving";

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="Verification request"
        title={request.title}
        description={
          request.propertyLabel ?? "Run an encrypted check to see if you qualify."
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>
                These are the bars to clear. Your actual values stay encrypted.
              </CardDescription>
            </CardHeader>
            <CardBody className="grid sm:grid-cols-3 gap-4">
              <ThresholdCell
                label="Monthly income"
                value={`≥ ${formatMoney(requiredIncome)}`}
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
            <CardHeader>
              <CardTitle>Run the verification</CardTitle>
              <CardDescription>
                Your profile is compared on encrypted values. Only the three
                pass/fail booleans (and the overall verdict) ever get decrypted.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-4">
              {!isConnected ? (
                <div className="text-center py-6">
                  <p className="text-sm text-ink-600 mb-4">
                    Connect your wallet to continue.
                  </p>
                  <WalletConnectButton />
                </div>
              ) : user === undefined || profile === undefined ? (
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Spinner /> Loading your account…
                </div>
              ) : user === null ? (
                <CalloutAction
                  title="Finish onboarding first"
                  description="Pick your role to use Trst.it as a tenant."
                  cta={
                    <Button onClick={() => router.push("/onboarding?role=tenant")}>
                      Continue
                    </Button>
                  }
                />
              ) : user.role !== "tenant" ? (
                <CalloutAction
                  title="This wallet is registered as a landlord"
                  description="Switch to a tenant wallet to run verifications."
                />
              ) : profile === null ? (
                <CalloutAction
                  title="Create your encrypted profile first"
                  description="Enter your salary, credit, and employment once — encrypted on your device."
                  cta={
                    <Button onClick={() => router.push("/profile")}>
                      Create profile
                    </Button>
                  }
                />
              ) : existingResult ? (
                <CalloutAction
                  title="You've already verified against this request"
                  description="Open your result, or re-run if your profile has changed."
                  cta={
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() =>
                          router.push(`/results/${existingResult._id}`)
                        }
                      >
                        View result
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleRun}
                        loading={busy}
                      >
                        Re-run
                      </Button>
                    </div>
                  }
                />
              ) : (
                <>
                  <ul className="text-sm text-ink-700 space-y-2">
                    <Bullet>
                      Your encrypted profile is compared against the thresholds
                      above using Fhenix CoFHE.
                    </Bullet>
                    <Bullet>
                      The landlord sees only pass/fail per requirement — never
                      your numbers.
                    </Bullet>
                    <Bullet>
                      Decryption is async; this takes a few seconds while the
                      threshold network finalizes.
                    </Bullet>
                  </ul>

                  {error ? (
                    <div className="rounded-md bg-danger-50 border border-danger-500/30 p-3 text-xs text-danger-700">
                      {error}
                    </div>
                  ) : null}

                  {busy ? (
                    <div className="rounded-md bg-brand-50 border border-brand-500/30 p-3 text-sm text-brand-700 flex items-center gap-3">
                      <Spinner />
                      <span>{statusMsg ?? "Working…"}</span>
                    </div>
                  ) : null}
                </>
              )}
            </CardBody>
            {isConnected && user?.role === "tenant" && profile && !existingResult ? (
              <CardFooter className="flex justify-end">
                <Button onClick={handleRun} loading={busy} disabled={!walletProvider}>
                  Run verification
                </Button>
              </CardFooter>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <Badge tone="brand" className="mb-2">
                What the landlord will see
              </Badge>
              <ul className="space-y-2.5 text-sm text-ink-700">
                <li>— Your wallet address: {address ? formatAddress(address) : "—"}</li>
                <li>— Three pass/fail booleans</li>
                <li>— Overall eligibility verdict</li>
              </ul>
              <Badge tone="neutral" className="mt-4 mb-2">
                What stays hidden
              </Badge>
              <ul className="space-y-2.5 text-sm text-ink-700">
                <li>— Your actual salary</li>
                <li>— Your actual credit score</li>
                <li>— Your actual employment duration</li>
                <li>— How close (or far) you are from each threshold</li>
              </ul>
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-ink-300 select-none">—</span>
      <span>{children}</span>
    </li>
  );
}

function CalloutAction({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-ink-100 bg-ink-50/50 p-5 text-center">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description ? (
        <p className="text-xs text-ink-500 mt-1 max-w-md mx-auto">
          {description}
        </p>
      ) : null}
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}
