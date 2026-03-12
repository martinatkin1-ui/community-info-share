"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { VolunteerSession } from "@/lib/volunteer/session";

const TABS = [
  { label: "Events", href: "/events" },
  { label: "Organisations", href: "/organizations" },
];

const STAFF_LINKS = [
  { label: "Manager Login", href: "/manager-signin" },
  { label: "Referral Pathways", href: "/referrals" },
];

const SPECIALIST_SUPPORT_LINKS = [
  { label: "Prison Leavers", href: "/support/prison-leavers" },
  { label: "Rehab Graduates", href: "/support/residential-rehab-graduates" },
  { label: "Mental Health Discharge", href: "/support/mental-health-discharge" },
  { label: "Homelessness Support", href: "/support/homelessness-support" },
  { label: "New To Recovery", href: "/support/new-to-recovery" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [volunteer, setVolunteer] = useState<VolunteerSession | null>(null);
  const [copiedHref, setCopiedHref] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check volunteer cookie via API
  useEffect(() => {
    fetch("/api/volunteer/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.session) setVolunteer(d.session);
      })
      .catch(() => {});
  }, []);

  // Check Supabase session to decide whether to show Staff & Partners inline
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      setIsStaff(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e: unknown, session: Session | null) => {
      setIsStaff(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMobileOpen(false);
    setDropdownOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function copySpecialistLink(href: string) {
    try {
      const absolute = `${window.location.origin}${href}`;
      await navigator.clipboard.writeText(absolute);
      setCopiedHref(href);
      window.setTimeout(() => {
        setCopiedHref((current) => (current === href ? null : current));
      }, 1400);
    } catch {
      setCopiedHref(null);
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/40 bg-[#f2ecdf]/90 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Brand */}
        <Link
          href="/events"
          className="flex items-center gap-2 text-sm font-bold tracking-tight text-brand-slate"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-slate text-xs font-black text-white shadow-sm">
            WM
          </span>
          <span className="hidden sm:block">Wellbeing Portal</span>
        </Link>

        {/* Centre tabs — desktop */}
        <div className="hidden items-center gap-1 sm:flex" role="tablist">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive(tab.href)}
              className={`
                rounded-lg px-4 py-2 text-sm font-medium transition-colors
                ${isActive(tab.href)
                  ? "bg-brand-slate text-white shadow-sm"
                  : "text-neutral-700 hover:bg-white/70 hover:text-brand-slate"
                }
              `}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Volunteer badge — shown when a volunteer session is active */}
          {volunteer && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full bg-brand-amber/20 px-3 py-1 text-xs font-semibold text-amber-800">
                🤝 {volunteer.orgName}
              </span>
              <form action="/api/volunteer/signout" method="POST" className="inline-block">
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                  onClick={() => setVolunteer(null)}
                >
                  Sign out
                </button>
              </form>
            </div>
          )}

          {/* Staff & Partners dropdown — only shown when logged in as manager/admin */}
          {!volunteer && isStaff && (
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 rounded-lg border border-white/50 bg-white/80 px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-white"
              >
                Staff &amp; Partners
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className="wm-glass absolute right-0 mt-2 w-80 rounded-xl py-1"
                  role="menu"
                >
                  {STAFF_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-neutral-700 hover:bg-white/80 hover:text-brand-slate"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-white/50" />
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Specialist Support
                  </p>
                  {SPECIALIST_SUPPORT_LINKS.map((link) => (
                    <div key={link.href} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/70">
                      <Link
                        href={link.href}
                        role="menuitem"
                        className="rounded-lg px-2 py-2 text-sm text-neutral-700 hover:text-brand-slate"
                      >
                        {link.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => copySpecialistLink(link.href)}
                        className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-600 hover:border-brand-sky/40 hover:text-brand-slate"
                        aria-label={`Copy ${link.label} link`}
                      >
                        {copiedHref === link.href ? "Copied" : "Copy link"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Volunteer portal link — shown to unauthenticated users */}
          {!volunteer && !isStaff && (
            <Link
              href="/volunteer-signin"
              className="hidden rounded-lg border border-white/50 bg-white/70 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-white hover:text-brand-slate sm:block"
            >
              Volunteer Access
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 sm:hidden"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-neutral-700" aria-hidden="true">
              {mobileOpen ? (
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              ) : (
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/40 bg-[#f2ecdf] px-4 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  rounded-lg px-4 py-2.5 text-sm font-medium transition-colors
                  ${isActive(tab.href)
                    ? "bg-brand-slate text-white"
                    : "text-neutral-700 hover:bg-white/70"
                  }
                `}
              >
                {tab.label}
              </Link>
            ))}
            {isStaff && !volunteer && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Staff &amp; Partners
                </p>
                {STAFF_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-4 py-2.5 text-sm text-neutral-700 hover:bg-white/70 hover:text-brand-slate"
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Specialist Support
                </p>
                {SPECIALIST_SUPPORT_LINKS.map((link) => (
                  <div key={link.href} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-1 py-1 hover:bg-white/40">
                    <Link
                      href={link.href}
                      className="rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:text-brand-slate"
                    >
                      {link.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => copySpecialistLink(link.href)}
                      className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-600"
                      aria-label={`Copy ${link.label} link`}
                    >
                      {copiedHref === link.href ? "Copied" : "Copy"}
                    </button>
                  </div>
                ))}
              </>
            )}
            {volunteer && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  🤝 {volunteer.orgName}
                </p>
                <Link href="/volunteer-portal" className="rounded-lg px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100">
                  Volunteer Portal
                </Link>
                <form action="/api/volunteer/signout" method="POST">
                  <button type="submit" className="w-full rounded-lg px-4 py-2.5 text-left text-sm text-neutral-500 hover:bg-white/70">
                    Sign out
                  </button>
                </form>
              </>
            )}
            {!volunteer && !isStaff && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                <Link href="/volunteer-signin" className="rounded-lg px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100">
                  Volunteer Access
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
