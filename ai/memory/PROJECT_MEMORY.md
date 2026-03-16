# Project Memory

## Project Identity
- **Name:** West Midlands Wellbeing Portal (community-info-share)
- **Purpose:** Community service/event discovery and referral platform for the West Midlands region
- **Stack:** Next.js 16.1.6 (App Router, Turbopack), Supabase (Auth + Postgres + Storage), Tailwind CSS 3, TypeScript 5
- **Deployment:** Vercel (project: community_info_share, team: howie-atkins-projects)
- **Supabase project:** ywzargpdborkdtphzgfw
- **Repo:** https://github.com/martinatkin1-ui/community-info-share.git
- **Branch:** main (14 commits as of 2026-03-16)

## Current State (as of 2026-03-16 audit)
- **96 source files**, 16 migrations, 1 E2E test
- Core flows functional: events discovery, service discovery, org onboarding, referrals, admin dashboard, scraping
- Multiple critical security issues identified (see KNOWN_ISSUES.md)
- Hardcoded to Wolverhampton; not yet multi-city
- No production deployment confirmed
- ~5% test coverage

## User Personas
1. **Citizens/Clients** — discover services/events, self-refer
2. **Volunteers** — access portal via organisation access keys
3. **Managers** — manage organisation services, publish events, make referrals
4. **Super Admins** — verify organisations, generate access keys, create invite links, view dashboard

## Key Flows
1. **Event Discovery** — public DiscoveryFeed with search, category filters, low-data mode
2. **Service Discovery** — Fuse.js fuzzy search with synonym mapping, need-based filtering
3. **Organisation Onboarding** — 6-step wizard (identity, governance, socials, data engine, services, verification)
4. **Referral Submission** — GDPR-compliant form with consent tracking, email notification to target org
5. **Support Pathways** — ranked organisation lists by specialist category with emergency actions
6. **Scraping** — Firecrawl/Playwright providers with dry-run preview and publish workflow
7. **Admin Dashboard** — org verification queue, access key management, invite link generation

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (admin operations)
- `SUPER_ADMIN_EMAILS` — comma-separated super admin emails
- `MANAGER_INVITE_REDIRECT_TO` — redirect URL after invite acceptance
- `SCRAPER_DEFAULT_PROVIDER` — auto/firecrawl/playwright
- `FIRECRAWL_API_KEY` — Firecrawl scraping API key
- `RESEND_API_KEY` — Resend email notification API key
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — SMS config

## Session Context
- Repository moved from C: to D: drive on 2026-03-16
- `.next` cache rebuilt, `node_modules` reinstalled, fonts switched to Google Fonts
- Full audit completed 2026-03-16 — see `/ai/reports/LATEST_AUDIT.md`
