import { z } from "zod";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sendSms } from "@/lib/sms/sendSms";
import { consumeRateLimit, clientIpFromHeaders } from "@/lib/security/rateLimit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { COOKIE_NAME, verifyVolunteerToken } from "@/lib/volunteer/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  phone:            z.string().regex(/^\+?[\d\s\(\)\-]{7,20}$/, "Invalid phone number")
                      .refine((v) => v.replace(/\D/g, "").length >= 7, "Phone must contain at least 7 digits"),
  title:            z.string().min(1).max(200),
  dateText:         z.string().optional(),
  timeText:         z.string().optional().nullable(),
  locationName:     z.string().optional().nullable(),
  organizationName: z.string().optional().nullable(),
});

const WINDOW_MS  = 60_000;
const MAX_PER_IP = 3;

async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser().catch(() => null);
    if (user) return true;
  } catch { /* not a supabase user */ }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token && verifyVolunteerToken(token)) return true;
  } catch { /* no volunteer session */ }

  return false;
}

export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);

  const { allowed, retryAfterSec } = consumeRateLimit(`sms:${ip}`, MAX_PER_IP, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before sending another SMS." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Please sign in or use a volunteer access key before sending SMS." },
      { status: 401 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request body.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { phone, title, dateText, timeText, locationName, organizationName } = body;

  const lines: string[] = [
    `📅 ${title.slice(0, 80)}`,
    dateText         ? `🗓 ${dateText}`         : null,
    timeText         ? `🕐 ${timeText}`         : null,
    locationName     ? `📍 ${locationName}`     : null,
    organizationName ? `🏢 ${organizationName}` : null,
    "",
    "West Midlands Wellbeing Portal",
  ].filter((l): l is string => l !== null);

  const message = lines.join("\n");

  try {
    await sendSms(phone.trim(), message);
    return NextResponse.json({ status: "sent" });
  } catch {
    return NextResponse.json(
      { error: "SMS could not be sent. Please try again later." },
      { status: 500 }
    );
  }
}
