import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HotlineBar from "@/components/HotlineBar";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://34.14.134.236.sslip.io",
  ),
  title: {
    default: "Pulari — Recovery & Prevention Platform",
    template: "%s | Pulari",
  },
  description:
    "A GenAI-powered companion for people navigating substance use recovery and their caregivers: zero-typing crisis support, personalized emergency scripts, education, and contextual safety tools.",
  openGraph: {
    type: "website",
    title: "Pulari — A little more light for whatever today brings.",
    description:
      "Warm, zero-typing recovery support for hard moments, powered by Google Gemini.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Pulari — A little more light for whatever today brings.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulari — A little more light for whatever today brings.",
    description:
      "Warm, zero-typing recovery support for hard moments, powered by Google Gemini.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7c866" },
    { media: "(prefers-color-scheme: dark)", color: "#191410" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* No-flash theme resolution. A stored choice wins; otherwise follow
            the OS via prefers-color-scheme (the html element deliberately
            ships with NO data-theme so the pure-CSS media query below also
            works when JavaScript is unavailable). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("pulari.theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}',
          }}
        />
      </head>
      <body className="site-body flex min-h-svh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <div className="theme-toggle-shell">
          <ThemeToggle />
        </div>
        <div className="app-shell mx-auto flex w-full max-w-[1480px] flex-1 flex-col gap-5 px-3 py-3 sm:px-5 sm:py-5 lg:flex-row lg:gap-7 lg:px-8 lg:py-7">
          <Sidebar />
          <main id="main" className="main-canvas min-w-0 flex-1 animate-fade-up">
            {children}
          </main>
        </div>
        <HotlineBar />
      </body>
    </html>
  );
}
