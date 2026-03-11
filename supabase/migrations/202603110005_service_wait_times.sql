-- Migration 005: Service wait-time / availability transparency

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'service_availability_status'
  ) then
    create type public.service_availability_status as enum (
      'open',
      'busy',
      'waitlist_closed'
    );
  end if;
end $$;

alter table public.services
  add column if not exists availability_status public.service_availability_status not null default 'open';

create index if not exists idx_services_availability_status
  on public.services (availability_status);
