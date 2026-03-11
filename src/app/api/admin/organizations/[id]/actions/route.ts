import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdminAccess } from "@/lib/auth/adminAccess";
import { updateOrganizationVerification } from "@/lib/admin/verification";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum(["verify", "request_changes", "fix_scraper"]),
  feedback: z.string().optional(),
  tweak: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const orgId = context.params.id;

  try {
    await requireSuperAdminAccess();
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid action payload." },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const supabase = createServerClient();

    if (payload.action === "verify") {
      const result = await updateOrganizationVerification(orgId, "verified");
      return NextResponse.json({
        status: "ok",
        message: "Organization verified. Mock welcome email sent.",
        verification: result,
      });
    }

    if (payload.action === "request_changes") {
      const feedback = (payload.feedback ?? "").trim();
      if (!feedback) {
        return NextResponse.json({ error: "Feedback is required." }, { status: 400 });
      }

      // Persist feedback in org metadata to keep an audit trail without new table.
      const { data: org, error: fetchError } = await supabase
        .from("organizations")
        .select("metadata")
        .eq("id", orgId)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      const nextMetadata = {
        ...(org?.metadata ?? {}),
        adminReview: {
          requestedChangesAt: new Date().toISOString(),
          feedback,
        },
      };

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ metadata: nextMetadata, verification_status: "pending" })
        .eq("id", orgId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        status: "ok",
        message: "Feedback recorded for organization manager.",
      });
    }

    // fix_scraper
    const tweak = (payload.tweak ?? "").trim();
    if (!tweak) {
      return NextResponse.json({ error: "Scraper tweak is required." }, { status: 400 });
    }

    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("metadata")
      .eq("id", orgId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const prevTweaks = Array.isArray(org?.metadata?.scraperTweaks)
      ? org.metadata.scraperTweaks
      : [];

    const nextMetadata = {
      ...(org?.metadata ?? {}),
      scraperTweaks: [
        ...prevTweaks,
        {
          note: tweak,
          appliedAt: new Date().toISOString(),
          by: "admin",
        },
      ],
    };

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ metadata: nextMetadata })
      .eq("id", orgId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "ok",
      message: "Scraper tweak note saved.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 }
    );
  }
}
