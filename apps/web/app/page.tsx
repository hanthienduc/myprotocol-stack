import Link from "next/link";
import { Button } from "@myprotocolstack/ui";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            MyProtocolStack
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Build Your Personal
            <span className="text-primary block">Health Protocol Stack</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Combine science-backed protocols for sleep, focus, energy, and
            fitness into daily routines. Track adherence and see what works for
            you.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">Start Building Free</Button>
            </Link>
            <Link href="/protocols">
              <Button size="lg" variant="outline">
                Browse Protocols
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">How It Works</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <div className="text-4xl">1</div>
                <h3 className="mt-4 text-xl font-semibold">
                  Browse Protocols
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Explore 30+ science-backed protocols for sleep, focus, energy,
                  and fitness.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="text-4xl">2</div>
                <h3 className="mt-4 text-xl font-semibold">Build Your Stack</h3>
                <p className="mt-2 text-muted-foreground">
                  Combine protocols into a personalized daily routine that fits
                  your goals.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="text-4xl">3</div>
                <h3 className="mt-4 text-xl font-semibold">Track Progress</h3>
                <p className="mt-2 text-muted-foreground">
                  Check off completed protocols daily and see your adherence
                  over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">
              Protocol Categories
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: "Sleep",
                  icon: "🌙",
                  count: 8,
                  desc: "Optimize your sleep quality and circadian rhythm",
                },
                {
                  name: "Focus",
                  icon: "🎯",
                  count: 7,
                  desc: "Enhance concentration and deep work capacity",
                },
                {
                  name: "Energy",
                  icon: "⚡",
                  count: 8,
                  desc: "Sustain high energy throughout the day",
                },
                {
                  name: "Fitness",
                  icon: "💪",
                  count: 7,
                  desc: "Build strength, endurance, and recovery",
                },
              ].map((category) => (
                <div
                  key={category.name}
                  className="rounded-lg border p-6 text-center transition-colors hover:border-primary"
                >
                  <div className="text-4xl">{category.icon}</div>
                  <h3 className="mt-4 text-xl font-semibold">{category.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.count} protocols
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {category.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">
              Ready to Build Your Protocol Stack?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands optimizing their health with personalized protocol
              stacks. Free to start.
            </p>
            <div className="mt-8">
              <Link href="/login">
                <Button size="lg">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} MyProtocolStack. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
