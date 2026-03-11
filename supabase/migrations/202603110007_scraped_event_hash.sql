alter table public.events
  add column if not exists scraped_event_hash text;

create unique index if not exists events_scraped_event_hash_uidx
  on public.events (scraped_event_hash)
  where scraped_event_hash is not null;
