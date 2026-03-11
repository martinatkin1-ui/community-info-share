-- Harden volunteer access key storage.
-- Add hashed key + hint fields so plaintext key storage can be phased out.
-- Existing key_code column is retained temporarily for backward compatibility.

alter table if exists public.org_access_keys
  add column if not exists key_hash text,
  add column if not exists key_hint char(4);

create index if not exists org_access_keys_key_hash_idx
  on public.org_access_keys (key_hash);

-- Backfill only non-sensitive hint; plaintext keys remain until each org rotates.
update public.org_access_keys
set key_hint = right(key_code, 4)
where key_hint is null
  and key_code is not null;
