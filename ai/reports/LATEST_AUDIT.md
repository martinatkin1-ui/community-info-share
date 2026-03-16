# Full Application Audit

**Date:** 2026-03-16
**Audited by:** Multi-disciplinary AI audit team (Architect, Debugger, UX/UI, Product, QA, Security, Data/Search, Delivery Manager)
**Codebase:** community-info-share — Next.js 16.1.6 / Supabase / Tailwind / Turbopack
**Audit confidence:** HIGH (96 source files inspected, 16 migrations read, all API routes traced)

---

## 1. Executive Summary

The West Midlands Wellbeing Portal is a functional, thoughtfully designed community service/event discovery and referral platform. The codebase is well-structured with clear module boundaries, good GDPR awareness, and a compassionate UX tone appropriate for its healthcare-adjacent context.

However, the audit uncovered **critical security vulnerabilities** that must be addressed before any production use:

**Top 3 Risks:**
1. **Multiple unauthenticated endpoints** — onboarding, scraping, and SMS routes have zero auth, enabling abuse
2. **Timing-unsafe HMAC comparison** — volunteer session tokens can be forged via timing attack
3. **Overly permissive RLS policies** — any authenticated user can create/modify services for any organisation

**Top 3 Opportunities:**
1. Multi-city expansion — currently hardcoded to Wolverhampton
2. Referral status tracking — submitters have no visibility after submission
3. Guided self-referral flow — currently just mailto/phone links

---

## 2. Repository Completeness

### Present and verified
- **96 TypeScript/React source files** across app router, components, lib, and types
- **16 Supabase migrations** (init through specialist fields)
- **8 route groups**: (public), (auth), (manager), api/admin, api/events, api/organizations, api/referrals, api/scrape, api/services, api/sms, api/support, api/volunteer
- **Config**: next.config.mjs, tailwind.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs, playwright.config.ts, supabase/config.toml
- **AI memory layer**: AI_TEAM.md, tasks, playbooks, memory files
- **1 E2E smoke test**
- **Git history**: 14 commits, clean

### Missing
- **`public/` directory was empty** — favicon and static assets lost during C→D drive move (fixed during this session)
- **Font files lost during move** — resolved by switching to `next/font/google`
- **`node_modules/`** — resolved via `npm install`
- **PROJECT_MEMORY.md** — does not exist yet (created in this audit)
- **No unit tests** — only 1 E2E smoke spec
- **No CI/CD config** — no GitHub Actions or similar
- **No error reporting** — no Sentry or equivalent
- **No seed.sql** file referenced by supabase config

### Limitations to confidence
- Cannot test runtime database behavior (no local Supabase running)
- Cannot verify Supabase RLS policies at runtime
- Cannot test Twilio/Resend/Firecrawl integrations (keys not configured)
- Vercel deployment config not inspected

---

## 3. Confirmed Findings

### Architecture

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| ARCH-001 | Medium | Module boundaries are clean but no shared constants file | Category taxonomy duplicated in CategoryTags.tsx, DiscoveryFeed.tsx, ServiceDiscovery.tsx, ServiceCard.tsx | Adding a category requires 4+ file changes | Create `src/lib/constants/taxonomy.ts` |
| ARCH-002 | Low | Inconsistent error-to-status-code mapping | String matching `msg === "Unauthorized"` in 5+ routes | Fragile; message changes break status codes | Create typed error classes |
| ARCH-003 | Low | `createServerClient()` (service-role) has no guardrails | Used in 7+ handlers with no required auth context | Accidental RLS bypass possible | Wrap in builder requiring access context |
| ARCH-004 | Info | Root page (`/`) redirects to `/events` via 307 | `src/app/page.tsx` | SEO metadata on `/` is lost | Consider making `/events` the actual root |

