# Decisions Log

| Date | Decision | Why | Impact | Status | Follow-up |
|---|---|---|---|---|---|
| 2026-03-16 | Use persistent markdown memory files under `/ai/memory` | Reduce context loss across AI sessions | Improves continuity and auditability | Active | Keep files updated after major work |
| 2026-03-16 | Use a defined multi-agent operating model | Improve depth, structure, and delivery quality | Better audits, planning, and task execution | Active | Refine agent prompts over time |
| 2026-03-16 | Write audit findings to repository files, not only chat | Preserve progress and decisions in-project | Improves durability and team visibility | Active | Maintain `/ai/reports/LATEST_AUDIT.md` |
| 2026-03-16 | Prioritise security fixes before feature work | Critical vulnerabilities found in audit (unauthenticated endpoints, timing attack, overly permissive RLS) | Blocks safe production deployment | Active | Fix KI-001 through KI-007 first |
| 2026-03-16 | Switch fonts from local files to `next/font/google` | Local .woff files lost during drive migration | Eliminates dependency on binary assets | Active | No follow-up needed |
| 2026-03-16 | Make Navbar resilient to missing Supabase config | Browser client crashes if env vars missing | Graceful degradation; non-staff view fallback | Active | Remove try/catch once env is stable |
| 2026-03-16 | Keep architecture and memory docs aligned to implementation | Prevent stale assumptions | Improves trust in AI assistance | Active | Update docs after structural changes |
| 2026-03-16 | Treat vibe_check_note storage as a GDPR issue requiring resolution | UI says "NOT stored" but code stores it | Trust violation; potential regulatory risk | Active | Either remove from INSERT or correct UI messaging |
| 2026-03-16 | Manager auth needs dedicated roles table (not email matching) | Email-based role assignment is exploitable | Strategic; requires migration planning | Planned | Design roles table + migration path |
| 2026-03-16 | Rate limiting must move to distributed store for production | In-memory rate limiter ineffective in serverless | Security; prevents abuse protection bypass | Planned | Evaluate Upstash Redis |
