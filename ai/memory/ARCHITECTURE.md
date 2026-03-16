# Architecture Memory

## Confirmed Stack
- **Framework:** Next.js 16.1.6 with App Router and Turbopack
- **Database:** Supabase (Postgres 17) with Row Level Security
- **Auth:** Supabase Auth (email/password for managers); HMAC-signed cookies for volunteers
- **Storage:** Supabase Storage (org logos in `org-logos` bucket)
- **Styling:** Tailwind CSS 3 with custom West Midlands brand palette
- **Search:** Fuse.js (client-side fuzzy) + Supabase ilike/overlaps (server-side)
- **Scraping:** Firecrawl API + Playwright (auto-fallback)
- **SMS:** Twilio REST API (no SDK)
- **Email:** Resend API
- **Date parsing:** chrono-node
- **Validation:** Zod (server-side, inconsistent client-side)
- **Deployment:** Vercel

## App Router Structure
```
src/app/
├── page.tsx                    # Redirects to /events
├── layout.tsx                  # Root layout with Navbar, footer, AccessibilityToolbar
├── globals.css                 # Global styles, glass effects, accessibility modes
├── icon.svg                    # Favicon
├── (public)/                   # Public pages (no auth required)
│   ├── events/page.tsx         # Event discovery feed
│   ├── organizations/page.tsx  # Org directory
│   ├── organizations/[id]/     # Org wraparound profile
│   ├── referrals/page.tsx      # Referral form (NOTE: API requires auth)
│   ├── support/[category]/     # Specialist support pathways
│   ├── volunteer-signin/       # Volunteer access key entry
│   └── volunteer-portal/       # Volunteer dashboard
├── (auth)/                     # Auth-related pages
│   ├── manager-signin/         # Manager email/password login
│   ├── manager-accept-invite/  # Deprecated → claim-org
│   ├── claim-org/[token]/      # New manager claim link flow
│   └── client-signin/          # Placeholder (not implemented)
├── (manager)/                  # Manager-protected pages
│   ├── dashboard/              # Manager hub
│   ├── admin/                  # Super admin dashboard
│   ├── onboarding/             # Org registration wizard
│   ├── service-status/         # Service CRUD manager
│   ├── scrape-health/          # Scraper monitoring
│   └── scrape-dry-run/         # Scrape preview + publish
└── api/                        # API routes
    ├── admin/                  # Super admin APIs (dashboard, access-keys, invite, org actions)
    ├── events/                 # Events list + publish
    ├── organizations/          # Org list + onboarding + wraparound
    ├── referrals/              # Referral submission
    ├── scrape/                 # Scrape trigger + dry-run + health
    ├── services/               # Public services list
    ├── manager/services/       # Manager service CRUD
    ├── sms/send/               # SMS sending
    ├── support/[category]/     # Support pathway ranking
    ├── volunteer/              # Volunteer auth, session, signout
    ├── claim-org/[token]/      # Claim link validation + account creation
    └── hero-image/             # Dynamic hero background
```

## Component Architecture
```
src/components/
├── Navbar.tsx                  # Global nav with auth-aware menu (client component)
├── AccessibilityToolbar.tsx    # Reading mask, simplified mode, font controls
├── ErrorBoundary.tsx           # React error boundary
├── HeroBanner.tsx              # Reusable hero with image + gradient
├── ClientHero.tsx              # Home page hero with search
├── ClientDashboard/            # Public discovery UI
│   ├── DiscoveryFeed.tsx       # Events feed with search, categories, low-data mode
│   ├── ServiceDiscovery.tsx    # Services feed with Fuse.js, synonyms, need filters
│   ├── SearchBar.tsx           # Search input with keyboard shortcut
│   ├── ServiceCard.tsx         # Service card with eligibility, CTA, referral link
│   ├── BaseDiscoveryCard.tsx   # Shared card shell (image, low-data)
│   ├── CategoryTags.tsx        # Category filter pills
│   └── WMBanner.tsx            # Decorative skyline SVG
├── OnboardingWizard/           # Org registration wizard
│   ├── OnboardingWizard.tsx    # Step container with navigation
│   ├── OnboardingContext.tsx   # Form state, validation, submission
│   ├── types.ts                # Wizard-specific types
│   └── steps/                  # 6 wizard steps
├── ReferralForm/index.tsx      # Multi-step referral form with GDPR consent
├── Manager/
│   └── ServiceStatusManager.tsx # Service CRUD table
├── Admin/
│   ├── AdminDashboard.tsx      # Admin stats + verification queue
│   ├── VerificationDrawer.tsx  # Org review slide-over
│   ├── InviteManagerPanel.tsx  # Claim link generator
│   └── AccessKeyPanel.tsx      # Volunteer access key manager
└── support/
    └── CompassionateSupportHeader.tsx  # Support page hero
```

## Lib/Utility Structure
```
src/lib/
├── supabase/
│   ├── server.ts       # Service-role + read-only Supabase clients
│   ├── client.ts       # Browser singleton Supabase client
│   └── auth.ts         # Supabase SSR auth client + session refresh
├── auth/
│   ├── adminAccess.ts      # Super admin guard
│   ├── managerAccess.ts    # Manager role resolution (email-based)
│   └── managerPageGuard.ts # Server-side page redirect guard
├── security/
│   └── rateLimit.ts        # In-memory rate limiter (serverless-ineffective)
├── scraping/
│   ├── scrapeEvents.ts     # Provider orchestration with fallback
│   ├── runScrapeRoute.ts   # Shared route handler logic
│   ├── logScrapeJob.ts     # Scrape job audit logging
│   ├── dateTimeParser.ts   # chrono-node event extraction
│   └── providers/
│       ├── firecrawlProvider.ts
│       └── playwrightProvider.ts
├── admin/
│   └── verification.ts     # Org verification toggle
├── volunteer/
│   └── session.ts          # HMAC tokens, access key gen/hash/verify
├── organizations/
│   └── ranking.ts          # Support pathway ranking algorithm
├── sms/
│   └── sendSms.ts          # Twilio REST sender
└── notifications/
    └── notifyOrganization.ts # Resend email notifications
```

## Database Schema (8 tables)
- **organizations** — core entity; name, city, email, website, verification_status, specialist_focus, metadata JSONB
- **events** — scraped/published events; org FK, start/end times, city, category tags, dedup hash
- **services** — org services; category, need_tags, referral_method, availability_status, crisis flag
- **referrals** — GDPR-minimised; from/to org FKs, client_reference (not PII), consent tracking, status
- **scrape_jobs** — audit log for scraping runs; org FK, provider, status, counts
- **service_audit_logs** — change history for services; actor, action, changes JSONB
- **org_access_keys** — volunteer access credentials; hashed key, expiry, org FK
- **org_claim_links** — time-limited manager invite tokens; hashed token, expiry, claim tracking

## Auth Model
- **Super admins** — identified by email in `SUPER_ADMIN_EMAILS` env var
- **Managers** — Supabase Auth users whose email matches an `organizations.email` column
- **Volunteers** — authenticated via HMAC-signed cookie after access key validation
- **Public users** — unauthenticated; can browse events, services, orgs, support pages

## Known Architectural Weaknesses
1. Manager auth relies on email matching, not a dedicated roles table
2. Rate limiting is in-memory (ineffective in serverless)
3. Category taxonomy duplicated across 4+ files
4. No shared typed error system
5. Service-role client has no usage guardrails
6. Three overlapping tag arrays on organizations table