### Publishing/Uploads

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| PUB-001 | **CRITICAL** | Onboarding endpoint has zero authentication | `api/organizations/onboarding/route.ts` — no auth check | Anyone can create unlimited orgs | Add `requireManagerAccess()` or rate-limited public access with CAPTCHA |
| PUB-002 | High | No file-size or file-type validation on logo upload | `api/organizations/onboarding/route.ts:172` | Arbitrary file upload; storage abuse | Add size limit (2MB) and MIME validation |
| PUB-003 | High | Events publish route has no Zod validation | `api/events/publish/route.ts:19` uses `as` type assertion | Malformed payloads flow to DB | Add Zod schema for publish payload |
| PUB-004 | High | `startsAtIso` never validated as parseable date | `api/events/publish/route.ts:34` | Invalid dates stored | Add `z.datetime()` or `Date.parse` check |
| PUB-005 | High | "Test Scrape" button is entirely fake | `OnboardingContext.tsx:139-148` — setTimeout, no network call | Users misled about scrape capability | Wire to real `/api/scrape/dry-run` or remove |
| PUB-006 | Medium | Server warnings silently swallowed | `OnboardingContext.tsx:212` ignores `data.warnings` | Logo bucket issues invisible to user | Display warnings in UI |
| PUB-007 | Medium | No draft persistence in 6-step wizard | OnboardingWizard has no localStorage/sessionStorage | Accidental refresh loses all data | Add draft auto-save |
| PUB-008 | Low | StepVerification shows incomplete summary | Only specialist fields; no services/bio/socials review | Users can't verify all data before submit | Show full summary |

### Referrals

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| REF-001 | **High** | `vibe_check_note` stored in DB despite UI claiming otherwise | `api/referrals/route.ts:135` inserts it; `ReferralForm:285` says "NOT stored" | GDPR compliance risk; trust violation | Either remove from INSERT or update UI messaging |
| REF-002 | High | Referral page is public but API requires auth | `(public)/referrals/page.tsx` vs `api/referrals/route.ts` auth check | Users fill form then get "Unauthorized" error | Add auth guard to page or allow anonymous referrals with CAPTCHA |
| REF-003 | Medium | No referral status tracking | No GET endpoint for referral status | Submitters have no follow-up visibility | Add GET /api/referrals with status |
| REF-004 | Medium | ReferralForm fetches unfiltered org list | `ReferralForm:44-51` — may include unverified orgs | Users see invalid targets | Filter by verification_status |
| REF-005 | Medium | No confirmation dialog before submitting PII | ReferralForm single-click submit | Accidental referral submission | Add confirmation step |
| REF-006 | Low | `request.json()` not wrapped in try/catch | `api/referrals/route.ts:62` | Malformed JSON returns raw 500 | Wrap in try/catch |

### Search/Discovery

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| SRCH-001 | **High** | City filter completely disabled on services endpoint | `api/services/route.ts:50` — `void city;` | All cities returned regardless of filter param | Fix PostgREST city filter |
| SRCH-002 | High | Hardcoded Wolverhampton everywhere | Events API:17, DiscoveryFeed:252, ServiceDiscovery:67, onboarding RPC | Platform unusable for other WM cities | Add city selector; make configurable |
| SRCH-003 | Medium | `.or()` template literal not parameterised in events route | `api/events/route.ts:47` | Filter manipulation via crafted `q` param | Use parameterised Supabase queries |
| SRCH-004 | Medium | Synonym map missing addiction/substance terms | `ServiceDiscovery.tsx:29-36` | Recovery-focused platform can't find recovery services | Add addiction, substance, alcohol, drugs synonyms |
| SRCH-005 | Medium | No pagination on any list endpoint | Events, services, organizations all return full result sets | Performance degrades with scale | Add cursor-based pagination |
| SRCH-006 | Low | No URL state sync for search filters | DiscoveryFeed doesn't write search state back to URL | Browser back/forward loses filter state | Sync search params to URL |
| SRCH-007 | Low | No search on organisations page | `(public)/organizations/page.tsx` | Users must scroll all orgs | Add search/filter |
| SRCH-008 | Low | Ranking has no location weighting | `ranking.ts` — no distance/location factor | Out-of-area orgs rank equally | Add location proximity scoring |

