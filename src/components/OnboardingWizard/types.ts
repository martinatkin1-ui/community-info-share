import { z } from "zod";

export const ORG_TYPES = [
  "LERO",
  "Recovery",
  "NHS",
  "Community Group",
  "Local Authority",
  "Faith Group",
  "Charity",
  "Other",
] as const;

export type OrgType = (typeof ORG_TYPES)[number];

export type ServiceCategory =
  | "Housing"
  | "Mental Health"
  | "Debt Advice"
  | "Advocacy"
  | "Family Support"
  | "Employment"
  | "Substance Recovery"
  | "Other";

export type ServiceReferralMethod = "professional_only" | "self_referral";
export type ServiceAvailabilityStatus = "open" | "busy" | "waitlist_closed";

export interface CoreServiceDraft {
  title: string;
  description: string;
  category: ServiceCategory;
  needTagsInput: string;
  eligibilityBadge: string;
  isCrisis: boolean;
  availabilityStatus: ServiceAvailabilityStatus;
  referralMethod: ServiceReferralMethod;
  contactEmail: string;
  contactPhone: string;
}

export interface OnboardingFormValues {
  orgName: string;
  orgType: OrgType;
  logoFile: File | null;
  bio: string;
  facebookHandle: string;
  instagramHandle: string;
  xHandle: string;
  websiteUrl: string;
  scrapingUrl: string;
  coreServices: CoreServiceDraft[];
  dataSharingAgreement: boolean;
  warmHandoverAcknowledged: boolean;
}

export const identitySchema = z.object({
  orgName: z.string().min(2, "Organisation name is required."),
  orgType: z.enum(ORG_TYPES),
});

const optionalHandle = z
  .string()
  .trim()
  .max(50, "Handle is too long.")
  .regex(/^$|^[A-Za-z0-9_.]{1,50}$/, "Use only letters, numbers, underscores, or dots.");

export const vibeSchema = z.object({
  bio: z.string().min(30, "Bio should be at least 30 characters.").max(1200),
  facebookHandle: optionalHandle,
  instagramHandle: optionalHandle,
  xHandle: optionalHandle,
});

export const dataEngineSchema = z.object({
  websiteUrl: z.url({ message: "Enter a valid website URL (https://...)." }),
  scrapingUrl: z.url({ message: "Enter a valid events URL (https://...)." }),
});

const coreServiceSchema = z
  .object({
    title: z.string().trim().min(3, "Each service needs a clear title."),
    description: z.string().trim().min(20, "Each service needs a short description."),
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
    needTagsInput: z.string().trim().min(2, "Add at least one need tag per service."),
    eligibilityBadge: z.string().trim().optional().default(""),
    isCrisis: z.boolean(),
    availabilityStatus: z.enum(["open", "busy", "waitlist_closed"]),
    referralMethod: z.enum(["professional_only", "self_referral"]),
    contactEmail: z.string().trim().optional().default(""),
    contactPhone: z.string().trim().optional().default(""),
  })
  .refine(
    (value) =>
      value.referralMethod === "professional_only" ||
      value.contactEmail.length > 0 ||
      value.contactPhone.length > 0,
    {
      message: "Self-referral services must include an email or phone contact.",
      path: ["contactEmail"],
    }
  );

export const servicesSchema = z.object({
  coreServices: z.array(coreServiceSchema).min(1, "Add at least one core service."),
});

export const governanceSchema = z.object({
  dataSharingAgreement: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Data Sharing Agreement." }),
  }),
  warmHandoverAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "Please acknowledge the Warm Handover approach." }),
  }),
});

export const onboardingSchema = identitySchema
  .merge(vibeSchema)
  .merge(dataEngineSchema)
  .merge(servicesSchema)
  .merge(governanceSchema);

export const STEP_TITLES = [
  "Identity",
  "The Vibe & Socials",
  "The Data Engine",
  "List Your Core Services",
  "Referral Governance",
  "Verification Queue",
] as const;
