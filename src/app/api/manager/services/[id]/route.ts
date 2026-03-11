import { NextResponse } from "next/server";
import { z } from "zod";

import { canAccessOrganization, requireManagerAccess } from "@/lib/auth/managerAccess";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const patchSchema = z.object({
  availabilityStatus: z.enum(["open", "busy", "waitlist_closed"]),
  isActive: z.boolean().optional(),
  eligibilityBadge: z.string().optional(),
  isCrisis: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const access = await requireManagerAccess();
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid update payload." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data: existing, error: existingError } = await supabase
      .from("services")
      .select("id, organization_id, availability_status, is_active, eligibility_badge, is_crisis")
      .eq("id", context.params.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: existingError?.message ?? "Service not found." }, { status: 404 });
    }

    if (!canAccessOrganization(access, existing.organization_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextPatch = {
      availability_status: parsed.data.availabilityStatus,
      ...(parsed.data.isActive === undefined ? {} : { is_active: parsed.data.isActive }),
      ...(parsed.data.eligibilityBadge === undefined
        ? {}
        : { eligibility_badge: parsed.data.eligibilityBadge.trim() || null }),
      ...(parsed.data.isCrisis === undefined ? {} : { is_crisis: parsed.data.isCrisis }),
    };

    const { data, error } = await supabase
      .from("services")
      .update(nextPatch)
      .eq("id", context.params.id)
      .select("id, availability_status, is_active, eligibility_badge, is_crisis, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Service not found." }, { status: 500 });
    }

    const changes = {
      before: {
        availabilityStatus: existing.availability_status,
        isActive: existing.is_active,
        eligibilityBadge: existing.eligibility_badge,
        isCrisis: existing.is_crisis,
      },
      after: {
        availabilityStatus: data.availability_status,
        isActive: data.is_active,
        eligibilityBadge: data.eligibility_badge,
        isCrisis: data.is_crisis,
      },
    };

    await supabase.from("service_audit_logs").insert({
      service_id: data.id,
      actor_email: access.email,
      actor_role: access.role,
      action: "service_update",
      changes,
    });

    return NextResponse.json({
      message: "Service status updated.",
      service: {
        id: data.id,
        availabilityStatus: data.availability_status,
        isActive: data.is_active,
        eligibilityBadge: data.eligibility_badge,
        isCrisis: data.is_crisis,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      {
        status:
          err instanceof Error && err.message === "Unauthorized"
            ? 401
            : 500,
      }
    );
  }
}
