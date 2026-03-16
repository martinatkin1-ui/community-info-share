-- Add a news/announcements URL field to organizations for weekly scraping.

alter table if exists public.organizations
  add column if not exists news_url text;
