-- Add specialist discovery fields for client-first support routing.

alter table if exists public.organizations
  add column if not exists specialist_tags text[] not null default '{}',
  add column if not exists support_stack_summary text;

create index if not exists idx_organizations_specialist_tags
  on public.organizations using gin (specialist_tags);
