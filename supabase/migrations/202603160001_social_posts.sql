-- Social / news posts table for the unified community feed.
-- Posts can come from RSS feeds, manual manager input, or future social API integrations.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null default 'manual',
  source_url text,
  external_id text,
  title text,
  body text not null,
  image_url text,
  published_at timestamptz not null default timezone('utc', now()),
  fetched_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists social_posts_external_id_uidx
  on public.social_posts (external_id) where external_id is not null;

create index if not exists idx_social_posts_org on public.social_posts (organization_id);
create index if not exists idx_social_posts_published on public.social_posts (published_at desc);

alter table public.social_posts enable row level security;

create policy "social_posts_public_read"
  on public.social_posts for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = social_posts.organization_id
        and o.verification_status = 'verified'
    )
  );
