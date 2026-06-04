import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SetupBanner } from "@/components/setup-banner";

export const metadata: Metadata = {
  title: "Trst.it — Prove you qualify, without revealing why",
  description:
    "Confidential rental screening. Tenants prove they meet landlord requirements without exposing salary, credit, or employment data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <SetupBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
