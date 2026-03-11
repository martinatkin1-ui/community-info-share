import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdminAccess } from "@/lib/auth/adminAccess";
import { clientIpFromHeaders, consumeRateLimit } from "@/lib/security/rateLimit";
import { createServerClient } from "@/lib/supabase/server";
import { generateAccessKeyCode, hashAccessKeyCode, keyHint } from "@/lib/volunteer/session";

export const runtime = "nodejs";

/** GET /api/admin/access-keys — list all org access keys */
export async function GET() {
  try {
    await requireSuperAdminAccess();

    const supabase = createServerClient();

    const modern = await supabase
      .from("org_access_keys")
      .select("id, key_hint, key_code, expires_at, created_at, organization_id, organizations(name)")
      .order("created_at", { ascending: false });

    const fallback = modern.error?.message?.includes("key_hint")
      ? await supabase
          .from("org_access_keys")
          .select("id, key_code, expires_at, created_at, organization_id, organizations(name)")
          .order("created_at", { ascending: false })
      : null;

    const data = (fallback?.data ?? modern.data) as Array<{
      id: string;
      key_hint?: string | null;
      key_code?: string | null;
      expires_at: string;
      created_at: string;
      organization_id: string;
      organizations?: unknown;
    }> | null;

    const error = fallback?.error ?? modern.error;
    if (error) throw new Error(error.message);

    const keys = (data ?? []).map((row: { id: string; key_hint?: string | null; key_code?: string | null; expires_at: string; created_at: string; organization_id: string; organizations?: unknown }) => ({
      id: row.id,
      tokenPreview: `••${(row.key_hint ?? row.key_code?.slice(-4) ?? "****").toUpperCase()}`,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      organizationId: row.organization_id,
      organizations: row.organizations ?? null,
    }));
    return NextResponse.json({ keys });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

const generateSchema = z.object({
  organizationId: z.string().uuid("organizationId must be a UUID."),
});

/** POST /api/admin/access-keys — generate (or regenerate) a key for an org */
export async function POST(request: Request) {
  try {
    await requireSuperAdminAccess();

    const ip = clientIpFromHeaders(request.headers);
    const rl = consumeRateLimit(`admin-access-key-generate:${ip}`, 30, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many key generations. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const parsed = generateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const keyCode = generateAccessKeyCode();
    const keyHash = hashAccessKeyCode(keyCode);
    const hint = keyHint(keyCode);
    const expiresAt = new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString();

    const supabase = createServerClient();

    const modernUpsert = await supabase
      .from("org_access_keys")
      .upsert(
        {
          organization_id: parsed.data.organizationId,
          key_hash: keyHash,
          key_hint: hint,
          key_code: null,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" }
      )
      .select("id, key_hint, expires_at")
      .single();

    const fallbackUpsert = modernUpsert.error?.message?.includes("key_hash")
      ? await supabase
          .from("org_access_keys")
          .upsert(
            {
              organization_id: parsed.data.organizationId,
              key_code: keyCode,
              expires_at: expiresAt,
              created_at: new Date().toISOString(),
            },
            { onConflict: "organization_id" }
          )
          .select("id, key_code, expires_at")
          .single()
      : null;

    const data = fallbackUpsert?.data ?? modernUpsert.data;
    const error = fallbackUpsert?.error ?? modernUpsert.error;

    if (error) throw new Error(error.message);
    return NextResponse.json({ key: data, rawKey: keyCode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
