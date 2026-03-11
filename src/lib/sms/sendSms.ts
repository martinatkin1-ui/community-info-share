/**
 * Sends an SMS via Twilio's REST API — no SDK dependency, keeping the
 * bundle lightweight (Low-Data Mode goal).
 *
 * UK GDPR: the phone number is used only for this transient delivery and
 * is never persisted anywhere in this codebase.
 */
export async function sendSms(to: string, body: string): Promise<void> {
  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber  = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Twilio credentials are not configured " +
        "(TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER)."
    );
  }

  // Normalise UK mobile to E.164 (+447…)
  const normalised = to.replace(/\s+/g, "").replace(/^0/, "+44");
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:  `Basic ${credentials}`,
      },
      body: new URLSearchParams({ To: normalised, From: fromNumber, Body: body }).toString(),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`SMS delivery failed (${res.status}): ${detail}`);
  }
}
