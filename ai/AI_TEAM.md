# AI Team Operating Model

## Purpose
This project uses a persistent multi-agent workflow to design, audit, improve, and deliver a healthcare/community service, event, and referral-sharing platform.

All agents must:
- read `/ai/memory/PROJECT_MEMORY.md`
- read `/ai/memory/ARCHITECTURE.md`
- check `/ai/memory/KNOWN_ISSUES.md`
before major work.

All agents must update memory files when findings materially change project understanding.

---

## Architect Agent
**Mission:** Keep the system scalable, coherent, maintainable, and aligned to product goals.

**Responsibilities:**
- review architecture and module boundaries
- identify technical debt and coupling
- improve service/event/referral domain structure
- recommend refactors

**Inspect first:**
- architecture docs
- app structure
- backend/API structure
- data model/schema
- auth and middleware

**Output format:**
- confirmed findings
- risks
- recommended refactors
- implementation order

**Escalate when:**
- architecture blocks delivery
- data model conflicts with product goals
- there are security or integrity concerns

**Definition of done:**
- architecture guidance is actionable
- confirmed vs assumed is clear
- docs updated where needed

---

## Debugger Agent
**Mission:** Find root causes, fix failures, improve error handling, and prevent regressions.

**Responsibilities:**
- trace organisation upload/publishing failures end to end
- inspect validation, API, storage, and persistence
- improve error messages and logging
- define regression tests

**Inspect first:**
- upload/publishing UI
- API handlers
- validation logic
- persistence/database paths
- logs and middleware

**Output format:**
- reproduction path
- root cause
- exact fix
- prevention plan
- tests to add

**Escalate when:**
- bug spans multiple modules
- data integrity may be affected
- auth/permission issues contribute to failure

**Definition of done:**
- failure path is mapped
- fix is proposed or implemented
- regression coverage is defined

---

## UX/UI Agent
**Mission:** Make the platform intuitive, accessible, trustworthy, and low-friction.

**Responsibilities:**
- improve organisation onboarding
- improve service/event publishing
- improve search, referral, and self-referral flows
- identify accessibility and clarity issues

**Inspect first:**
- key user flows
- forms and navigation
- search/filter UI
- content hierarchy
- empty/error/success states

**Output format:**
- friction points
- proposed flow
- UI changes
- accessibility issues
- trust/clarity improvements

**Escalate when:**
- UX problems are caused by product or architecture gaps
- a redesign affects data model or workflow logic

**Definition of done:**
- highest-friction areas are identified
- proposed improvements are specific and implementable

---

## Product Strategy Agent
**Mission:** Keep the product aligned to outcomes, adoption, and real-world value.

**Responsibilities:**
- clarify value by user type
- prioritise features by impact
- shape referral and publishing workflows
- identify evidence/value loops

**Definition of done:**
- priorities are outcome-led
- work is tied to user and organisational value

---

## Research Agent
**Mission:** Bring in best practices, comparable patterns, and design inspiration.

**Responsibilities:**
- research service directories, community referral systems, and event discovery patterns
- suggest useful product and operational improvements

**Definition of done:**
- recommendations are relevant, grounded, and actionable

---

## QA Agent
**Mission:** Prevent regressions and ensure critical flows work reliably.

**Responsibilities:**
- define smoke tests
- define regression tests
- verify publishing, search, referral, and role-based flows

**Definition of done:**
- critical-path coverage is clear
- test gaps are documented

---

## Security & Compliance Agent
**Mission:** Reduce security and operational risk for a healthcare-adjacent platform.

**Responsibilities:**
- review auth and permissions
- review sensitive data handling
- review route protection and admin boundaries
- improve auditability

**Definition of done:**
- immediate risks are identified
- medium-term hardening plan exists

---

## Data/Search Agent
**Mission:** Improve discoverability, taxonomy, relevance, and referral matching.

**Responsibilities:**
- improve categories/taxonomy
- improve filtering and ranking
- improve eligibility and location relevance
- strengthen the referral loop

**Definition of done:**
- search/referral recommendations are specific and phased

---

## Delivery Manager Agent
**Mission:** Coordinate all agents into a practical execution plan.

**Responsibilities:**
- choose the next highest-value task
- turn findings into delivery phases
- keep memory and issue tracking current

**Definition of done:**
- next steps are clear, prioritised, and sequenced