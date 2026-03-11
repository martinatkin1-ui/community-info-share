# Technical Quality Roadmap — Target 85 / 100 in all pillars

> Last updated: 2026-03-11
> Audit baseline (prior to this roadmap): Architecture 68 · Referral Integrity 52 · Accessibility 70 · Scraper 57 · Deployment 62 · **Overall 62**
> Post P0 hotfixes: Architecture ~74 · Referral Integrity ~78 · Accessibility ~82 · Scraper ~74 · Deployment ~73

---

## Scoring Rubric

| Pillar | Weight | Measures |
|---|---|---|
| Architecture & Least-Privilege | 20% | Anon vs service-role client usage, duplicate code, middleware |
| Referral & Data Integrity | 20% | Input validation (Zod), auth enforcement, GDPR minimisation |
| Accessibility & UX | 20% | ARIA semantics, error boundaries, image optimisation |
| Scraper Robustness | 20% | Timeouts, failure logging, idempotent publish, retries |
| Performance & Deployment | 20% | Security headers, session middleware, rate limiting |

---

## Round 1 — Architecture & Security (+11 avg across all pillars)

| # | File | Change | Pillar impact |
|---|---|---|---|
| 1 | `src/lib/supabase/server.ts` | Add `createAnonClient()` using the anon key | Architecture +8, Deployment +4 |
| 2 | `src/app/api/events/route.ts` | Switch to `createAnonClient()` — public read, RLS enforced | Architecture +4 |
| 3 | `src/app/api/services/route.ts` | Switch to `createAnonClient()` | Architecture +4 |
| 4 | `src/app/api/organizations/route.ts` | Switch to `createAnonClient()` | Architecture +3 |
| 5 | `next.config.mjs` | Add `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` response headers | Deployment +6 |
| 6 | `src/middleware.ts` *(new)* | Supabase `updateSession` for all routes — keeps session tokens fresh | Deployment +4 |

**Expected scores after Round 1:** Architecture ~85 · Deployment ~83

---

## Round 2 — Validation & Robustness (+9 avg)

| # | File | Change | Pillar impact |
|---|---|---|---|
| 7 | `src/lib/scraping/providers/firecrawlProvider.ts` | Add `AbortSignal.timeout(30_000)` to fetch — prevents hanging routes | Scraper +6 |
| 8 | `src/app/api/sms/send/route.ts` | Module-level IP rate limiter (3 req / min per IP); Zod schema for body | Deployment +4, Integrity +3 |
| 9 | `src/app/api/scrape/dry-run/route.ts` | Add Zod schema replacing manual checks | Integrity +3 |

**Expected scores after Round 2:** Scraper ~80 · Integrity ~84 · Deployment ~87

---

## Round 3 — UX & Resilience (+5 avg)

| # | File | Change | Pillar impact |
|---|---|---|---|
| 10 | `src/components/ErrorBoundary.tsx` *(new)* | Reusable React error boundary | Accessibility +5 |
| 11 | `src/app/(public)/events/page.tsx` | Wrap `<DiscoveryFeed>` in `<ErrorBoundary>` | Accessibility +3 |
| 12 | `src/app/(public)/referrals/page.tsx` | Wrap `<ReferralForm>` in `<ErrorBoundary>` | Accessibility +2 |

**Expected scores after Round 3:** Accessibility ~87

---

## Target State (post all rounds)

| Pillar | Baseline | After P0 | After R1 | After R2 | After R3 | **Final** |
|---|---|---|---|---|---|---|
| Architecture | 68 | 74 | 85 | 85 | 85 | **85** |
| Referral Integrity | 52 | 78 | 80 | 87 | 87 | **87** |
| Accessibility | 70 | 82 | 83 | 83 | 87 | **87** |
| Scraper | 57 | 74 | 74 | 83 | 83 | **83** |
| Deployment | 62 | 73 | 83 | 87 | 87 | **87** |
| **Overall** | **62** | **76** | **81** | **85** | **86** | **86** |

---

## Future (post-85) backlog

- Replace `organizations.metadata` JSONB admin review history with a dedicated `organization_review_logs` table
- Distributed rate limiting (Upstash Redis) to replace in-process SMS limiter for multi-instance deployments
- Playwright scraper retry with exponential back-off
- `next/image` for scraped flier attachments (when flier upload is added)
- Automated Playwright / Vitest integration tests for referral and publish flows