### UX/UI

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| UX-001 | Medium | Duplicate `<h1>` tags on home page | `ClientHero.tsx:54` + `HeroBanner.tsx:49` | Accessibility violation (WCAG 1.3.1) | Remove inner `<h1>`, use `<p>` or `<h2>` |
| UX-002 | Medium | Manager dashboard shows admin link to non-admins | `dashboard/page.tsx:16` — unconditional `/admin` link | Non-admin managers see broken link | Conditionally render based on role |
| UX-003 | Medium | `session.exp` used as milliseconds instead of seconds | `volunteer-portal/page.tsx:13` | Session expiry shows 1970 date | Multiply by 1000 |
| UX-004 | Low | No inline form validation on referral form | Errors only shown after submit attempt | Poor UX; wasted user effort | Add per-field validation |
| UX-005 | Low | `CompassionateSupportHeader` CTA is non-interactive `<p>` | Line 37 | Users try to click a non-button | Make it a `<button>` or `<a>` |
| UX-006 | Low | ErrorBoundary has no retry mechanism | Only shows "refresh and try again" text | Users must manually refresh | Add retry button |
| UX-007 | Low | No `metadata` exports on public pages | events, organizations, referrals pages | Poor SEO | Add metadata to all pages |

### Data Model

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| DATA-001 | **High** | Services RLS: INSERT/UPDATE use `with check (true)` | Migration 003 | Any authenticated user can modify any service | Scope to org owner via `created_by` check |
| DATA-002 | **High** | Receiving org has no referral visibility | Referral RLS only allows `referred_by = auth.uid()` SELECT | Target orgs can never see referrals | Add SELECT policy for `to_organization_id` |
| DATA-003 | **High** | Onboarding RPC is `SECURITY DEFINER` with no auth check | Migration 008 | Any RPC caller can create orgs | Add `IF auth.uid() IS NULL THEN RAISE` |
| DATA-004 | High | Plaintext access keys remain in DB alongside hashes | Migrations 010-011 — `key_code` not dropped, `key_hash` not backfilled | Credential exposure risk | Backfill hashes, drop `key_code` |
| DATA-005 | High | Three redundant tag arrays on organizations | `needs_tags`, `specialist_tags`, `specialist_focus` | Data consistency risk | Consolidate to one column |
| DATA-006 | Medium | `UrgencyLevel` and `ContactMethod` exist only in TS, not DB | `domain.ts` types vs referrals table | Referral urgency data silently lost | Add DB columns or document intentional omission |
| DATA-007 | Medium | `scrape_jobs.organization_id` is nullable | Migration 002 | Orphan scrape jobs possible | Make NOT NULL |
| DATA-008 | Medium | Naming inconsistency: `need_tags` vs `needs_tags` | Services vs organizations tables | Bug-prone typo difference | Standardize naming |
| DATA-009 | Low | No referral event_id index | Migration 001 | Slow FK lookups | Add index |
| DATA-010 | Low | Incomplete TS types vs DB schema | `Organization` type missing ~20 columns | Type safety gaps | Sync types with schema |

