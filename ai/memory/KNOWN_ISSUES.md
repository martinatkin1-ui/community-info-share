# Known Issues

| ID | Issue | Severity | User Impact | Suspected Area | Evidence | Status | Next Action | Owner Agent |
|---|---|---|---|---|---|---|---|---|
| KI-001 | Timing-unsafe HMAC comparison enables token forgery | Critical | Volunteer sessions can be forged | `src/lib/volunteer/session.ts:86` | String `!==` instead of `timingSafeEqual` | Open | Replace with `crypto.timingSafeEqual()` | Security |
| KI-002 | Scrape endpoints have zero authentication | Critical | Anyone can trigger expensive scraping | `api/scrape/route.ts`, `api/scrape/dry-run/route.ts` | No auth check in either file | Open | Add `requireManagerAccess()` | Security |
| KI-003 | SMS endpoint has no authentication | Critical | Anonymous SMS pump abuse | `api/sms/send/route.ts` | No auth; in-memory rate limit resets on cold start | Open | Add auth or CAPTCHA + Redis rate limit | Security |
| KI-004 | Onboarding endpoint has zero authentication | Critical | Anyone can create unlimited orgs | `api/organizations/onboarding/route.ts` | No auth check | Open | Add rate limit + CAPTCHA or auth | Security |
| KI-005 | Services RLS allows any auth user to INSERT/UPDATE any service | High | Privilege escalation | Migration 003 — `with check (true)` | SQL policy text | Open | Scope to org owner | Data/Schema |
| KI-006 | Onboarding RPC is SECURITY DEFINER with no auth guard | High | Unauthenticated org creation via RPC | Migration 008 | No `auth.uid()` check | Open | Add auth guard to function | Data/Schema |
| KI-007 | Open redirect in manager sign-in page | High | Phishing after login | `manager-signin/page.tsx:29` | `router.push(next)` unvalidated | Open | Validate `next` starts with `/` not `//` | Security |
| KI-008 | vibe_check_note stored in DB despite UI saying "NOT stored" | High | GDPR compliance risk; trust violation | `api/referrals/route.ts:135` vs UI text | Code stores; UI claims otherwise | Open | Remove from INSERT or fix UI text | Debugger |
| KI-009 | Manager role determined by email match alone | High | Email account = manager access | `managerAccess.ts:36-48` | DB query on `organizations.email` | Open | Add dedicated roles/permissions table | Architect |
| KI-010 | Plaintext access keys remain in DB alongside hashes | High | Credential exposure | Migrations 010-011 | `key_code` column not dropped, `key_hash` not backfilled | Open | Backfill hashes, make NOT NULL, drop plaintext | Security |
| KI-011 | Claim-org auto-confirms arbitrary email as manager | High | Attacker with token registers any email | `api/claim-org/[token]/route.ts:94-102` | `email_confirm: true` | Open | Require email verification | Security |
| KI-012 | Events publish has no Zod validation | High | Malformed data flows to DB | `api/events/publish/route.ts:19` | `as` type assertion instead of Zod | Open | Add Zod schema | Debugger |
| KI-013 | City filter disabled on services endpoint | High | Wrong city results returned | `api/services/route.ts:50` — `void city;` | Code explicitly discards param | Open | Fix PostgREST city filter | Data/Search |
| KI-014 | Hardcoded Wolverhampton limits multi-city use | High | Platform unusable for other WM cities | Events API, DiscoveryFeed, ServiceDiscovery, onboarding RPC | Multiple hardcoded references | Open | Make city configurable | Product |
| KI-015 | Dev fallback secret for volunteer sessions | High | Predictable secret in non-dev envs | `session.ts:34,42` | `"dev-insecure-change-me"` fallback | Open | Fail closed in non-dev | Security |
| KI-016 | Receiving org has no referral visibility (RLS) | High | Target orgs can never see referrals sent to them | Migration 001 referral RLS | `referred_by = auth.uid()` only | Open | Add SELECT policy for `to_organization_id` | Data/Schema |
| KI-017 | Referral page is public but API requires auth | High | Users fill form then get "Unauthorized" | `(public)/referrals/page.tsx` vs API auth | Route group mismatch | Open | Add auth guard to page or allow anon | UX |
| KI-018 | In-memory rate limiter ineffective in serverless | Medium | Rate limits don't persist across cold starts | `rateLimit.ts:6` | Module-level Map | Open | Migrate to Upstash Redis | Architect |
| KI-019 | Three redundant tag arrays on organizations | Medium | Data consistency risk | `needs_tags`, `specialist_tags`, `specialist_focus` | Three migrations adding overlapping columns | Open | Consolidate to one column | Architect |
| KI-020 | "Test Scrape" button is entirely fake | Medium | Users misled about scrape capability | `OnboardingContext.tsx:139-148` | setTimeout mock, no network call | Open | Wire to real endpoint or remove | Debugger |
| KI-021 | ~5% test coverage | High | No regression protection | 1 smoke spec total | Only 3 happy-path tests | Open | Add auth, referral, admin test suites | QA |
| KI-022 | No error reporting service | Medium | Production errors invisible | No Sentry/equivalent found | Absence of integration | Open | Add Sentry or equivalent | QA |
| KI-023 | Middleware fails open on missing env vars | Medium | Silent auth bypass in misconfigured envs | `middleware.ts:45-47`, `auth.ts:53-56` | Fails to NextResponse.next() | Open | Fail closed or critical warning | Security |
| KI-024 | session.exp used as ms instead of seconds in volunteer portal | Medium | Session expiry shows 1970 date | `volunteer-portal/page.tsx:13` | `new Date(session.exp)` | Open | Multiply by 1000 | Debugger |
| KI-025 | Duplicate `<h1>` on home page | Low | Accessibility violation | `ClientHero.tsx:54` + `HeroBanner.tsx:49` | Two h1 tags in DOM | Open | Change to `<h2>` | UX |
| KI-026 | No CI/CD pipeline | Medium | No automated quality gates | No GitHub Actions config | Absence | Open | Add CI with lint + type-check + test | Delivery |
