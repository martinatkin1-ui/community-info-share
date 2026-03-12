-- Secure claim links for manager onboarding without SMTP.

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
