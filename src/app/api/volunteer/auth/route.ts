import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIpFromHeaders, consumeRateLimit } from "@/lib/security/rateLimit";
import { createServerClient } from "@/lib/supabase/server";
import {
  COOKIE_NAME,
  createVolunteerToken,
  hashAccessKeyCode,
  normalizeAccessKeyCode,
} from "@/lib/volunteer/session";

const schema = z.object({
  keyCode: z.string().min(1).max(20),
});

export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = consumeRateLimit(`volunteer-auth:${ip}`, 12, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Normalise: strip dashes / spaces, uppercase
  const code = normalizeAccessKeyCode(parsed.data.keyCode);
  const codeHash = hashAccessKeyCode(code);

  const supabase = createServerClient();

  type AccessKeyLookupRow = {
    id: string;
    organization_id: string;
    expires_at: string;
    key_hash?: string | null;
    key_code?: string | null;
    organizations?: unknown;
  };

  let keyRow: AccessKeyLookupRow | null = null;
  let lookupError: Error | null = null;

  const hashedLookup = await supabase
    .from("org_access_keys")
    .select("id, organization_id, expires_at, key_hash, key_code, organizations(name)")
    .or(`key_hash.eq.${codeHash},key_code.eq.${code}`)
    .maybeSingle();

  if (hashedLookup.error?.message?.includes("key_hash")) {
    const legacyLookup = await supabase
      .from("org_access_keys")
      .select("id, organization_id, expires_at, key_code, organizations(name)")
      .eq("key_code", code)
      .maybeSingle();

    if (legacyLookup.error) {
      lookupError = new Error(legacyLookup.error.message);
    } else {
      keyRow = legacyLookup.data as typeof keyRow;
    }
  } else if (hashedLookup.error) {
    lookupError = new Error(hashedLookup.error.message);
  } else {
    keyRow = hashedLookup.data as typeof keyRow;
  }

  if (lookupError) {
    return NextResponse.json({ error: "Access key lookup failed." }, { status: 500 });
  }

  if (!keyRow) {
    return NextResponse.json({ error: "Access key not recognised." }, { status: 401 });
  }

  const matchedKey = keyRow as AccessKeyLookupRow;

  if (new Date(matchedKey.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This access key has expired. Please ask your administrator to regenerate it." },
      { status: 401 }
    );
  }

  // Legacy compatibility: if old plaintext row matched, opportunistically migrate it.
  if (!matchedKey.key_hash && matchedKey.key_code === code) {
    const nextHash = hashAccessKeyCode(code);
    await supabase
      .from("org_access_keys")
      .update({ key_hash: nextHash, key_code: null, key_hint: code.slice(-4) })
      .eq("id", matchedKey.id);
  }

  const orgField = matchedKey.organizations as { name: string } | Array<{ name: string }> | null;
  const orgName = Array.isArray(orgField)
    ? (orgField[0]?.name ?? "Your Organisation")
    : (orgField?.name ?? "Your Organisation");

  const token = createVolunteerToken({
    orgId: matchedKey.organization_id,
    orgName,
    keyId: matchedKey.id,
  });
  const response = NextResponse.json({ ok: true, orgName });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
