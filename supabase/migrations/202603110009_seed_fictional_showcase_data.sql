-- Migration 009: Fictional showcase data for full product walkthroughs
-- Adds 3 clearly fictional organizations with rich cross-table demo content.

-- 1) Organizations
insert into public.organizations (
  name,
  description,
  website_url,
  scraping_url,
  verification_status,
  email,
  phone,
  address_line_1,
  city,
  postcode,
  latitude,
  longitude,
  needs_tags,
  gender_focus,
  metadata
)
select
  'North Star Recovery Hub',
  'Fictional, trauma-informed recovery and practical support hub for adults rebuilding stability.',
  'https://north-star-recovery.example.org',
  'https://north-star-recovery.example.org/whats-on',
  'verified',
  'hello@north-star-recovery.example.org',
  '01902 710101',
  '12 Beacon Court',
  'Wolverhampton',
  'WV1 9AA',
  52.588500,
  -2.128100,
  array['mental-health','recovery','housing','benefits']::text[],
  array['all']::text[],
  '{"seed": true, "seedProfile": "fictional-showcase", "onboarding": {"orgType": "LERO"}}'::jsonb
where not exists (
  select 1 from public.organizations where name = 'North Star Recovery Hub'
);

insert into public.organizations (
  name,
  description,
  website_url,
  scraping_url,
  verification_status,
  email,
  phone,
  address_line_1,
  city,
  postcode,
  latitude,
  longitude,
  needs_tags,
  gender_focus,
  metadata
)
select
  'Hearthside Family Outreach',
  'Fictional, family-focused outreach team providing safeguarding-linked advocacy and parenting support.',
  'https://hearthside-outreach.example.org',
  'https://hearthside-outreach.example.org/events',
  'verified',
  'team@hearthside-outreach.example.org',
  '01902 710202',
  '88 Lumen Road',
  'Wolverhampton',
  'WV2 2HF',
  52.575300,
  -2.135600,
  array['family-support','advocacy','safeguarding','food-support']::text[],
  array['women','all']::text[],
  '{"seed": true, "seedProfile": "fictional-showcase", "onboarding": {"orgType": "VCSE"}}'::jsonb
where not exists (
  select 1 from public.organizations where name = 'Hearthside Family Outreach'
);

insert into public.organizations (
  name,
  description,
  website_url,
  scraping_url,
  verification_status,
  email,
  phone,
  address_line_1,
  city,
  postcode,
  latitude,
  longitude,
  needs_tags,
  gender_focus,
  metadata
)
select
  'Meridian Skills and Wellbeing Centre',
  'Fictional community centre blending employability, digital inclusion, and wellbeing navigation.',
  'https://meridian-skills.example.org',
  'https://meridian-skills.example.org/calendar',
  'verified',
  'contact@meridian-skills.example.org',
  '01902 710303',
  '4 Atlas Square',
  'Wolverhampton',
  'WV3 0QX',
  52.581200,
  -2.154400,
  array['employment','digital-skills','wellbeing','cost-of-living']::text[],
  array['all']::text[],
  '{"seed": true, "seedProfile": "fictional-showcase", "onboarding": {"orgType": "Community Hub"}}'::jsonb
where not exists (
  select 1 from public.organizations where name = 'Meridian Skills and Wellbeing Centre'
);

