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
    default: "Anchor — Recovery & Prevention Platform",
    template: "%s | Anchor",
  },
  description:
    "A GenAI-powered companion for people navigating substance use recovery and their caregivers: zero-typing crisis support, personalized emergency scripts, education, and contextual safety tools.",
  openGraph: {
    type: "website",
    title: "Anchor — A little more light for whatever today brings.",
    description:
      "Warm, zero-typing recovery support for hard moments, powered by Google Gemini.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Anchor — A little more light for whatever today brings.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anchor — A little more light for whatever today brings.",
    description:
      "Warm, zero-typing recovery support for hard moments, powered by Google Gemini.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7c866",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("anchor.theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}',
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
