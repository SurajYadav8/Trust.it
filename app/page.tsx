import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-ink-100">
        <Container className="py-20 sm:py-28">
          <div className="max-w-3xl">
            <Badge tone="brand" className="mb-5">
              Confidential rental screening
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink-900">
              Prove you qualify.{" "}
              <span className="text-ink-500">Without revealing why.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-600 max-w-2xl">
              Tenants build one reusable profile. Landlords define eligibility
              rules. Both see a clear pass / fail — never the raw salary,
              credit score, or employment history behind it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/onboarding?role=tenant">
                <Button size="lg">I&apos;m a tenant</Button>
              </Link>
              <Link href="/onboarding?role=landlord">
                <Button size="lg" variant="secondary">
                  I&apos;m a landlord
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-500">
              No accounts. No passwords. Your wallet is your identity.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-ink-100 bg-ink-50/40">
        <Container className="py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureBlock
              eyebrow="01"
              title="Encrypted at the source"
              body="Salary, credit, and employment are encrypted on your device with Fhenix CoFHE before they ever leave it."
            />
            <FeatureBlock
              eyebrow="02"
              title="Compared on ciphertext"
              body="Threshold checks run on encrypted values on-chain. The platform never sees plaintext."
            />
            <FeatureBlock
              eyebrow="03"
              title="Only the answer is revealed"
              body="Landlords see a clean pass / fail per requirement. They never learn the underlying numbers."
            />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-16 sm:py-24">
          <div className="grid gap-10 sm:grid-cols-2">
            <PathCard
              role="Tenants"
              points={[
                "Enter your salary, credit, and employment once.",
                "Open any landlord link and run an encrypted check.",
                "See exactly which requirements you cleared.",
              ]}
              cta={{ href: "/onboarding?role=tenant", label: "Start as a tenant" }}
            />
            <PathCard
              role="Landlords"
              points={[
                "Publish requirements: rent, credit, tenure.",
                "Send applicants a single shareable link.",
                "See pass / fail outcomes — no PII, no liability.",
              ]}
              cta={{
                href: "/onboarding?role=landlord",
                label: "Start as a landlord",
              }}
            />
          </div>
        </Container>
      </section>
    </div>
  );
}

function FeatureBlock({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-xs font-mono text-brand-600 mb-2">{eyebrow}</div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}

function PathCard({
  role,
  points,
  cta,
}: {
  role: string;
  points: string[];
  cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-8 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-brand-600">
        For {role}
      </div>
      <ul className="mt-4 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-sm text-ink-700">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-300 flex-shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <Link href={cta.href} className="inline-block mt-6">
        <Button variant="secondary">{cta.label}</Button>
      </Link>
    </div>
  );
}
