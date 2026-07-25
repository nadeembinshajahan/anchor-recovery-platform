"use client";

/**
 * Frosted sidebar navigation. Desktop-first: fixed rail on large screens,
 * horizontal scrollable bar on small ones. Active route gets a soft pill.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" {...stroke}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/sos",
    label: "Get help now",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" {...stroke}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="m5.7 5.7 3.8 3.8m5 5 3.8 3.8m0-12.6-3.8 3.8m-5 5-3.8 3.8" />
      </svg>
    ),
  },
  {
    href: "/companion",
    label: "Talk it out",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" {...stroke}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    ),
  },
  {
    href: "/learn",
    label: "Learn",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" {...stroke}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
        <path d="M4 20.5V5.5M20 18v3H6.5" />
      </svg>
    ),
  },
  {
    href: "/nearby",
    label: "Nearby help",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" {...stroke}>
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/caregiver",
    label: "Caregivers",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" {...stroke}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M17 8.5c2 .8 2 3.7 0 4.5M19.5 20a6 6 0 0 0-3.5-5.4" />
      </svg>
    ),
  },
  {
    href: "/plan",
    label: "My plan",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" {...stroke}>
        <rect x="5" y="4" width="14" height="17" rx="2.5" />
        <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3.5" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="sun-nav"
    >
      <Link
        href="/"
        className="brand-home"
      >
        <span aria-hidden="true" className="brand-mark">
          <span className="brand-sun" />
          <span className="brand-horizon" />
        </span>
        <span className="brand-copy">
          <strong>Anchor</strong>
          <small>A steadier moment</small>
        </span>
      </Link>

      <div className="nav-scroll">
        <p className="nav-label">Explore</p>
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`nav-item lift ${active ? "nav-item-active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="nav-spacer" />
      <div className="nav-care">
        <span className="nav-care-sun" aria-hidden="true" />
        <p>Hard moment?</p>
        <span>You can start with one tap.</span>
        <Link href="/sos" className="nav-sos lift">
          Get support now
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </nav>
  );
}
