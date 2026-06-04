import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <Container className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
        <div>
          &copy; {new Date().getFullYear()} Trst.it &middot; Confidential
          rental screening
        </div>
        <div className="flex items-center gap-4">
          <span>
            Powered by{" "}
            <a
              href="https://fhenix.zone"
              target="_blank"
              rel="noreferrer"
              className="text-ink-700 hover:text-ink-900 underline-offset-2 hover:underline"
            >
              Fhenix coFHE
            </a>
          </span>
        </div>
      </Container>
    </footer>
  );
}
