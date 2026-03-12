-- Upgrade volunteer organization access keys from 6 to 8 characters.
-- key_code is retained for legacy fallback paths; key_hash remains primary.

alter table if exists public.org_access_keys
  alter column key_code type char(8);
