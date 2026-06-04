import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Container className="py-20">
      <div className="max-w-md mx-auto text-center">
        <Card>
          <CardBody className="py-12">
            <div className="text-xs font-mono uppercase tracking-wider text-brand-600 mb-3">
              404
            </div>
            <h1 className="text-xl font-semibold text-ink-900">
              Page not found
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="mt-6">
              <Link href="/">
                <Button variant="secondary">Back to home</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
