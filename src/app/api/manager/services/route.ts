import { NextResponse } from "next/server";

import { requireManagerAccess } from "@/lib/auth/managerAccess";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireManagerAccess();
    const supabase = createServerClient();

    let query = supabase
      .from("services")
      .select(`
        id,
        title,
        category,
        eligibility_badge,
        is_crisis,
        availability_status,
        is_active,
        updated_at,
        organization_id,
        organizations ( id, name, city ),
        service_audit_logs ( id, actor_email, actor_role, action, changes, created_at )
      `)
      .order("title", { ascending: true });

    if (access.role !== "super_admin") {
      if (access.organizationIds.length === 0) {
        return NextResponse.json({ services: [] });
      }
      query = query.in("organization_id", access.organizationIds);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

     
    const services = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      eligibilityBadge: row.eligibility_badge ?? "",
      isCrisis: row.is_crisis ?? false,
      availabilityStatus: row.availability_status ?? "open",
      isActive: row.is_active ?? true,
      updatedAt: row.updated_at,
      organizationId: row.organization_id,
      organizationName: row.organizations?.name ?? "Unknown",
      organizationCity: row.organizations?.city ?? null,
      auditHistory: (row.service_audit_logs ?? []).slice(0, 5),
    }));
     

    return NextResponse.json({ services });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: err instanceof Error && err.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
