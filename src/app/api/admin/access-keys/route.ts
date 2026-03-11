import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdminAccess } from "@/lib/auth/adminAccess";
import { createServerClient } from "@/lib/supabase/server";
import { generateAccessKeyCode } from "@/lib/volunteer/session";

export const runtime = "nodejs";

/** GET /api/admin/access-keys — list all org access keys */
export async function GET() {
  try {
    await requireSuperAdminAccess();

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("org_access_keys")
      .select("id, key_code, expires_at, created_at, organization_id, organizations(name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ keys: data ?? [] });
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

    const parsed = generateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const keyCode = generateAccessKeyCode();
    const expiresAt = new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString();

    const supabase = createServerClient();
    const { data, error } = await supabase
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
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ key: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
