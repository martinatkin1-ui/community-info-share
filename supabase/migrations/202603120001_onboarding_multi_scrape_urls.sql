create or replace function public.submit_organization_onboarding(
  p_name text,
  p_description text,
  p_website_url text,
  p_scraping_url text,
  p_scraping_urls jsonb default '[]'::jsonb,
  p_org_type text,
  p_logo_file_name text,
  p_logo_storage_path text,
  p_logo_public_url text,
  p_facebook text,
  p_instagram text,
  p_x text,
  p_data_sharing_agreement boolean,
  p_warm_handover_acknowledged boolean,
  p_services jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_scraping_urls jsonb;
begin
  v_scraping_urls := case
    when p_scraping_urls is null or jsonb_typeof(p_scraping_urls) <> 'array' then '[]'::jsonb
    else p_scraping_urls
  end;

  insert into public.organizations (
    name,
    description,
    website_url,
    scraping_url,
    city,
    verification_status,
    metadata
  )
  values (
    trim(p_name),
    trim(p_description),
    trim(p_website_url),
    trim(p_scraping_url),
    'Wolverhampton',
    'pending',
    jsonb_build_object(
      'onboarding', jsonb_build_object(
        'orgType', p_org_type,
        'logoFileName', p_logo_file_name,
        'logoStoragePath', p_logo_storage_path,
        'logoPublicUrl', p_logo_public_url,
        'scrapingUrls', v_scraping_urls,
        'socials', jsonb_build_object(
          'facebook', p_facebook,
          'instagram', p_instagram,
          'x', p_x
        ),
        'governance', jsonb_build_object(
          'dataSharingAgreement', p_data_sharing_agreement,
          'warmHandoverAcknowledged', p_warm_handover_acknowledged
        ),
        'servicesCount', coalesce(jsonb_array_length(p_services), 0),
        'submittedAt', timezone('utc', now())
      )
    )
  )
  returning id into v_org_id;

  insert into public.services (
    organization_id,
    title,
    description,
    category,
    need_tags,
    eligibility_badge,
    is_crisis,
    availability_status,
    referral_method,
    contact_email,
    contact_phone,
    is_active
  )
  select
    v_org_id,
    trim(s.title),
    trim(s.description),
    s.category,
    coalesce(s.need_tags, '{}'::text[]),
    s.eligibility_badge,
    coalesce(s.is_crisis, false),
    s.availability_status::public.service_availability_status,
    s.referral_method::public.referral_method,
    s.contact_email,
    s.contact_phone,
    true
  from jsonb_to_recordset(p_services) as s(
    title text,
    description text,
    category text,
    need_tags text[],
    eligibility_badge text,
    is_crisis boolean,
    availability_status text,
    referral_method text,
    contact_email text,
    contact_phone text
  );

  return v_org_id;
end;
$$;
