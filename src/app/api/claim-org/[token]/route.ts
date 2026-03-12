import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const claimSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getClaimRow(token: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("org_claim_links")
    .select("id, organization_id, expires_at, claimed_at, organizations(name, metadata)")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const row = await getClaimRow(token);

    if (!row) {
      return NextResponse.json({ error: "Claim link not found." }, { status: 404 });
    }

    if (row.claimed_at) {
      return NextResponse.json({ error: "This link has already been used." }, { status: 410 });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "This claim link has expired." }, { status: 410 });
    }

    const orgField = row.organizations as { name?: string } | Array<{ name?: string }> | null;
    const organizationName = Array.isArray(orgField) ? (orgField[0]?.name ?? "Organization") : (orgField?.name ?? "Organization");

    return NextResponse.json({
      organizationId: row.organization_id,
      organizationName,
      expiresAt: row.expires_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const payload = claimSchema.safeParse(await request.json().catch(() => ({})));

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid claim payload." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const row = await getClaimRow(token);

    if (!row) {
      return NextResponse.json({ error: "Claim link not found." }, { status: 404 });
    }

    if (row.claimed_at) {
      return NextResponse.json({ error: "This link has already been used." }, { status: 410 });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "This claim link has expired." }, { status: 410 });
    }

    const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
      email: payload.data.email,
      password: payload.data.password,
      email_confirm: true,
      user_metadata: {
        role: "manager",
        organizationId: row.organization_id,
      },
    });

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    const claimTimestamp = new Date().toISOString();

    await supabase
      .from("org_claim_links")
      .update({ claimed_at: claimTimestamp, claimed_by_email: payload.data.email })
      .eq("id", row.id);

    const { data: orgData } = await supabase
      .from("organizations")
      .select("metadata")
      .eq("id", row.organization_id)
      .single();

    const nextMetadata = {
      ...(orgData?.metadata ?? {}),
      managerClaim: {
        claimedAt: claimTimestamp,
        claimedByEmail: payload.data.email,
      },
    };

    await supabase
      .from("organizations")
      .update({ email: payload.data.email, metadata: nextMetadata })
      .eq("id", row.organization_id);

    return NextResponse.json({
      message: "Organization claimed. You can now sign in as manager.",
      userId: createdUser.user?.id ?? null,
      next: "/manager-signin",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
