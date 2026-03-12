export type VerificationStatus = "pending" | "verified" | "rejected";

export type ReferralStatus = "draft" | "submitted" | "accepted" | "declined" | "completed";

export type UrgencyLevel = "routine" | "soon" | "urgent";

export type ContactMethod = "email" | "phone";

export interface Organization {
  id: string;
  name: string;
  city: string | null;
  scrapingUrl: string | null;
  specialistTags?: string[];
  supportStackSummary?: string | null;
  verificationStatus: VerificationStatus;
}

/**
 * Submitted by a caseworker via the form. Contact details are transmitted
 * directly to the receiving organisation and are NOT persisted to the database
 * (UK GDPR data minimisation, Article 5(1)(c)).
 */
export interface ReferralFormData {
  fromOrganizationId: string;
  toOrganizationId: string;
  clientInitials: string;
  contactMethod: ContactMethod;
  contactValue: string;
  referralReason: string;
  urgency: UrgencyLevel;
  /** Optional warm-handover note for the receiving worker. Never stored as contact data. */
  vibeCheckNote?: string;
  consentGiven: boolean;
}

/** Shape written to the referrals table – no client contact details stored. */
export interface ReferralRecord {
  id: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  clientReference: string;
  clientConsentGiven: boolean;
  consentRecordedAt: string;
  referralStatus: ReferralStatus;
  notes: string;
  createdAt: string;
}
