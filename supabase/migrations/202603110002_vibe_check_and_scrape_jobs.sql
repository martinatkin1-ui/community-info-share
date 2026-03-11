-- Migration 002: Warm Handover vibe check + Scrape Job audit log
-- Run after 20260311_000001_init_portal_schema.sql

-- ── 1. Warm Handover ─────────────────────────────────────────────────────────
-- A professional caseworker note about the client's context.
-- This is a service coordination note — not client contact data.
alter table public.referrals
  add column if not exists vibe_check_note text;

-- ── 2. Scrape Job audit log ───────────────────────────────────────────────────
create type public.scrape_job_status as enum ('success', 'partial', 'failed');

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

-- Managers can read job logs; only the service role (server) can write.
alter table public.scrape_jobs enable row level security;

create policy "Authenticated users can view scrape jobs"
  on public.scrape_jobs
  for select
  to authenticated
  using (true);
