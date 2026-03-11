-- West Midlands Wellbeing Portal base schema
-- Run in Supabase SQL editor or via Supabase CLI migrations.

create extension if not exists pgcrypto;

create type public.verification_status as enum (
  'pending',
  'verified',
  'rejected'
);

create type public.referral_status as enum (
  'draft',
  'submitted',
  'accepted',
  'declined',
  'completed'
);

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

create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger trg_referrals_updated_at
before update on public.referrals
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.referrals enable row level security;

create policy "Organizations are publicly readable when verified"
on public.organizations
for select
to anon, authenticated
using (verification_status = 'verified');

create policy "Organization owners can manage their organization rows"
on public.organizations
for all
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Verified organization events are publicly readable"
on public.events
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.organizations o
    where o.id = events.organization_id
      and o.verification_status = 'verified'
  )
);

create policy "Event creators can manage their events"
on public.events
for all
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can create referrals they submit"
on public.referrals
for insert
to authenticated
with check (referred_by = auth.uid());

create policy "Referral submitters can view and update their referrals"
on public.referrals
for select
to authenticated
using (referred_by = auth.uid());

create policy "Referral submitters can update their referrals"
on public.referrals
for update
to authenticated
using (referred_by = auth.uid())
with check (referred_by = auth.uid());
