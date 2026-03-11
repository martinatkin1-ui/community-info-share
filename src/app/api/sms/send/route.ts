import { NextResponse } from "next/server";

import { sendSms } from "@/lib/sms/sendSms";

export const runtime = "nodejs";

const PHONE_RE = /^[\d\s\+\(\)\-]{7,20}$/;

/**
 * POST /api/sms/send
 * Sends a lightweight event summary SMS to the client's phone.
 * UK GDPR: phone number is NOT stored anywhere — used only for this
 * transient delivery and never appears in any database or log.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { phone, title, dateText, timeText, locationName, organizationName } = body;

  if (!phone || !PHONE_RE.test(String(phone).trim())) {
    return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Event details are required." }, { status: 400 });
  }

  const lines = [
    `📅 ${String(title).slice(0, 80)}`,
    dateText       ? `🗓 ${dateText}`        : null,
    timeText       ? `🕐 ${timeText}`        : null,
    locationName   ? `📍 ${locationName}`    : null,
    organizationName ? `🏢 ${organizationName}` : null,
    "",
    "West Midlands Wellbeing Portal",
  ].filter((l): l is string => l !== null);

  const message = lines.join("\n");

  try {
    await sendSms(String(phone).trim(), message);
    return NextResponse.json({ status: "sent" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "SMS failed." },
      { status: 500 }
    );
  }
}