-- 2) Services
with seed_orgs as (
  select id, name
  from public.organizations
  where name in (
    'North Star Recovery Hub',
    'Hearthside Family Outreach',
    'Meridian Skills and Wellbeing Centre'
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
  availability_status,
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
  s.availability_status::public.service_availability_status,
  s.referral_method::public.referral_method,
  s.contact_email,
  s.contact_phone,
  true
from seed_orgs so
join (
  values
    (
      'North Star Recovery Hub',
      'Rapid Recovery Triage',
      'Same-day fictional triage for wellbeing crises, safety planning, and warm handovers.',
      'Mental Health',
      array['mental-health','crisis','recovery']::text[],
      '18+ Only',
      true,
      'open',
      'professional_only',
      null,
      null
    ),
    (
      'North Star Recovery Hub',
      'Stability and Housing Planning',
      'Practical planning sessions for tenancy risk, arrears pressure, and move-on options.',
      'Housing',
      array['housing','tenancy','arrears']::text[],
      null,
      false,
      'busy',
      'self_referral',
      'planning@north-star-recovery.example.org',
      '01902 710111'
    ),
    (
      'North Star Recovery Hub',
      'Benefits Rescue Appointments',
      'One-to-one income maximisation and mandatory reconsideration support.',
      'Debt Advice',
      array['benefits','debt','income']::text[],
      null,
      false,
      'open',
      'self_referral',
      'benefits@north-star-recovery.example.org',
      null
    ),
    (
      'Hearthside Family Outreach',
      'Family Advocacy and Navigation',
      'Multi-agency advocacy for parents and carers who need clear support pathways.',
      'Advocacy',
      array['advocacy','family-support','safeguarding']::text[],
      null,
      false,
      'open',
      'professional_only',
      null,
      null
    ),
    (
      'Hearthside Family Outreach',
      'Women Safety Pathway',
      'Women-only fictional support with trauma-informed staff and rapid signposting.',
      'Family Support',
      array['women','safety','family-support']::text[],
      'Women Only',
      true,
      'open',
      'self_referral',
      'safety@hearthside-outreach.example.org',
      '01902 710222'
    ),
    (
      'Hearthside Family Outreach',
      'School Attendance Stabiliser',
      'Targeted home-and-school coordination for children at risk of persistent absence.',
      'Family Support',
      array['family-support','education','early-help']::text[],
      null,
      false,
      'waitlist_closed',
      'professional_only',
      null,
      null
    ),
    (
      'Meridian Skills and Wellbeing Centre',
      'Job Readiness Studio',
      'CV labs, interview rehearsal, and confidence coaching for return-to-work journeys.',
      'Employment',
      array['employment','skills','cv']::text[],
      null,
      false,
      'open',
      'self_referral',
      'jobs@meridian-skills.example.org',
      '01902 710333'
    ),
    (
      'Meridian Skills and Wellbeing Centre',
      'Digital Access Drop-In',
      'Device setup, email basics, and online forms support for digitally excluded residents.',
      'Other',
      array['digital-skills','cost-of-living','navigation']::text[],
      null,
      false,
      'busy',
      'self_referral',
      'digital@meridian-skills.example.org',
      null
    ),
    (
      'Meridian Skills and Wellbeing Centre',
      'Community Wellbeing Navigation Desk',
      'Low-threshold signposting to local services with practical follow-up calls.',
      'Other',
      array['wellbeing','signposting','navigation']::text[],
      null,
      false,
      'open',
      'professional_only',
      null,
      null
    )
) as s(
  org_name,
  title,
  description,
  category,
  need_tags,
  eligibility_badge,
  is_crisis,
  availability_status,
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

-- 3) Events (future-dated for public feed)
with seed_orgs as (
  select id, name from public.organizations
  where name in (
    'North Star Recovery Hub',
    'Hearthside Family Outreach',
    'Meridian Skills and Wellbeing Centre'
  )
), event_rows as (
  select
    so.id as organization_id,
    e.title,
    e.description,
    e.event_type,
    (date_trunc('day', timezone('utc', now())) + e.start_offset) as start_at,
    (date_trunc('day', timezone('utc', now())) + e.end_offset) as end_at,
    e.is_recurring,
    e.location_name,
    e.location_address,
    e.city,
    e.postcode,
    e.eligibility_tags,
    e.source_url,
    e.is_scraped
  from seed_orgs so
  join (
    values
      (
        'North Star Recovery Hub',
        'Recovery Goals Workshop',
        'Fictional guided group session to build personal recovery plans and weekly routines.',
        'Workshop',
        interval '6 days 10 hours',
        interval '6 days 12 hours',
        false,
        'North Star Hub - Room 2',
        '12 Beacon Court, Wolverhampton',
        'Wolverhampton',
        'WV1 9AA',
        array['recovery','mental-health']::text[],
        'https://north-star-recovery.example.org/whats-on/recovery-goals',
        false
      ),
      (
        'North Star Recovery Hub',
        'Benefits Appeal Drop-In',
        'Fictional drop-in for residents preparing benefits reconsideration evidence.',
        'Drop-In',
        interval '11 days 13 hours',
        interval '11 days 15 hours',
        false,
        'North Star Hub - Advice Desk',
        '12 Beacon Court, Wolverhampton',
        'Wolverhampton',
        'WV1 9AA',
        array['benefits','debt']::text[],
        'https://north-star-recovery.example.org/whats-on/benefits-drop-in',
        true
      ),
      (
        'Hearthside Family Outreach',
        'Parents Advocacy Circle',
        'Fictional facilitated circle helping parents prepare for school and agency meetings.',
        'Group',
        interval '5 days 14 hours',
        interval '5 days 16 hours',
        true,
        'Hearthside Centre Hall',
        '88 Lumen Road, Wolverhampton',
        'Wolverhampton',
        'WV2 2HF',
        array['family-support','advocacy']::text[],
        'https://hearthside-outreach.example.org/events/parents-circle',
        false
      ),
      (
        'Hearthside Family Outreach',
        'Women Safety Planning Clinic',
        'Fictional appointment-based clinic for women needing immediate safety planning support.',
        'Clinic',
        interval '9 days 9 hours',
        interval '9 days 12 hours',
        false,
        'Hearthside Safeguarding Suite',
        '88 Lumen Road, Wolverhampton',
        'Wolverhampton',
        'WV2 2HF',
        array['women','safety','crisis']::text[],
        'https://hearthside-outreach.example.org/events/safety-clinic',
        true
      ),
      (
        'Meridian Skills and Wellbeing Centre',
        'CV Lab Live',
        'Fictional practical workshop where participants leave with a completed CV draft.',
        'Workshop',
        interval '4 days 10 hours',
        interval '4 days 13 hours',
        true,
        'Meridian Digital Suite',
        '4 Atlas Square, Wolverhampton',
        'Wolverhampton',
        'WV3 0QX',
        array['employment','skills']::text[],
        'https://meridian-skills.example.org/calendar/cv-lab-live',
        false
      ),
      (
        'Meridian Skills and Wellbeing Centre',
        'Digital Forms and Benefits Help',
        'Fictional support session for online forms, evidence uploads, and account setup.',
        'Drop-In',
        interval '8 days 11 hours',
        interval '8 days 14 hours',
        false,
        'Meridian Front Desk',
        '4 Atlas Square, Wolverhampton',
        'Wolverhampton',
        'WV3 0QX',
        array['digital-skills','benefits','cost-of-living']::text[],
        'https://meridian-skills.example.org/calendar/forms-help',
        true
      )
  ) as e(
    org_name,
    title,
    description,
    event_type,
    start_offset,
    end_offset,
    is_recurring,
    location_name,
    location_address,
    city,
    postcode,
    eligibility_tags,
    source_url,
    is_scraped
  ) on e.org_name = so.name
)
insert into public.events (
  organization_id,
  title,
  description,
  event_type,
  start_at,
  end_at,
  is_recurring,
  location_name,
  location_address,
  city,
  postcode,
  eligibility_tags,
  source_url,
  is_scraped
)
select
  er.organization_id,
  er.title,
  er.description,
  er.event_type,
  er.start_at,
  er.end_at,
  er.is_recurring,
  er.location_name,
  er.location_address,
  er.city,
  er.postcode,
  er.eligibility_tags,
  er.source_url,
  er.is_scraped
from event_rows er
where not exists (
  select 1
  from public.events existing
  where existing.organization_id = er.organization_id
    and lower(existing.title) = lower(er.title)
);

-- 4) Referrals spanning statuses
with orgs as (
  select id, name
  from public.organizations
  where name in (
    'North Star Recovery Hub',
    'Hearthside Family Outreach',
    'Meridian Skills and Wellbeing Centre'
  )
), links as (
  select
    from_org.id as from_organization_id,
    to_org.id as to_organization_id,
    r.client_reference,
    r.client_consent_given,
    r.consent_recorded_at,
    r.referral_status::public.referral_status as referral_status,
    r.notes,
    r.vibe_check_note
  from (
    values
      (
        'North Star Recovery Hub',
        'Hearthside Family Outreach',
        'SHOWCASE-REF-001',
        true,
        timezone('utc', now()) - interval '3 days',
        'submitted',
        'Parent requested support coordinating school and social care appointments.',
        'Warm handover requested; anxious about missing agency deadlines.'
      ),
      (
        'Hearthside Family Outreach',
        'Meridian Skills and Wellbeing Centre',
        'SHOWCASE-REF-002',
        true,
        timezone('utc', now()) - interval '7 days',
        'accepted',
        'Primary carer seeks return-to-work pathway and digital confidence support.',
        'Client motivated and stable this week; prefers morning appointments.'
      ),
      (
        'Meridian Skills and Wellbeing Centre',
        'North Star Recovery Hub',
        'SHOWCASE-REF-003',
        true,
        timezone('utc', now()) - interval '10 days',
        'completed',
        'Follow-up referral after successful budgeting course completion.',
        'Client reports improved routine and confidence, wants recovery peer support.'
      ),
      (
        'North Star Recovery Hub',
        'Meridian Skills and Wellbeing Centre',
        'SHOWCASE-REF-004',
        true,
        timezone('utc', now()) - interval '2 days',
        'declined',
        'Declined in demo to illustrate full status lifecycle in manager UI.',
        'Client changed preference and chose an alternative provision.'
      )
  ) as r(
    from_org_name,
    to_org_name,
    client_reference,
    client_consent_given,
    consent_recorded_at,
    referral_status,
    notes,
    vibe_check_note
  )
  join orgs from_org on from_org.name = r.from_org_name
  join orgs to_org on to_org.name = r.to_org_name
)
insert into public.referrals (
  from_organization_id,
  to_organization_id,
  client_reference,
  client_consent_given,
  consent_recorded_at,
  referral_status,
  notes,
  vibe_check_note,
  created_at,
  updated_at
)
select
  l.from_organization_id,
  l.to_organization_id,
  l.client_reference,
  l.client_consent_given,
  l.consent_recorded_at,
  l.referral_status,
  l.notes,
  l.vibe_check_note,
  timezone('utc', now()) - interval '2 days',
  timezone('utc', now()) - interval '1 day'
from links l
where not exists (
  select 1
  from public.referrals existing
  where existing.client_reference = l.client_reference
);

-- 5) Scrape jobs for admin dashboard health signal
with seed_orgs as (
  select id, name
  from public.organizations
  where name in (
    'North Star Recovery Hub',
    'Hearthside Family Outreach',
    'Meridian Skills and Wellbeing Centre'
  )
), jobs as (
  select
    so.id as organization_id,
    j.scraping_url,
    j.provider,
    j.status::public.scrape_job_status as status,
    j.events_found,
    j.error_message,
    j.warnings,
    timezone('utc', now()) - j.scraped_ago as scraped_at
  from seed_orgs so
  join (
    values
      (
        'North Star Recovery Hub',
        'https://north-star-recovery.example.org/whats-on',
        'firecrawl',
        'success',
        5,
        null,
        array[]::text[],
        interval '6 hours'
      ),
      (
        'Hearthside Family Outreach',
        'https://hearthside-outreach.example.org/events',
        'playwright',
        'partial',
        2,
        null,
        array['2 cards missing date metadata']::text[],
        interval '4 hours'
      ),
      (
        'Meridian Skills and Wellbeing Centre',
        'https://meridian-skills.example.org/calendar',
        'firecrawl',
        'failed',
        0,
        'Timeout while loading calendar JavaScript bundle',
        array[]::text[],
        interval '2 hours'
      )
  ) as j(
    org_name,
    scraping_url,
    provider,
    status,
    events_found,
    error_message,
    warnings,
    scraped_ago
  ) on j.org_name = so.name
)
insert into public.scrape_jobs (
  organization_id,
  scraping_url,
  provider,
  status,
  events_found,
  error_message,
  warnings,
  scraped_at
)
select
  j.organization_id,
  j.scraping_url,
  j.provider,
  j.status,
  j.events_found,
  j.error_message,
  j.warnings,
  j.scraped_at
