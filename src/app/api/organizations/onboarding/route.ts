import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const payloadSchema = z.object({
  name: z.string().min(2),
  orgType: z.enum([
    "LERO",
    "Recovery",
    "NHS",
    "Community Group",
    "Local Authority",
    "Faith Group",
    "Charity",
    "Other",
  ]),
  bio: z.string().min(30).max(1200),
  websiteUrl: z.url(),
  scrapingUrls: z.string().min(1),
  facebookHandle: z.string().optional().default(""),
  instagramHandle: z.string().optional().default(""),
  xHandle: z.string().optional().default(""),
  servicesJson: z.string(),
  dataSharingAgreement: z.literal(true),
  warmHandoverAcknowledged: z.literal(true),
});

const serviceSchema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(20),
    category: z.enum([
      "Housing",
      "Mental Health",
      "Debt Advice",
      "Advocacy",
      "Family Support",
      "Employment",
      "Substance Recovery",
      "Other",
    ]),
    needTags: z.array(z.string()).default([]),
    eligibilityBadge: z.string().nullable(),
    isCrisis: z.boolean(),
    availabilityStatus: z.enum(["open", "busy", "waitlist_closed"]),
    referralMethod: z.enum(["professional_only", "self_referral"]),
    contactEmail: z.string().nullable(),
    contactPhone: z.string().nullable(),
  })
  .refine(
    (s) => s.referralMethod === "professional_only" || !!s.contactEmail || !!s.contactPhone,
    { message: "Self-referral services must provide contact details." }
  );

const LOGO_BUCKET = process.env.ONBOARDING_LOGO_BUCKET ?? "organization-logos";

function normalizeOptional(value: string | null | undefined): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}

function asBoolean(value: FormDataEntryValue | null): boolean {
  return String(value).toLowerCase() === "true";
}

function safeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseScrapingUrls(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const body = {
      name: String(form.get("name") ?? ""),
      orgType: String(form.get("orgType") ?? ""),
      bio: String(form.get("bio") ?? ""),
      websiteUrl: String(form.get("websiteUrl") ?? ""),
      scrapingUrls: String(form.get("scrapingUrls") ?? form.get("scrapingUrl") ?? ""),
      facebookHandle: String(form.get("facebookHandle") ?? ""),
      instagramHandle: String(form.get("instagramHandle") ?? ""),
      xHandle: String(form.get("xHandle") ?? ""),
      servicesJson: String(form.get("servicesJson") ?? "[]"),
      dataSharingAgreement: asBoolean(form.get("dataSharingAgreement")),
      warmHandoverAcknowledged: asBoolean(form.get("warmHandoverAcknowledged")),
    };
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid onboarding payload." },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const scrapingUrls = parseScrapingUrls(payload.scrapingUrls);
    if (scrapingUrls.length === 0) {
      return NextResponse.json({ error: "At least one scraping URL is required." }, { status: 400 });
    }
    const invalidUrl = scrapingUrls.find((url) => !z.url().safeParse(url).success);
    if (invalidUrl) {
      return NextResponse.json({ error: `Invalid scraping URL: ${invalidUrl}` }, { status: 400 });
    }

    const primaryScrapingUrl = scrapingUrls[0];
    let servicesInput: unknown;
    try {
      servicesInput = JSON.parse(payload.servicesJson);
    } catch {
      return NextResponse.json({ error: "Invalid services payload format." }, { status: 400 });
    }

    const parsedServices = z.array(serviceSchema).safeParse(servicesInput);
    if (!parsedServices.success || parsedServices.data.length === 0) {
      return NextResponse.json(
        { error: "At least one valid core service is required." },
        { status: 400 }
      );
    }

    const services = parsedServices.data;
    const supabase = createServerClient();
    const logoFileEntry = form.get("logoFile");
    const logoFile = logoFileEntry instanceof File ? logoFileEntry : null;
    const warnings: string[] = [];

    let logoStoragePath: string | null = null;
    let logoPublicUrl: string | null = null;

    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${safeSlug(payload.name)}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(path, logoFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: logoFile.type || "application/octet-stream",
        });

      if (uploadError) {
        const isMissingBucket = /bucket\s+not\s+found/i.test(uploadError.message);
        if (isMissingBucket) {
          warnings.push(
            "Logo upload skipped because the storage bucket is not configured yet. Verification will continue without a logo."
          );
        } else {
          return NextResponse.json(
            { error: `Logo upload failed: ${uploadError.message}` },
            { status: 500 }
          );
        }
      } else {
        const publicUrlInfo = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
        logoStoragePath = path;
        logoPublicUrl = publicUrlInfo.data.publicUrl;
      }
    }

    const servicesPayload = services.map((service) => ({
      title: service.title,
      description: service.description,
      category: service.category,
      need_tags: service.needTags,
      eligibility_badge: service.eligibilityBadge,
      is_crisis: service.isCrisis,
      availability_status: service.availabilityStatus,
      referral_method: service.referralMethod,
      contact_email: service.contactEmail,
      contact_phone: service.contactPhone,
    }));

    const { data: organizationId, error } = await supabase.rpc("submit_organization_onboarding", {
      p_name: payload.name.trim(),
      p_description: payload.bio.trim(),
      p_website_url: payload.websiteUrl.trim(),
      p_scraping_url: primaryScrapingUrl,
      p_scraping_urls: scrapingUrls,
      p_org_type: payload.orgType,
      p_logo_file_name: logoFile?.name ?? null,
      p_logo_storage_path: logoStoragePath,
      p_logo_public_url: logoPublicUrl,
      p_facebook: normalizeOptional(payload.facebookHandle),
      p_instagram: normalizeOptional(payload.instagramHandle),
      p_x: normalizeOptional(payload.xHandle),
      p_data_sharing_agreement: payload.dataSharingAgreement,
      p_warm_handover_acknowledged: payload.warmHandoverAcknowledged,
      p_services: servicesPayload,
    });

    if (error || !organizationId) {
      if (logoStoragePath) {
        void supabase.storage.from(LOGO_BUCKET).remove([logoStoragePath]);
      }
      return NextResponse.json(
        { error: error?.message ?? "Failed to save onboarding record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizationId,
      status: "pending",
      message:
        "Submitted for verification. A human admin will review your profile within 24 hours.",
      warnings,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
