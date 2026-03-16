-- ============================================================================
-- CONSOLIDATED SCHEMA: West Midlands Wellbeing Portal
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/ywzargpdborkdtphzgfw/sql)
-- Safe to run multiple times — uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ============================================================================

-- ── Migration 001: Base schema ──────────────────────────────────────────────

create extension if not exists pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    create type public.verification_status as enum ('pending', 'verified', 'rejected');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
    create type public.referral_status as enum ('draft', 'submitted', 'accepted', 'declined', 'completed');
  END IF;
END $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website_url text,
  scraping_url text,
  verification_status public.verification_status not null default 'pending',
  email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  postcode text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  needs_tags text[] not null default '{}',
  gender_focus text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  event_type text,
  start_at timestamptz not null,
  end_at timestamptz,
  is_recurring boolean not null default false,
  location_name text,
  location_address text,
  city text,
  postcode text,
  eligibility_tags text[] not null default '{}',
  source_url text,
  is_scraped boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_time_check check (end_at is null or end_at >= start_at)
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  from_organization_id uuid not null references public.organizations(id) on delete restrict,
  to_organization_id uuid not null references public.organizations(id) on delete restrict,
  event_id uuid references public.events(id) on delete set null,
  client_reference text,
  client_consent_given boolean not null default false,
  consent_recorded_at timestamptz,
  referral_status public.referral_status not null default 'draft',
  notes text,
  referred_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint referrals_org_check check (from_organization_id <> to_organization_id),
  constraint referrals_consent_check check (
    (client_consent_given = false and consent_recorded_at is null)
    or
    (client_consent_given = true and consent_recorded_at is not null)
  )
);

