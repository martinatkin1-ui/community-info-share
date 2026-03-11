-- Services & Support Directory schema extension

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'referral_method'
  ) then
    create type public.referral_method as enum (
      'professional_only',
      'self_referral'
    );
  end if;
end $$;

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

create trigger trg_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

alter table public.services enable row level security;

create policy "services_public_read_active"
on public.services
for select
using (is_active = true);

create policy "services_authenticated_insert"
on public.services
for insert
to authenticated
with check (true);

create policy "services_authenticated_update"
on public.services
for update
to authenticated
using (true)
with check (true);
