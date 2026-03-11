-- Demo seed: West Midlands organizations + core support services
-- Safe-ish idempotent pattern using NOT EXISTS checks.

-- 1) Seed demo organizations if missing
insert into public.organizations (
  name,
  description,
  website_url,
  scraping_url,
  verification_status,
  email,
  phone,
  city,
  postcode,
  metadata
)
select
  'Wolverhampton Housing Link',
  'Housing triage, tenancy sustainment, and homelessness prevention support.',
  'https://example.org/wolverhampton-housing-link',
  'https://example.org/wolverhampton-housing-link/events',
  'verified',
  'hello@housinglink.example.org',
  '01902 555100',
  'Wolverhampton',
  'WV1 1AA',
  '{"seed": true}'::jsonb
where not exists (
  select 1 from public.organizations where name = 'Wolverhampton Housing Link'
);

insert into public.organizations (
  name,
  description,
  website_url,
  scraping_url,
  verification_status,
  email,
  phone,
  city,
  postcode,
  metadata
)
select
  'Black Country Wellbeing Collective',
  'Community-led mental health and wellbeing support across the Black Country.',
  'https://example.org/black-country-wellbeing',
  'https://example.org/black-country-wellbeing/whats-on',
  'verified',
  'support@bcwellbeing.example.org',
  '01902 555200',
  'Wolverhampton',
  'WV1 2BB',
  '{"seed": true}'::jsonb
where not exists (
  select 1 from public.organizations where name = 'Black Country Wellbeing Collective'
);

insert into public.organizations (
  name,
  description,
  website_url,
  scraping_url,
  verification_status,
  email,
  phone,
  city,
  postcode,
  metadata
)
select
  'Aspire Debt & Benefits Advice',
  'Debt, benefits, and income maximisation support for local residents.',
  'https://example.org/aspire-debt-advice',
  'https://example.org/aspire-debt-advice/events',
  'verified',
  'advice@aspiredebt.example.org',
  '01902 555300',
  'Wolverhampton',
  'WV1 3CC',
  '{"seed": true}'::jsonb
where not exists (
  select 1 from public.organizations where name = 'Aspire Debt & Benefits Advice'
);

insert into public.organizations (
  name,
  description,
  website_url,
  scraping_url,
  verification_status,
  email,
  phone,
  city,
  postcode,
  metadata
)
select
  'Family First Community Hub',
  'Family support, parenting, advocacy, and crisis signposting.',
  'https://example.org/family-first-hub',
  'https://example.org/family-first-hub/events',
  'verified',
  'team@familyfirst.example.org',
  '01902 555400',
  'Wolverhampton',
  'WV1 4DD',
  '{"seed": true}'::jsonb
where not exists (
  select 1 from public.organizations where name = 'Family First Community Hub'
);

-- 2) Resolve IDs for seed orgs
with seed_orgs as (
  select id, name
  from public.organizations
  where name in (
    'Wolverhampton Housing Link',
    'Black Country Wellbeing Collective',
    'Aspire Debt & Benefits Advice',
    'Family First Community Hub'
  )
)
insert into public.services (
  organization_id,
  title,
  description,
  category,
  need_tags,
  eligibility_badge,
  is_crisis,
  referral_method,
  contact_email,
  contact_phone,
  is_active
)
select
  so.id,
  s.title,
  s.description,
  s.category,
  s.need_tags,
  s.eligibility_badge,
  s.is_crisis,
  s.referral_method::public.referral_method,
  s.contact_email,
  s.contact_phone,
  true
from seed_orgs so
join (
  values
    (
      'Wolverhampton Housing Link',
      'Housing Advice Clinic',
      'Weekly housing triage for tenancy risk, eviction notices, and emergency accommodation pathways.',
      'Housing',
      array['housing','homelessness','tenancy','rent-arrears']::text[],
      'Wolverhampton Residents Only',
      true,
      'self_referral',
      'housing@housinglink.example.org',
      '01902 555101'
    ),
    (
      'Wolverhampton Housing Link',
      'Tenancy Sustainment Support',
      'Practical support to keep tenancies stable, including landlord liaison and arrears planning.',
      'Housing',
      array['housing','tenancy','arrears']::text[],
      null,
      false,
      'professional_only',
      null,
      null
    ),
    (
      'Black Country Wellbeing Collective',
      'Mental Health Triage',
      'Rapid mental health triage and onward referral planning with same-day response windows.',
      'Mental Health',
      array['mental-health','anxiety','depression','wellbeing']::text[],
      '18+ Only',
      true,
      'professional_only',
      null,
      null
    ),
    (
      'Black Country Wellbeing Collective',
      'Peer Recovery Coaching',
      'Recovery-focused peer coaching for people rebuilding confidence and routine.',
      'Substance Recovery',
      array['recovery','substance-use','wellbeing']::text[],
      null,
      false,
      'self_referral',
      'coaching@bcwellbeing.example.org',
      '01902 555202'
    ),
    (
      'Aspire Debt & Benefits Advice',
      'Debt Advice Service',
      'Support with priority debts, budgeting plans, and creditor communication.',
      'Debt Advice',
      array['debt','money','bills','cost-of-living']::text[],
      'Wolverhampton Residents Preferred',
      false,
      'self_referral',
      'advice@aspiredebt.example.org',
      '01902 555301'
    ),
    (
      'Aspire Debt & Benefits Advice',
      'Benefits Maximisation Check',
      'Full benefits entitlement check and form completion support.',
      'Debt Advice',
      array['benefits','income','debt']::text[],
      null,
      false,
      'professional_only',
      null,
      null
    ),
    (
      'Family First Community Hub',
      'Family Advocacy Desk',
      'Advocacy support for families navigating multi-agency systems and appointments.',
      'Advocacy',
      array['advocacy','family','rights']::text[],
      null,
      false,
      'professional_only',
      null,
      null
    ),
    (
      'Family First Community Hub',
      'Women Safe Space Support',
      'Women-only support pathway with trauma-informed staff and rapid safeguarding signpost.',
      'Family Support',
      array['women','safety','family-support']::text[],
      'Women Only',
      true,
      'self_referral',
      'safe@familyfirst.example.org',
      '01902 555401'
    ),
    (
      'Family First Community Hub',
      'Employment Readiness Support',
      'CV help, confidence coaching, and interview prep for people returning to work.',
      'Employment',
      array['employment','work','skills','cv']::text[],
      null,
      false,
      'self_referral',
      'jobs@familyfirst.example.org',
      null
    ),
    (
      'Black Country Wellbeing Collective',
      'Community Wellbeing Navigation',
      'Low-threshold navigation support to connect residents into the right local service quickly.',
      'Other',
      array['navigation','wellbeing','signposting']::text[],
      null,
      false,
      'self_referral',
      'support@bcwellbeing.example.org',
      '01902 555200'
    )
) as s(
  org_name,
  title,
  description,
  category,
  need_tags,
  eligibility_badge,
  is_crisis,
  referral_method,
  contact_email,
  contact_phone
) on s.org_name = so.name
where not exists (
  select 1
  from public.services existing
  where existing.organization_id = so.id
    and lower(existing.title) = lower(s.title)
);
