-- Migration 006: service audit history for manager edits

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

create policy "Authenticated users can view service audit logs"
  on public.service_audit_logs
  for select
  to authenticated
  using (true);
