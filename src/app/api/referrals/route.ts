import { NextResponse } from "next/server";

import { notifyOrganization } from "@/lib/notifications/notifyOrganization";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth";
import type { ReferralFormData } from "@/types/domain";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
// Accepts common UK phone formats including +44
const PHONE_RE = /^[\d\s\+\(\)\-]{7,20}$/;
const INITIALS_RE = /^[A-Za-z]{1,3}(\.[A-Za-z]{1,3}){0,3}\.?$/;

function validatePayload(body: Partial<ReferralFormData>): string | null {
  if (!body.fromOrganizationId || !UUID_RE.test(body.fromOrganizationId)) {
    return "fromOrganizationId must be a valid UUID.";
  }
  if (!body.toOrganizationId || !UUID_RE.test(body.toOrganizationId)) {
    return "toOrganizationId must be a valid UUID.";
  }
  if (body.fromOrganizationId === body.toOrganizationId) {
    return "From and to organisations must be different.";
  }
  if (!body.clientInitials || !INITIALS_RE.test(body.clientInitials.trim())) {
    return "clientInitials must be short initials only (e.g. J.S.).";
  }
  if (body.contactMethod !== "email" && body.contactMethod !== "phone") {
    return "contactMethod must be 'email' or 'phone'.";
  }
  const contactValue = body.contactValue?.trim() ?? "";
  if (body.contactMethod === "email" && !EMAIL_RE.test(contactValue)) {
    return "A valid email address is required.";
  }
  if (body.contactMethod === "phone" && !PHONE_RE.test(contactValue)) {
    return "A valid phone number is required.";
  }
  if (!body.referralReason || body.referralReason.trim().length < 10) {
    return "referralReason must be at least 10 characters.";
  }
  if (body.referralReason.trim().length > 1000) {
    return "referralReason must be 1000 characters or fewer.";
  }
  if (!["routine", "soon", "urgent"].includes(body.urgency ?? "")) {
    return "urgency must be 'routine', 'soon', or 'urgent'.";
  }
  if (body.consentGiven !== true) {
    return "Client consent must be explicitly given before a referral can be submitted.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// POST /api/referrals
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: Partial<ReferralFormData>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validationError = validatePayload(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Safe to assert after validation above
  const payload = body as ReferralFormData;
  const consentTimestamp = new Date().toISOString();

  const user = await getAuthenticatedUser().catch(() => null);

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use authenticated client (anon key + user session) so RLS is enforced.
  const supabase = await createAuthServerClient();

  // Sender organization must belong to the logged-in manager account.
  const { data: senderOrg, error: senderOrgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", payload.fromOrganizationId)
    .eq("email", user.email)
    .single();

  if (senderOrgError || !senderOrg) {
    return NextResponse.json(
      { error: "You can only submit referrals from organizations you manage." },
      { status: 403 }
    );
  }

  // ── 1. Fetch both organisations (name for email, notification email server-side) ──
  const { data: orgs, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, email, verification_status")
    .in("id", [payload.fromOrganizationId, payload.toOrganizationId]);

  if (orgsError) {
    return NextResponse.json({ error: "Could not verify organisations." }, { status: 500 });
  }

  const fromOrg = orgs?.find((o) => o.id === payload.fromOrganizationId);
  const toOrg = orgs?.find((o) => o.id === payload.toOrganizationId);

  if (!fromOrg || !toOrg) {
    return NextResponse.json({ error: "One or both organisations not found." }, { status: 404 });
  }
  if (toOrg.verification_status !== "verified") {
    return NextResponse.json(
      { error: "The target organisation is not verified." },
      { status: 422 }
    );
  }

  // ── 2. Persist referral record – NO client contact details stored ──
  // UK GDPR Art. 5(1)(c): data minimisation. Contact details are transmitted
  // only through the transient notification email below.
  const notes = `Urgency: ${payload.urgency}\n\nReason: ${payload.referralReason.trim()}`;

  const { data: referral, error: insertError } = await supabase
    .from("referrals")
    .insert({
      from_organization_id: payload.fromOrganizationId,
      to_organization_id: payload.toOrganizationId,
      client_reference: payload.clientInitials.trim().toUpperCase(),
      client_consent_given: true,
      consent_recorded_at: consentTimestamp,
      referral_status: "submitted",
      notes,
      vibe_check_note: payload.vibeCheckNote?.trim() || null,
      referred_by: user.id,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to record referral." }, { status: 500 });
  }

  // ── 3. Send notification to receiving organisation ──
  // Contact value never leaves this server-side scope.
  if (toOrg.email) {
    try {
      await notifyOrganization({
        referralId: referral.id,
        consentRecordedAt: consentTimestamp,
        fromOrganizationName: fromOrg.name,
        toOrganizationEmail: toOrg.email,
        toOrganizationName: toOrg.name,
        clientInitials: payload.clientInitials.trim().toUpperCase(),
        contactMethod: payload.contactMethod,
        contactValue: payload.contactValue.trim(),
        referralReason: payload.referralReason.trim(),
        urgency: payload.urgency,
        vibeCheckNote: payload.vibeCheckNote?.trim() || undefined,
      });
    } catch (notifyErr) {
      // Referral is already saved; log warning but do not fail the response.
      console.error("[referrals/route] Notification failed:", notifyErr);
    }
  } else {
    console.warn(
      `[referrals/route] Organisation ${toOrg.id} has no email address – notification skipped.`
    );
  }

  // ── 4. Return minimal confirmation – no contact details echoed ──
  return NextResponse.json(
    {
      referralId: referral.id,
      status: "submitted",
      consentRecordedAt: consentTimestamp,
      message: `Referral to ${toOrg.name} submitted. They will be notified.`,
    },
    { status: 201 }
  );
}
