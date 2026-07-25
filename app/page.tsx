import Link from "next/link";

interface PathCard {
  href: string;
  title: string;
  body: string;
  emphasis?: boolean;
}

const PATHS: readonly PathCard[] = [
  {
    href: "/sos",
    title: "I need support right now",
    body: "Zero-typing crisis flows: tap how you feel and get a personal, step-by-step script instantly.",
    emphasis: true,
  },
  {
    href: "/companion",
    title: "Talk it out",
    body: "A hands-free voice companion that listens and responds in real time — no typing needed.",
  },
  {
    href: "/caregiver",
    title: "I'm supporting someone",
    body: "Say-this-not-that scripts, warning signs, and practical steps for family and caregivers.",
  },
  {
    href: "/learn",
    title: "Understand recovery",
    body: "Plain-language education on cravings, triggers, relapse, and how to help — explained by AI on demand.",
  },
  {
    href: "/nearby",
    title: "Find help nearby",
    body: "Locate de-addiction centres, hospitals, and pharmacies around you, plus 24x7 helplines.",
  },
  {
    href: "/plan",
    title: "My safety plan",
    body: "Store your coping tools and trusted contact on this device to personalize every intervention.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Steady support, <span className="text-primary">exactly when thinking is hardest.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted">
          Anchor supports people navigating substance use recovery — and the people who love
          them — with AI-personalized interventions designed for moments of high stress:
          big buttons, short steps, voice-first, no typing required.
        </p>
      </section>

      <section aria-label="Choose your path" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PATHS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`block rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${
              p.emphasis
                ? "border-danger/40 bg-danger-soft"
                : "border-surface-2 bg-surface"
            }`}
          >
            <h2 className="mb-2 text-xl font-semibold">{p.title}</h2>
            <p className="text-sm text-muted">{p.body}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl bg-surface-2 p-6 text-sm text-muted">
        <h2 className="mb-2 font-semibold text-foreground">Private by design</h2>
        <p>
          Your safety plan never leaves this device. Anchor is a support tool, not a medical
          service — in an emergency, always call 112 or a helpline below.
        </p>
      </section>
    </div>
  );
}
