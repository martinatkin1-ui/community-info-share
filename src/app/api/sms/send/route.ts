import { z } from "zod";
import { NextResponse } from "next/server";

import { sendSms } from "@/lib/sms/sendSms";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  phone:            z.string().regex(/^[\d\s+\(\)\-]{7,20}$/, "Invalid phone number"),
  title:            z.string().min(1).max(200),
  dateText:         z.string().optional(),
  timeText:         z.string().optional().nullable(),
  locationName:     z.string().optional().nullable(),
  organizationName: z.string().optional().nullable(),
});

// ---------------------------------------------------------------------------
// In-process rate limiter (3 SMS / IP / 60 s).
// NOTE: Module-level state is per-process. In multi-instance serverless
// deployments pair this with a distributed store (e.g. Upstash Redis).
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS  = 60_000;
const MAX_PER_IP = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_PER_IP) return true;
  entry.count++;
  return false;
}

/**
 * POST /api/sms/send
 * Sends a lightweight event summary SMS to the client's phone.
 * UK GDPR: phone number is NOT stored anywhere — used only for this
 * transient delivery and never appears in any database or log.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before sending another SMS." },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 }
    );
  }

  const { phone, title, dateText, timeText, locationName, organizationName } = parsed.data;

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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "SMS failed." },
      { status: 500 }
    );
  }
}
