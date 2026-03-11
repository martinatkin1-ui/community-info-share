import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import { COOKIE_NAME, createVolunteerToken } from "@/lib/volunteer/session";

const schema = z.object({
  keyCode: z.string().min(1).max(20),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Normalise: strip dashes / spaces, uppercase
  const code = parsed.data.keyCode.replace(/[\s\-]/g, "").toUpperCase().slice(0, 6);

  const supabase = createServerClient();

  const { data: keyRow, error } = await supabase
    .from("org_access_keys")
    .select("id, organization_id, expires_at, organizations(name)")
    .eq("key_code", code)
    .maybeSingle();

  if (error || !keyRow) {
    return NextResponse.json({ error: "Access key not recognised." }, { status: 401 });
  }

  if (new Date(keyRow.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This access key has expired. Please ask your administrator to regenerate it." },
      { status: 401 }
    );
  }

  const orgField = keyRow.organizations as { name: string } | Array<{ name: string }> | null;
  const orgName = Array.isArray(orgField)
    ? (orgField[0]?.name ?? "Your Organisation")
    : (orgField?.name ?? "Your Organisation");

  const token = createVolunteerToken({
    orgId: keyRow.organization_id,
    orgName,
    keyId: keyRow.id,
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
