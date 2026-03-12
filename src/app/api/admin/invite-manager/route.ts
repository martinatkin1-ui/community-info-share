import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { requireSuperAdminAccess } from "@/lib/auth/adminAccess";
import { clientIpFromHeaders, consumeRateLimit } from "@/lib/security/rateLimit";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const inviteSchema = z.object({
  organizationId: z.string().uuid(),
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    await requireSuperAdminAccess();

    const ip = clientIpFromHeaders(request.headers);
    const rl = consumeRateLimit(`admin-invite-manager:${ip}`, 40, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many invite requests. Please wait before generating more." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const parsed = inviteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid invite payload." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const payload = parsed.data;
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, metadata")
      .eq("id", payload.organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: orgError?.message ?? "Organization not found." }, { status: 404 });
    }

    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("org_claim_links").insert({
      organization_id: payload.organizationId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const inviteUrl = `${origin}/claim-org/${rawToken}`;

    const nextMetadata = {
      ...(org.metadata ?? {}),
      managerInvite: {
        generatedAt: new Date().toISOString(),
        expiresAt,
      },
    };
    await supabase
      .from("organizations")
      .update({ metadata: nextMetadata })
      .eq("id", payload.organizationId);

    return NextResponse.json({
      message: "Secure manager claim link generated.",
      inviteUrl,
      expiresAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
