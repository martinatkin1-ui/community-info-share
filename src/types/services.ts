export type ServiceReferralMethod = "professional_only" | "self_referral";
export type ServiceAvailabilityStatus = "open" | "busy" | "waitlist_closed";

export type ServiceCategory =
  | "Housing"
  | "Mental Health"
  | "Debt Advice"
  | "Advocacy"
  | "Family Support"
  | "Employment"
  | "Substance Recovery"
  | "Other";

export interface SupportService {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  category: ServiceCategory;
  needTags: string[];
  eligibilityBadge: string | null;
  isCrisis: boolean;
  availabilityStatus: ServiceAvailabilityStatus;
  referralMethod: ServiceReferralMethod;
  contactEmail: string | null;
  contactPhone: string | null;
}
