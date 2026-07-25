import Link from "next/link";

const NAV = [
  { href: "/sos", label: "Get help now" },
  { href: "/companion", label: "Talk" },
  { href: "/learn", label: "Learn" },
  { href: "/nearby", label: "Nearby" },
  { href: "/caregiver", label: "Caregivers" },
  { href: "/plan", label: "My plan" },
] as const;

export default function Header() {
  return (
    <header className="border-b border-surface-2 bg-surface">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
      >
        <Link href="/" className="mr-2 text-lg font-bold text-primary">
          ⚓ Anchor
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/sos"
          className="ml-auto rounded-full bg-danger px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          SOS
        </Link>
      </nav>
    </header>
  );
}