### Auth/Permissions

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| AUTH-001 | **CRITICAL** | Timing-unsafe HMAC comparison | `session.ts:86` — `sig !== expected` (string equality) | Token forgery via timing attack | Use `crypto.timingSafeEqual()` |
| AUTH-002 | **High** | Open redirect in manager sign-in | `manager-signin/page.tsx:29` — `router.push(next)` unvalidated | Phishing post-login | Validate `next` starts with `/` and not `//` |
| AUTH-003 | **High** | Manager role determined by email match alone | `managerAccess.ts:36-48` — matches `organizations.email` | Account with org's email = manager access | Add dedicated roles table |
| AUTH-004 | **High** | Super admin by env var email only, no MFA | `managerAccess.ts:22-29` | Compromised email = full platform access | Add MFA for admin actions |
| AUTH-005 | High | Claim-org auto-confirms arbitrary email | `api/claim-org/[token]/route.ts:94-102` | Attacker with link registers any email as manager | Require email verification |
| AUTH-006 | High | Claim-org has no rate limiting and race condition | No rate limit; `maybeSingle()` without row-level lock | Duplicate managers; abuse potential | Add rate limit + `WHERE claimed_at IS NULL` |
| AUTH-007 | Medium | Middleware fails open on missing env vars | `middleware.ts:45-47`, `auth.ts:53-56` | Silent auth bypass in misconfigured environments | Fail closed or log critical warning |
| AUTH-008 | Medium | `x-forwarded-for` trusted for rate limiting | `rateLimit.ts:58-62` | IP spoofable to bypass limits | Use platform-provided IP (Vercel) |
| AUTH-009 | Medium | In-memory rate limiter resets on cold start | `rateLimit.ts:6` | Ineffective in serverless | Migrate to Upstash Redis |

### Security/Compliance

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| SEC-001 | **CRITICAL** | Scrape endpoints have zero authentication | `api/scrape/route.ts`, `api/scrape/dry-run/route.ts` | DoS, cost abuse (Playwright/Firecrawl calls) | Add auth + rate limiting |
| SEC-002 | **CRITICAL** | SMS endpoint has no authentication | `api/sms/send/route.ts` | SMS pump abuse; financial cost | Add auth or CAPTCHA + real rate limiting |
| SEC-003 | High | No audit logging on critical actions | Onboarding, event publishing, admin actions — no logs | No traceability for compliance | Add structured audit logging |
| SEC-004 | High | Dev fallback secret for volunteer sessions | `session.ts:34,42` — `"dev-insecure-change-me"` | Staging/misconfigured envs use predictable secret | Fail closed in non-dev |
| SEC-005 | Medium | Origin header trusted for invite link URL | `api/admin/invite-manager/route.ts:66` | MITM could redirect claim links | Use `NEXT_PUBLIC_APP_URL` env var |
| SEC-006 | Medium | Twilio error details may leak to client | `sendSms.ts:37` | Account info in error responses | Sanitize error messages |
| SEC-007 | Medium | `notifyOrganization` silently fails without API key | `notifyOrganization.ts:118-125` | Referrals submitted but orgs never notified | Add health check / alerting |
| SEC-008 | Low | Raw Supabase auth errors shown to users | `manager-signin/page.tsx:33` | Information leakage | Show generic error messages |

### QA/Reliability

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| QA-001 | **High** | ~5% test coverage | 1 smoke spec; no auth, admin, referral, SMS, scraping tests | No regression protection | See Testing Priorities section |
| QA-002 | Medium | Playwright uses dev server for E2E | `playwright.config.ts:14` | Slow, unreliable test runs | Use production build |
| QA-003 | Medium | No error reporting service | No Sentry/equivalent | Production errors invisible | Add error reporting |
| QA-004 | Low | No CI/CD pipeline | No GitHub Actions config | No automated quality gates | Add CI with lint + type-check + test |

### Performance/Operations

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| PERF-001 | Medium | Ranking fetches 300 services per call, no cache | `ranking.ts:79` | Slow support pages at scale | Add caching layer |
| PERF-002 | Medium | Scrape health fetches ALL jobs unbounded | `api/scrape/health/route.ts:47-51` | Degrades with scrape history growth | Add LIMIT + filter |
| PERF-003 | Low | Hero image fetched with `no-store` on every mount | `ClientHero.tsx:17-29` | Unnecessary API calls | Add cache duration |
| PERF-004 | Low | Manager audit logs fetched unbounded then sliced client-side | `api/manager/services/route.ts:26,59` | Over-fetching | Use DB LIMIT |
| PERF-005 | Low | `ServiceStatusManager` recreates Supabase client every render | `ServiceStatusManager.tsx:40` | Unnecessary allocations | Memoize with `useMemo` |
| PERF-006 | Low | No caching headers on public list endpoints | Events, services, organizations routes | Fresh DB hit on every request | Add `Cache-Control` |

