import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import Navbar from "@/components/Navbar";

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
        <div className="min-h-screen">{children}</div>
        <footer className="border-t border-neutral-200 bg-[#FFFBF0] px-6 py-8 text-sm text-neutral-500">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p>© {new Date().getFullYear()} West Midlands Wellbeing Portal</p>
            <div className="flex gap-4">
              <a href="/manager-signin" className="hover:text-brand-slate hover:underline">Staff Login</a>
              <a href="/referrals" className="hover:text-brand-slate hover:underline">Referral Pathways</a>
              <a href="/onboarding" className="hover:text-brand-slate hover:underline">Register Organisation</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
