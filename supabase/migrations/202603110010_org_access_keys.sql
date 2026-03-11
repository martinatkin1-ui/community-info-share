-- Organization Access Keys for volunteer / staff portal login
-- Each org has one active 6-character alphanumeric key that expires every 90 days.
-- Keys are managed by super-admins via the admin panel and validated server-side
-- using the service-role key, so no RLS select is granted to anon.

create table if not exists public.org_access_keys (
  id          uuid        primary key default gen_random_uuid(),
  organization_id uuid    not null references public.organizations(id) on delete cascade,
  key_code    char(6)     not null,
  expires_at  timestamptz not null default (timezone('utc', now()) + interval '90 days'),
  created_at  timestamptz not null default timezone('utc', now()),
  constraint  uq_org_access_keys_org_id unique (organization_id)
);

-- Fast lookup by code during volunteer sign-in
create index if not exists org_access_keys_code_idx on public.org_access_keys (key_code);

-- RLS enabled but no public policies – server routes use service_role (bypasses RLS)
-- This prevents direct enumeration through the Supabase anon endpoint.
alter table public.org_access_keys enable row level security;