### Documentation/Memory

| ID | Severity | Finding | Evidence | Impact | Action |
|---|---|---|---|---|---|
| DOC-001 | Medium | PROJECT_MEMORY.md doesn't exist | File not found | No persistent context for AI sessions | Created in this audit |
| DOC-002 | Medium | ARCHITECTURE.md is assumption-heavy | All sections say "to be confirmed" | Stale assumptions mislead work | Updated in this audit |
| DOC-003 | Low | session_start playbook file has no extension | `ai/playbooks/session_start` (no .md) | File not found by tools | Rename with .md extension |

---

## 4. Assumptions / Unknowns

1. **RLS policies not runtime-tested** — findings are from reading SQL; actual enforcement depends on Supabase config
2. **Vercel deployment configuration unknown** — env vars, edge config, build settings not inspected
3. **Supabase dashboard settings unknown** — email templates, auth providers, storage bucket policies
4. **`hero-image` API implementation unclear** — route file not in main source tree; may be AI image generation
5. **Production traffic patterns unknown** — performance findings are theoretical
6. **Twilio/Resend/Firecrawl integration untested** — API keys not configured
7. **Whether `vibe_check_note` storage is intentional** — could be deliberate with incorrect UI messaging, or a bug
8. **Whether the onboarding endpoint is intentionally public** — may be designed for unauthenticated org registration

---

## 5. Priority Issues (Implementation Order)

| Priority | ID | Issue | Severity | Effort |
|---|---|---|---|---|
| 1 | AUTH-001 | Timing-unsafe HMAC comparison | CRITICAL | 5 min |
| 2 | SEC-001 | Unauthenticated scrape endpoints | CRITICAL | 15 min |
| 3 | SEC-002 | Unauthenticated SMS endpoint | CRITICAL | 15 min |
| 4 | PUB-001 | Unauthenticated onboarding endpoint | CRITICAL | 15 min |
| 5 | DATA-001 | Overly permissive services RLS | HIGH | 30 min |
| 6 | DATA-003 | Unguarded SECURITY DEFINER RPC | HIGH | 10 min |
| 7 | AUTH-002 | Open redirect in manager sign-in | HIGH | 5 min |
| 8 | REF-001 | vibe_check_note GDPR inconsistency | HIGH | 15 min |
| 9 | DATA-004 | Plaintext access keys still in DB | HIGH | 30 min |
| 10 | AUTH-005 | Claim-org auto-confirms any email | HIGH | 20 min |
| 11 | PUB-003 | Events publish has no Zod validation | HIGH | 20 min |
| 12 | SRCH-001 | City filter disabled on services | HIGH | 15 min |
| 13 | SEC-004 | Insecure dev fallback secret | HIGH | 5 min |
| 14 | REF-002 | Public referral page + auth-only API mismatch | HIGH | 15 min |
| 15 | DATA-002 | Receiving org can't see referrals | HIGH | 20 min |

---

## 6. Recommended Next Actions

1. **Fix HMAC timing vulnerability** (`session.ts:86`) — replace `!==` with `crypto.timingSafeEqual()`
2. **Add auth to scrape, SMS, and onboarding endpoints** — manager auth for scrape; CAPTCHA or auth for SMS/onboarding
3. **Fix services RLS policies** — scope INSERT/UPDATE to org owners
4. **Add auth check to onboarding RPC** — `IF auth.uid() IS NULL THEN RAISE`
5. **Fix open redirect** in manager-signin — validate `next` parameter
6. **Resolve vibe_check_note GDPR issue** — either remove from INSERT or update UI text
7. **Add Zod validation to events publish** — replace type assertion with schema
8. **Fix city filter on services endpoint** — implement proper PostgREST city filtering
9. **Backfill access key hashes and drop plaintext** — complete migration 011
10. **Add basic CI pipeline** — lint + type-check + smoke tests on push

