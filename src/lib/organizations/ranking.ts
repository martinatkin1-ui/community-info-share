import { createReadOnlyClient } from "@/lib/supabase/server";

export type SupportCategoryId =
  | "prison-leavers"
  | "residential-rehab-graduates"
  | "mental-health-discharge"
  | "homelessness-support"
  | "new-to-recovery";

export interface RankedOrganization {
  organizationId: string;
  organizationName: string;
  city: string | null;
  websiteUrl: string | null;
  supportStackSummary: string | null;
  specialistTags: string[];
  immediateContact: string | null;
  selfReferralUrl: string | null;
  isEmergencyProvider: boolean;
  quickCallPhone: string | null;
  score: number;
  scoreBreakdown: {
    primaryMatch: boolean;
    immediateSupport: boolean;
    selfReferralEnabled: boolean;
  };
}

const CATEGORY_ALIAS: Record<SupportCategoryId, string[]> = {
  "prison-leavers": ["prison", "release", "resettlement", "justice", "probation"],
  "residential-rehab-graduates": ["rehab", "aftercare", "recovery", "peer support"],
  "mental-health-discharge": ["mental health", "crisis", "discharge", "community mental health"],
  "homelessness-support": ["homeless", "housing", "rough sleeping", "shelter"],
  "new-to-recovery": ["recovery", "substance", "open access", "fellowship"],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function hasAnyKeyword(haystacks: string[], keywords: string[]): boolean {
  return keywords.some((keyword) => {
    const k = normalize(keyword);
    return haystacks.some((text) => normalize(text).includes(k));
  });
}

export async function getRankedOrganizations(categoryId: SupportCategoryId): Promise<RankedOrganization[]> {
  const supabase = createReadOnlyClient();
  const aliases = CATEGORY_ALIAS[categoryId] ?? [];

  const { data, error } = await supabase
    .from("services")
    .select(`
      organization_id,
      title,
      description,
      category,
      need_tags,
      is_crisis,
      availability_status,
      referral_method,
      contact_phone,
      organizations (
        id,
        name,
        city,
        website_url,
        support_stack_summary,
        specialist_tags,
        specialist_focus,
        immediate_contact,
        self_referral_url,
        is_emergency_provider,
        verification_status
      )
    `)
    .eq("is_active", true)
    .limit(300);

  if (error) {
    throw new Error(error.message);
  }

  const byOrg = new Map<string, RankedOrganization>();

  for (const row of data ?? []) {
    const orgField = row.organizations as
      | {
          id: string;
          name: string;
          city: string | null;
          website_url: string | null;
          support_stack_summary: string | null;
          specialist_tags: string[] | null;
          specialist_focus: string[] | null;
          immediate_contact: string | null;
          self_referral_url: string | null;
          is_emergency_provider: boolean | null;
          verification_status?: string;
        }
      | Array<{
          id: string;
          name: string;
          city: string | null;
          website_url: string | null;
          support_stack_summary: string | null;
          specialist_tags: string[] | null;
          specialist_focus: string[] | null;
          immediate_contact: string | null;
          self_referral_url: string | null;
          is_emergency_provider: boolean | null;
          verification_status?: string;
        }>
      | null;

    const org = Array.isArray(orgField) ? orgField[0] : orgField;
    if (!org || org.verification_status !== "verified") continue;

    const orgId = row.organization_id as string;
    const specialistTags = [
      ...(org.specialist_focus ?? []),
      ...(org.specialist_tags ?? []),
    ].map((t) => normalize(t));
    const needTags = ((row.need_tags as string[] | null) ?? []).map((t) => normalize(t));
    const textCorpus = [
      String(row.title ?? ""),
      String(row.description ?? ""),
      String(row.category ?? ""),
      String(org.support_stack_summary ?? ""),
      ...needTags,
      ...specialistTags,
    ];

    const primaryMatch = hasAnyKeyword(textCorpus, aliases);
    const immediateSupport =
      org.is_emergency_provider === true ||
      row.is_crisis === true ||
      row.availability_status === "open" ||
      needTags.some((tag) => tag.includes("walk") || tag.includes("open access"));
    const selfReferralEnabled =
      row.referral_method === "self_referral" ||
      (typeof org.self_referral_url === "string" && org.self_referral_url.trim().length > 0);

    const existing = byOrg.get(orgId) ?? {
      organizationId: orgId,
      organizationName: org.name,
      city: org.city,
      websiteUrl: org.website_url,
      supportStackSummary: org.support_stack_summary,
      specialistTags: Array.from(new Set([...(org.specialist_focus ?? []), ...(org.specialist_tags ?? [])])),
      immediateContact: org.immediate_contact,
      selfReferralUrl: org.self_referral_url,
      isEmergencyProvider: org.is_emergency_provider === true,
      quickCallPhone: (row.contact_phone as string | null) ?? org.immediate_contact,
      score: 0,
      scoreBreakdown: {
        primaryMatch: false,
        immediateSupport: false,
        selfReferralEnabled: false,
      },
    };

    existing.scoreBreakdown.primaryMatch ||= primaryMatch;
    existing.scoreBreakdown.immediateSupport ||= immediateSupport;
    existing.scoreBreakdown.selfReferralEnabled ||= selfReferralEnabled;

    existing.score =
      (existing.scoreBreakdown.primaryMatch ? 50 : 0) +
      (existing.scoreBreakdown.immediateSupport ? 30 : 0) +
      (existing.scoreBreakdown.selfReferralEnabled ? 20 : 0);

    if (!existing.quickCallPhone && typeof row.contact_phone === "string" && row.contact_phone.length > 0) {
      existing.quickCallPhone = row.contact_phone;
    }

    byOrg.set(orgId, existing);
  }

  return Array.from(byOrg.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.organizationName.localeCompare(b.organizationName);
  });
}
