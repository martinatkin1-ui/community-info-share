import { createServerClient } from "@/lib/supabase/server";

export type VerificationToggle = "verified" | "pending";

/**
 * Verification toggle helper for super-admin workflows.
 * Uses service-role Supabase client and should only be called server-side.
 */
export async function updateOrganizationVerification(
  organizationId: string,
  nextStatus: VerificationToggle
): Promise<{ id: string; verificationStatus: VerificationToggle }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("organizations")
    .update({ verification_status: nextStatus })
    .eq("id", organizationId)
    .select("id, verification_status")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Verification update failed.");
  }

  // Mock welcome email dispatch for now (replace with real mailer later)
  if (nextStatus === "verified") {
    console.info(`[admin] Mock welcome email sent for organization ${data.id}`);
  }

  return {
    id: data.id,
    verificationStatus: data.verification_status as VerificationToggle,
  };
}