---

## 7. Quick Wins (Low-risk, high-value, <15 min each)

1. **`session.ts:86`** — Replace `sig !== expected` with `timingSafeEqual` (5 min)
2. **`manager-signin:29`** — Validate `next` param starts with `/` and not `//` (5 min)
3. **`session.ts:34,42`** — Remove dev fallback secret; throw if missing in non-dev (5 min)
4. **`volunteer-portal:13`** — Fix `session.exp * 1000` for Date constructor (2 min)
5. **`ClientHero.tsx:54`** — Change inner `<h1>` to `<h2>` (2 min)
6. **`ServiceDiscovery:29-36`** — Add addiction/substance/alcohol/drugs synonyms (5 min)
7. **`api/referrals/route.ts:62`** — Wrap `request.json()` in try/catch (5 min)
8. **`StepVibeSocials:54`** — Add `maxLength={1200}` to bio textarea (2 min)
9. **`api/organizations/route.ts`** — Add `Cache-Control: public, max-age=60` header (2 min)
10. **`CompassionateSupportHeader:37`** — Change `<p>` CTA to `<a>` with scroll anchor (5 min)

---

## 8. Strategic Improvements (Medium-term)

1. **Dedicated roles/permissions table** — replace email-matching manager auth with proper RBAC
2. **Multi-city support** — configurable city with user location detection
3. **Referral lifecycle tracking** — add GET endpoint, status dashboard, notifications on status change
4. **Guided self-referral flow** — replace mailto links with structured form
5. **Taxonomy single source of truth** — `src/lib/constants/taxonomy.ts` shared across all components
6. **Distributed rate limiting** — Upstash Redis for serverless-safe rate limits
7. **Error reporting** — Sentry or equivalent with source maps
8. **Audit logging framework** — structured log table for all admin/manager actions
9. **Draft persistence for onboarding wizard** — sessionStorage auto-save
10. **Access key migration completion** — backfill hashes, enforce NOT NULL, drop plaintext

---

## 9. Testing Priorities

### Immediate (smoke/regression)
1. **Auth flows** — manager login, volunteer access key, claim-org link, sign-out
2. **Referral submission** — end-to-end with auth, verify DB record, verify notification attempt
3. **Events publish** — manager authenticated, valid/invalid payloads, deduplication
4. **Public endpoints** — events list, services list, organizations list, support pages

### Short-term (integration)
5. **Admin actions** — verify org, generate access key, create invite link
6. **Scrape flow** — with auth, dry-run vs production, error handling
7. **SMS rate limiting** — verify limits are enforced
8. **RLS policies** — test that non-owners cannot modify services/events

### Medium-term (comprehensive)
9. **Mobile viewport tests** — all public pages
10. **Accessibility audit** — automated axe checks on all pages
11. **Performance benchmarks** — ranking, search, list endpoints under load

---

## 10. Documentation Updates Made

### Created
- `/ai/memory/PROJECT_MEMORY.md` — comprehensive project context

### Updated
- `/ai/memory/ARCHITECTURE.md` — replaced assumptions with confirmed findings
- `/ai/memory/KNOWN_ISSUES.md` — added all discovered issues with severity, impact, and next actions
- `/ai/memory/DECISIONS.md` — added audit-driven decisions
- `/ai/reports/LATEST_AUDIT.md` — this document

### Still needed
- Rename `ai/playbooks/session_start` → `session_start.md`
- Create `ai/playbooks/session_end.md` (currently `sessions_end.md` — plural inconsistency)
- Document Supabase schema in a human-readable ERD
- Document environment variable requirements
