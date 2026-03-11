import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdminAccess } from "@/lib/auth/adminAccess";
import { clientIpFromHeaders, consumeRateLimit } from "@/lib/security/rateLimit";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const inviteSchema = z.object({
  email: z.string().email(),
  organizationId: z.string().uuid().optional(),
  redirectTo: z.string().url().optional(),
});

function getInviteRedirectUrl(request: Request, redirectTo?: string) {
  if (redirectTo) {
    return redirectTo;
  }

  if (process.env.MANAGER_INVITE_REDIRECT_TO) {
    return process.env.MANAGER_INVITE_REDIRECT_TO;
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  return `${origin}/manager-signin`;
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
    const inviteRedirectUrl = getInviteRedirectUrl(request, payload.redirectTo);

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "invite",
      email: payload.email,
      options: {
        redirectTo: inviteRedirectUrl,
        data: {
          role: "manager",
          organizationId: payload.organizationId ?? null,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (payload.organizationId) {
      const { data: org, error: fetchError } = await supabase
        .from("organizations")
        .select("metadata")
        .eq("id", payload.organizationId)
        .single();

      if (!fetchError) {
        const nextMetadata = {
          ...(org?.metadata ?? {}),
          managerInvite: {
            invitedEmail: payload.email,
            invitedAt: new Date().toISOString(),
          },
        };

        await supabase
          .from("organizations")
          .update({ metadata: nextMetadata, email: payload.email })
          .eq("id", payload.organizationId);
      }
    }

    const properties = (data as { properties?: { action_link?: string } } | null)?.properties;
    const inviteUrl = properties?.action_link;
    if (!inviteUrl) {
      return NextResponse.json(
        { error: "Invite link could not be generated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Manager invite link generated.",
      inviteUrl,
      user: data?.user ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
