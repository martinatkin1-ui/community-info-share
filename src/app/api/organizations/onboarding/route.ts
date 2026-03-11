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
  scrapingUrl: z.url(),
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

const LOGO_BUCKET = "organization-logos";

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

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const body = {
      name: String(form.get("name") ?? ""),
      orgType: String(form.get("orgType") ?? ""),
      bio: String(form.get("bio") ?? ""),
      websiteUrl: String(form.get("websiteUrl") ?? ""),
      scrapingUrl: String(form.get("scrapingUrl") ?? ""),
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
        return NextResponse.json(
          { error: `Logo upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const publicUrlInfo = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      logoStoragePath = path;
      logoPublicUrl = publicUrlInfo.data.publicUrl;
    }

    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: payload.name.trim(),
        description: payload.bio.trim(),
        website_url: payload.websiteUrl.trim(),
        scraping_url: payload.scrapingUrl.trim(),
        city: "Wolverhampton",
        verification_status: "pending",
        metadata: {
          onboarding: {
            orgType: payload.orgType,
            logoFileName: logoFile?.name ?? null,
            logoStoragePath,
            logoPublicUrl,
            socials: {
              facebook: normalizeOptional(payload.facebookHandle),
              instagram: normalizeOptional(payload.instagramHandle),
              x: normalizeOptional(payload.xHandle),
            },
            governance: {
              dataSharingAgreement: payload.dataSharingAgreement,
              warmHandoverAcknowledged: payload.warmHandoverAcknowledged,
            },
            servicesCount: services.length,
            submittedAt: new Date().toISOString(),
          },
        },
      })
      .select("id, name, verification_status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: servicesInsertError } = await supabase.from("services").insert(
      services.map((service) => ({
        organization_id: data.id,
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
        is_active: true,
      }))
    );

    if (servicesInsertError) {
      await supabase.from("organizations").delete().eq("id", data.id);
      return NextResponse.json(
        { error: `Failed to save services: ${servicesInsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizationId: data.id,
      status: data.verification_status,
      message:
        "Submitted for verification. A human admin will review your profile within 24 hours.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
