import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass mx-auto my-10 max-w-xl p-8 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-2 text-3xl font-semibold">That path doesn&apos;t exist.</h1>
      <p className="mt-3 text-muted">
        No worries — everything the app offers is one tap from home.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="sun-button sun-button-primary lift">
          Go home
        </Link>
        <Link href="/sos" className="sun-button sun-button-glass lift">
          I need support now
        </Link>
      </div>
    </div>
  );
}
