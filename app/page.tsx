import Link from "next/link";
import Greeting from "@/components/Greeting";

interface PathCard {
  href: string;
  title: string;
  body: string;
  cta: string;
  marker: string;
  tone: "sun" | "peach" | "sage" | "sky" | "lilac" | "cream";
  className?: string;
}

const PATHS: readonly PathCard[] = [
  {
    href: "/sos",
    title: "I need support right now",
    body: "Tap how you feel and get a personal, step-by-step script instantly. Zero typing.",
    cta: "Find my next step",
    marker: "Right now",
    tone: "sun",
    className: "path-card-featured",
  },
  {
    href: "/companion",
    title: "Talk it out",
    body: "A hands-free voice companion that listens and responds in real time.",
    cta: "Start talking",
    marker: "Voice-first",
    tone: "peach",
    className: "path-card-voice",
  },
  {
    href: "/caregiver",
    title: "I'm supporting someone",
    body: "Say-this-not-that scripts, warning signs, and practical steps for family.",
    cta: "Get a script",
    marker: "For caregivers",
    tone: "sage",
  },
  {
    href: "/learn",
    title: "Understand recovery",
    body: "Plain-language education on cravings, triggers, and relapse — explained on demand.",
    cta: "Explore gently",
    marker: "Learn",
    tone: "sky",
  },
  {
    href: "/nearby",
    title: "Find help nearby",
    body: "De-addiction centres, hospitals, and pharmacies around you, plus 24×7 helplines.",
    cta: "See nearby help",
    marker: "Around you",
    tone: "lilac",
  },
  {
    href: "/plan",
    title: "My safety plan",
    body: "Store coping tools and a trusted contact on this device for personal SOS and tap-to-talk support.",
    cta: "Make it mine",
    marker: "Private & personal",
    tone: "cream",
  },
];

export default function HomePage() {
  return (
    <div className="home-stack">
      <section className="sunrise-hero">
        <div className="hero-copy">
          <Greeting />
          <h1>
            A little more light
            <span>for whatever today brings.</span>
          </h1>
          <p className="hero-lede">
            Calm, personal support for recovery—made for the moments when thinking
            feels hard and one gentle next step is enough.
          </p>
          <div className="hero-actions">
            <Link href="/sos" className="sun-button sun-button-primary">
              I need support now
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/companion" className="sun-button sun-button-glass">
              <span className="voice-pulse" aria-hidden="true" />
              Talk to Pulari
            </Link>
          </div>
          <ul className="hero-promises" aria-label="What to expect">
            <li><span aria-hidden="true">✓</span> No judgment</li>
            <li><span aria-hidden="true">✓</span> Zero typing</li>
            <li><span aria-hidden="true">✓</span> Private by design</li>
          </ul>
        </div>

        <div className="sun-window" aria-hidden="true">
          <div className="sun-orbit sun-orbit-one" />
          <div className="sun-orbit sun-orbit-two" />
          <div className="sun-disc">
            <span>Take one slow breath</span>
            <strong>You’re here.</strong>
            <small>That matters.</small>
          </div>
          <div className="floating-note floating-note-top">
            <span className="note-dot" />
            Support that meets you here
          </div>
          <div className="floating-note floating-note-bottom">
            One next step. Not the whole journey.
          </div>
        </div>
      </section>

      <section aria-labelledby="paths-heading" className="path-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start where you are</p>
            <h2 id="paths-heading">What would feel helpful?</h2>
          </div>
          <p>You don’t need the perfect words. Choose the closest fit.</p>
        </div>

        <div className="path-grid">
          {PATHS.map((path) => (
            <Link
              key={path.href}
              href={path.href}
              data-tone={path.tone}
              className={`path-card lift ${path.className ?? ""}`}
            >
              <span className="path-marker">{path.marker}</span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="path-cta">
                {path.cta}
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="privacy-ribbon">
        <div className="privacy-seal" aria-hidden="true">
          <span>phone stays</span>
          <strong>local</strong>
        </div>
        <div className="privacy-copy">
          <p className="eyebrow">A quieter kind of technology</p>
          <h2>Your story stays yours.</h2>
          <p>
            Your plan is saved on this device. Selected details may be sent to
            Google Gemini for personalized support; your trusted contact&apos;s phone
            number always stays local.
          </p>
        </div>
        <Link
          href="/plan"
          className="sun-button sun-button-glass shrink-0"
        >
          Personalize Pulari
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
