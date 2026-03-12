import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";

import Navbar from "@/components/Navbar";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "West Midlands Wellbeing Portal",
  description: "Community health portal connecting West Midlands organizations and residents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <div className="min-h-screen px-3 pb-12 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
        <footer className="border-t border-white/50 bg-[#efe8dc]/85 px-6 py-8 text-sm text-neutral-600">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p>© {new Date().getFullYear()} West Midlands Wellbeing Portal</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/events" className="hover:text-brand-slate hover:underline">Events</Link>
              <Link href="/organizations" className="hover:text-brand-slate hover:underline">Organisations</Link>
              <details className="group relative">
                <summary className="cursor-pointer list-none text-neutral-500 hover:text-brand-slate">
                  Partner Portal
                </summary>
                <div className="wm-glass absolute right-0 z-50 mt-2 min-w-52 rounded-xl p-2 text-sm">
                  <Link href="/manager-signin" className="block rounded-lg px-3 py-2 hover:bg-white/80">Manager Login</Link>
                  <Link href="/referrals" className="mt-1 block rounded-lg px-3 py-2 hover:bg-white/80">Referral Pathways</Link>
                  <Link href="/onboarding" className="mt-1 block rounded-lg px-3 py-2 hover:bg-white/80">Register Organisation</Link>
                </div>
              </details>
            </div>
          </div>
        </footer>
        <AccessibilityToolbar />
      </body>
    </html>
  );
}