from jobs j
where not exists (
  select 1
  from public.scrape_jobs existing
  where existing.organization_id = j.organization_id
    and existing.provider = j.provider
    and existing.status = j.status
);

-- 6) Service audit logs for manager timeline view
with target_services as (
  select s.id, o.name as organization_name, s.title
  from public.services s
  join public.organizations o on o.id = s.organization_id
  where (
    o.name = 'North Star Recovery Hub' and s.title = 'Rapid Recovery Triage'
  ) or (
    o.name = 'Hearthside Family Outreach' and s.title = 'Women Safety Pathway'
  ) or (
    o.name = 'Meridian Skills and Wellbeing Centre' and s.title = 'Job Readiness Studio'
  )
), log_rows as (
  select
    ts.id as service_id,
    l.actor_email,
    l.actor_role,
    l.action,
    l.changes
  from target_services ts
  join (
    values
      (
        'Rapid Recovery Triage',
        'martinatkin1@gmail.com',
        'super_admin',
        'status_update',
        '{"availability_status": {"from": "busy", "to": "open"}}'::jsonb
      ),
      (
        'Women Safety Pathway',
        'martinatkin1@gmail.com',
        'super_admin',
        'details_update',
        '{"eligibility_badge": {"from": null, "to": "Women Only"}}'::jsonb
      ),
      (
        'Job Readiness Studio',
        'martinatkin1@gmail.com',
        'super_admin',
        'contact_update',
        '{"contact_email": {"from": null, "to": "jobs@meridian-skills.example.org"}}'::jsonb
      )
  ) as l(service_title, actor_email, actor_role, action, changes)
    on l.service_title = ts.title
)
insert into public.service_audit_logs (
  service_id,
  actor_email,
  actor_role,
  action,
  changes
)
select
  lr.service_id,
  lr.actor_email,
  lr.actor_role,
  lr.action,
  lr.changes
from log_rows lr
where not exists (
  select 1
  from public.service_audit_logs existing
  where existing.service_id = lr.service_id
    and existing.action = lr.action
    and existing.actor_email = lr.actor_email
);