create index if not exists idx_organizations_verification_status on public.organizations (verification_status);
create index if not exists idx_organizations_city on public.organizations (city);
create index if not exists idx_events_org_start on public.events (organization_id, start_at);
create index if not exists idx_events_city_start on public.events (city, start_at);
create index if not exists idx_referrals_status_created on public.referrals (referral_status, created_at desc);
create index if not exists idx_referrals_from_org on public.referrals (from_organization_id);
create index if not exists idx_referrals_to_org on public.referrals (to_organization_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_organizations_updated_at') THEN
    create trigger trg_organizations_updated_at
    before update on public.organizations
    for each row execute function public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_events_updated_at') THEN
    create trigger trg_events_updated_at
    before update on public.events
    for each row execute function public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_referrals_updated_at') THEN
    create trigger trg_referrals_updated_at
    before update on public.referrals
    for each row execute function public.set_updated_at();
  END IF;
END $$;

alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.referrals enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizations are publicly readable when verified') THEN
    create policy "Organizations are publicly readable when verified"
    on public.organizations for select to anon, authenticated
    using (verification_status = 'verified');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organization owners can manage their organization rows') THEN
    create policy "Organization owners can manage their organization rows"
    on public.organizations for all to authenticated
    using (created_by = auth.uid())
    with check (created_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Verified organization events are publicly readable') THEN
    create policy "Verified organization events are publicly readable"
    on public.events for select to anon, authenticated
    using (
      exists (
        select 1 from public.organizations o
        where o.id = events.organization_id
          and o.verification_status = 'verified'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Event creators can manage their events') THEN
    create policy "Event creators can manage their events"
    on public.events for all to authenticated
    using (created_by = auth.uid())
    with check (created_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create referrals they submit') THEN
    create policy "Users can create referrals they submit"
    on public.referrals for insert to authenticated
    with check (referred_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Referral submitters can view and update their referrals') THEN
    create policy "Referral submitters can view and update their referrals"
    on public.referrals for select to authenticated
    using (referred_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Referral submitters can update their referrals') THEN
    create policy "Referral submitters can update their referrals"
    on public.referrals for update to authenticated
    using (referred_by = auth.uid())
    with check (referred_by = auth.uid());
  END IF;
END $$;

-- ── Migration 002: Warm Handover + Scrape Jobs ─────────────────────────────

alter table public.referrals
  add column if not exists vibe_check_note text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scrape_job_status') THEN
    create type public.scrape_job_status as enum ('success', 'partial', 'failed');
  END IF;
END $$;

create table if not exists public.scrape_jobs (
  id               uuid                     primary key default gen_random_uuid(),
  organization_id  uuid                     references public.organizations(id) on delete cascade,
  scraping_url     text                     not null,
  provider         text                     not null,
  status           public.scrape_job_status not null,
  events_found     integer                  not null default 0,
  error_message    text,
  warnings         text[]                   not null default '{}',
  scraped_at       timestamptz              not null default timezone('utc', now())
);

create index if not exists idx_scrape_jobs_org_scraped
  on public.scrape_jobs (organization_id, scraped_at desc);
create index if not exists idx_scrape_jobs_status_scraped
  on public.scrape_jobs (status, scraped_at desc);

alter table public.scrape_jobs enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view scrape jobs') THEN
    create policy "Authenticated users can view scrape jobs"
    on public.scrape_jobs for select to authenticated using (true);
  END IF;
END $$;

-- ── Migration 003: Services Directory ───────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_method') THEN
    create type public.referral_method as enum ('professional_only', 'self_referral');
  END IF;
END $$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  need_tags text[] not null default '{}',
  eligibility_badge text,
  is_crisis boolean not null default false,
  referral_method public.referral_method not null default 'professional_only',
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_contact_check check (
    referral_method = 'professional_only'
    or
    (contact_email is not null or contact_phone is not null)
  )
);

create index if not exists idx_services_org on public.services (organization_id);
create index if not exists idx_services_active on public.services (is_active);
create index if not exists idx_services_category on public.services (category);
create index if not exists idx_services_need_tags on public.services using gin (need_tags);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_services_updated_at') THEN
    create trigger trg_services_updated_at
    before update on public.services
    for each row execute function public.set_updated_at();
  END IF;
END $$;

alter table public.services enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'services_public_read_active') THEN
    create policy "services_public_read_active"
    on public.services for select using (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'services_authenticated_insert') THEN
    create policy "services_authenticated_insert"
    on public.services for insert to authenticated with check (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'services_authenticated_update') THEN
    create policy "services_authenticated_update"
    on public.services for update to authenticated using (true) with check (true);
  END IF;
END $$;

-- ── Migration 005: Service availability status ──────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_availability_status') THEN
    create type public.service_availability_status as enum ('open', 'busy', 'waitlist_closed');
  END IF;
END $$;

alter table public.services
  add column if not exists availability_status public.service_availability_status not null default 'open';

create index if not exists idx_services_availability_status
  on public.services (availability_status);

-- ── Migration 006: Service audit logs ───────────────────────────────────────

create table if not exists public.service_audit_logs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  actor_email text,
  actor_role text not null default 'manager',
  action text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_service_audit_logs_service_created
  on public.service_audit_logs (service_id, created_at desc);

alter table public.service_audit_logs enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view service audit logs') THEN
    create policy "Authenticated users can view service audit logs"
    on public.service_audit_logs for select to authenticated using (true);
  END IF;
END $$;

-- ── Migration 007: Scraped event hash ───────────────────────────────────────

alter table public.events
  add column if not exists scraped_event_hash text;

create unique index if not exists events_scraped_event_hash_uidx
  on public.events (scraped_event_hash)
  where scraped_event_hash is not null;

-- ── Migration 010: Organization access keys ─────────────────────────────────

create table if not exists public.org_access_keys (
  id          uuid        primary key default gen_random_uuid(),
  organization_id uuid    not null references public.organizations(id) on delete cascade,
  key_code    char(8)     not null,
  expires_at  timestamptz not null default (timezone('utc', now()) + interval '90 days'),
  created_at  timestamptz not null default timezone('utc', now()),
  constraint  uq_org_access_keys_org_id unique (organization_id)
);

create index if not exists org_access_keys_code_idx on public.org_access_keys (key_code);

alter table public.org_access_keys enable row level security;

-- ── Migration 011: Access key hashing ───────────────────────────────────────

alter table if exists public.org_access_keys
  add column if not exists key_hash text,
  add column if not exists key_hint char(4);

create index if not exists org_access_keys_key_hash_idx
  on public.org_access_keys (key_hash);

update public.org_access_keys
set key_hint = right(key_code, 4)
where key_hint is null
  and key_code is not null;

-- ── Migration 003b: Org claim links ─────────────────────────────────────────

create table if not exists public.org_claim_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_by_email text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_org_claim_links_org on public.org_claim_links (organization_id);
create index if not exists idx_org_claim_links_expires on public.org_claim_links (expires_at);

alter table public.org_claim_links enable row level security;

-- ── Migration 004b: Specialist org fields ───────────────────────────────────

alter table if exists public.organizations
  add column if not exists specialist_tags text[] not null default '{}',
  add column if not exists support_stack_summary text;

create index if not exists idx_organizations_specialist_tags
  on public.organizations using gin (specialist_tags);

-- ── Migration 005b: Specialist onboarding fields ────────────────────────────

alter table if exists public.organizations
  add column if not exists specialist_focus text[] not null default '{}',
  add column if not exists immediate_contact text,
  add column if not exists self_referral_url text,
  add column if not exists is_emergency_provider boolean not null default false;

create index if not exists idx_organizations_specialist_focus
  on public.organizations using gin (specialist_focus);

-- ── FINAL: Onboarding RPC function (latest version) ────────────────────────

create or replace function public.submit_organization_onboarding(
  p_name text,
  p_description text,
  p_website_url text,
  p_scraping_url text,
  p_scraping_urls jsonb default '[]'::jsonb,
  p_specialist_focus text[] default '{}',
  p_immediate_contact text default null,
  p_self_referral_url text default null,
  p_is_emergency_provider boolean default false,
  p_org_type text default null,
  p_logo_file_name text default null,
  p_logo_storage_path text default null,
  p_logo_public_url text default null,
  p_facebook text default null,
  p_instagram text default null,
  p_x text default null,
  p_data_sharing_agreement boolean default false,
  p_warm_handover_acknowledged boolean default false,
  p_services jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_scraping_urls jsonb;
  v_specialist_focus text[];
begin
  v_scraping_urls := case
    when p_scraping_urls is null or jsonb_typeof(p_scraping_urls) <> 'array' then '[]'::jsonb
    else p_scraping_urls
  end;

  v_specialist_focus := coalesce(p_specialist_focus, '{}'::text[]);

  insert into public.organizations (
    name,
    description,
    website_url,
    scraping_url,
    city,
    verification_status,
    specialist_focus,
    immediate_contact,
    self_referral_url,
    is_emergency_provider,
    specialist_tags,
    metadata
  )
  values (
    trim(p_name),
    trim(p_description),
    trim(p_website_url),
    trim(p_scraping_url),
    'Wolverhampton',
    'pending',
    v_specialist_focus,
    nullif(trim(coalesce(p_immediate_contact, '')), ''),
    nullif(trim(coalesce(p_self_referral_url, '')), ''),
    coalesce(p_is_emergency_provider, false),
    v_specialist_focus,
    jsonb_build_object(
      'onboarding', jsonb_build_object(
        'orgType', p_org_type,
        'logoFileName', p_logo_file_name,
        'logoStoragePath', p_logo_storage_path,
        'logoPublicUrl', p_logo_public_url,
        'scrapingUrls', v_scraping_urls,
        'specialistFocus', to_jsonb(v_specialist_focus),
        'immediateContact', nullif(trim(coalesce(p_immediate_contact, '')), ''),
        'selfReferralUrl', nullif(trim(coalesce(p_self_referral_url, '')), ''),
        'isEmergencyProvider', coalesce(p_is_emergency_provider, false),
        'socials', jsonb_build_object(
          'facebook', p_facebook,
          'instagram', p_instagram,
          'x', p_x
        ),
        'governance', jsonb_build_object(
          'dataSharingAgreement', p_data_sharing_agreement,
          'warmHandoverAcknowledged', p_warm_handover_acknowledged
        ),
        'servicesCount', coalesce(jsonb_array_length(p_services), 0),
        'submittedAt', timezone('utc', now())
      )
    )
  )
  returning id into v_org_id;

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
    v_org_id,
    trim(s.title),
    trim(s.description),
    s.category,
    coalesce(s.need_tags, '{}'::text[]),
    s.eligibility_badge,
    coalesce(s.is_crisis, false),
    s.availability_status::public.service_availability_status,
    s.referral_method::public.referral_method,
    s.contact_email,
    s.contact_phone,
    true
  from jsonb_to_recordset(p_services) as s(
    title text,
    description text,
    category text,
    need_tags text[],
    eligibility_badge text,
    is_crisis boolean,
    availability_status text,
    referral_method text,
    contact_email text,
    contact_phone text
  );

  return v_org_id;
end;
$$;

-- ── Allow service-role to bypass RLS for onboarding inserts ─────────────────
-- The onboarding RPC is SECURITY DEFINER, so it runs as the function owner.
-- No additional RLS policy is needed for inserts via this function.

-- ============================================================================
-- DONE. If this ran without errors, your schema is fully up to date.
-- ============================================================================
