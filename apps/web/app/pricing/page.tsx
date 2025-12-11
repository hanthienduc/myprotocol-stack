import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@myprotocolstack/database/server";
import { Button } from "@myprotocolstack/ui";
import { PricingComparison, PricingFAQ } from "@/components/pricing";

export const metadata: Metadata = {
  title: "Pricing - MyProtocolStack",
  description:
    "Choose the plan that fits your health optimization goals. Free forever or unlock Pro features for advanced analytics.",
  openGraph: {
    title: "Pricing - MyProtocolStack",
    description: "Free & Pro plans for health protocol tracking",
  },
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            MyProtocolStack
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog">
              <Button variant="ghost">Blog</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            {isLoggedIn ? (
              <Link href="/today">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/login">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free and upgrade when you need more. No hidden fees.
          </p>
        </section>

        {/* Pricing Comparison */}
        <section className="container mx-auto px-4 pb-16">
          <PricingComparison isLoggedIn={isLoggedIn} />
        </section>

        {/* FAQ */}
        <section className="border-t bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-2xl font-bold mb-8">
              Frequently Asked Questions
            </h2>
            <div className="max-w-2xl mx-auto">
              <PricingFAQ />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} MyProtocolStack. All rights
              reserved.
            </p>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/protocols" className="hover:text-foreground">
                Protocols
              </Link>
              <Link href="/blog" className="hover:text-foreground">
                Blog
              </Link>
              <Link href="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
