/**
 * Sends a secure referral notification to the receiving organisation's registered
 * email address using Resend (https://resend.com).
 *
 * UK GDPR considerations applied here:
 *  - Only the minimum data required for service coordination is included.
 *  - Client contact details are never logged or persisted — they exist only in
 *    this transient email to the receiving organisation.
 *  - The email includes a data-handling notice (UK GDPR Art. 5 & 13).
 *  - If RESEND_API_KEY is absent the function emits a warning and returns safely,
 *    preventing a hard crash in development without credentials.
 */

export interface ReferralNotificationPayload {
  referralId: string;
  consentRecordedAt: string;
  fromOrganizationName: string;
  toOrganizationEmail: string;
  toOrganizationName: string;
  clientInitials: string;
  contactMethod: "email" | "phone";
  contactValue: string;
  referralReason: string;
  urgency: string;
  /** Optional warm-handover note from the caseworker. */
  vibeCheckNote?: string;
}

/** Escape user-supplied strings before embedding in HTML to prevent XSS. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(payload: ReferralNotificationPayload): string {
  const urgencyColour: Record<string, string> = {
    routine: "#166534",
    soon: "#92400e",
    urgent: "#991b1b",
  };
  const colour = urgencyColour[payload.urgency] ?? "#374151";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Referral – West Midlands Wellbeing Portal</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827;">
  <h2 style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
    New Referral from the West Midlands Wellbeing Portal
  </h2>

  <p>A caseworker at <strong>${esc(payload.fromOrganizationName)}</strong> has submitted
  a referral to <strong>${esc(payload.toOrganizationName)}</strong>.</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0;" cellpadding="8">
    <tr style="background:#f9fafb;">
      <td style="border:1px solid #e5e7eb;font-weight:600;width:40%;">Referral ID</td>
      <td style="border:1px solid #e5e7eb;">${esc(payload.referralId)}</td>
    </tr>
    <tr>
      <td style="border:1px solid #e5e7eb;font-weight:600;">Client initials</td>
      <td style="border:1px solid #e5e7eb;">${esc(payload.clientInitials)}</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="border:1px solid #e5e7eb;font-weight:600;">Contact method</td>
      <td style="border:1px solid #e5e7eb;">${esc(payload.contactMethod)}</td>
    </tr>
    <tr>
      <td style="border:1px solid #e5e7eb;font-weight:600;">Contact detail</td>
      <td style="border:1px solid #e5e7eb;">${esc(payload.contactValue)}</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="border:1px solid #e5e7eb;font-weight:600;">Referral reason</td>
      <td style="border:1px solid #e5e7eb;">${esc(payload.referralReason)}</td>
    </tr>
    <tr>
      <td style="border:1px solid #e5e7eb;font-weight:600;">Urgency</td>
      <td style="border:1px solid #e5e7eb;color:${colour};font-weight:600;">
        ${esc(payload.urgency.charAt(0).toUpperCase() + payload.urgency.slice(1))}
      </td>
    </tr>
    ${payload.vibeCheckNote ? `
    <tr style="background:#fefce8;">
      <td style="border:1px solid #e5e7eb;font-weight:600;">💛 Warm Handover Note</td>
      <td style="border:1px solid #e5e7eb;color:#92400e;">${esc(payload.vibeCheckNote)}</td>
    </tr>` : ""}
    <tr style="background:#f9fafb;">
      <td style="border:1px solid #e5e7eb;font-weight:600;">Consent confirmed</td>
      <td style="border:1px solid #e5e7eb;">
        Yes &mdash; recorded ${esc(new Date(payload.consentRecordedAt).toLocaleString("en-GB", { timeZone: "Europe/London" }))}
      </td>
    </tr>
  </table>

  <div style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:14px;font-size:13px;color:#78350f;margin-top:24px;">
    <strong>Data handling notice (UK GDPR)</strong><br>
    This notification contains the minimum personal data required for service coordination,
    shared under documented client consent (Art. 6(1)(a) UK GDPR). Please process this
    information only for the purpose of responding to this referral and retain or delete it
    in line with your organisation&rsquo;s data retention policy. The sending caseworker
    holds a separate record of the client&rsquo;s consent.
  </div>

  <p style="font-size:12px;color:#9ca3af;margin-top:24px;">
    West Midlands Wellbeing Portal &bull; Wolverhampton &bull;
    This email was generated automatically. Do not reply to this address.
  </p>
</body>
</html>`;
}

export async function notifyOrganization(payload: ReferralNotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // In development without credentials, log a warning but do not crash.
    console.warn(
      "[notifyOrganization] RESEND_API_KEY is not set. " +
        "Referral recorded in database but notification email was NOT sent."
    );
    return;
  }

  const fromAddress =
    process.env.NOTIFICATION_FROM_EMAIL ?? "referrals@wmwellbeing.org.uk";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [payload.toOrganizationEmail],
      subject: `New referral from ${payload.fromOrganizationName} [${payload.urgency}]`,
      html: buildEmailHtml(payload),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Notification email failed (${response.status}): ${detail}`);
  }
}
