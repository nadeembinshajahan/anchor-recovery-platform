import Link from "next/link";
import Greeting from "@/components/Greeting";

interface PathCard {
  href: string;
  title: string;
  body: string;
  cta: string;
  emphasis?: boolean;
}

const PATHS: readonly PathCard[] = [
  {
    href: "/sos",
    title: "I need support right now",
    body: "Tap how you feel and get a personal, step-by-step script instantly. Zero typing.",
    cta: "Open SOS",
    emphasis: true,
  },
  {
    href: "/companion",
    title: "Talk it out",
    body: "A hands-free voice companion that listens and responds in real time.",
    cta: "Start talking",
  },
  {
    href: "/caregiver",
    title: "I'm supporting someone",
    body: "Say-this-not-that scripts, warning signs, and practical steps for family.",
    cta: "Caregiver tools",
  },
  {
    href: "/learn",
    title: "Understand recovery",
    body: "Plain-language education on cravings, triggers, and relapse — explained on demand.",
    cta: "Browse topics",
  },
  {
    href: "/nearby",
    title: "Find help nearby",
    body: "De-addiction centres, hospitals, and pharmacies around you, plus 24×7 helplines.",
    cta: "Open map",
  },
  {
    href: "/plan",
    title: "My safety plan",
    body: "Store coping tools and a trusted contact on this device to personalize everything.",
    cta: "Edit plan",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="glass p-8">
        <Greeting />
        <h1 className="mt-1 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Steady support,{" "}
          <span className="text-primary">exactly when thinking is hardest.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Anchor supports people navigating substance use recovery — and the people who
          love them — with AI-personalized interventions built for moments of high
          stress: big buttons, short steps, voice-first, no typing required.
        </p>
      </section>

      <section aria-label="Choose your path" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PATHS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`glass lift group flex flex-col p-6 ${
              p.emphasis ? "ring-2 ring-danger/30" : ""
            }`}
          >
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.body}</p>
            <span
              className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${
                p.emphasis ? "text-danger" : "text-primary"
              }`}
            >
              {p.cta}
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>
        ))}
      </section>

      <section className="glass flex flex-col gap-2 p-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private by design</p>
          <p className="mt-1">
            Your safety plan never leaves this device. Anchor is a support tool, not a
            medical service — in an emergency, always call 112.
          </p>
        </div>
        <Link
          href="/plan"
          className="lift inline-flex shrink-0 items-center justify-center rounded-2xl bg-primary px-5 py-2.5 font-semibold text-white"
        >
          Set up my plan
        </Link>
      </section>
    </div>
  );
}
