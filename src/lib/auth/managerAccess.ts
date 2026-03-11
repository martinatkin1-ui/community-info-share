import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";

export type ManagerRole = "super_admin" | "manager";

export interface ManagerAccessContext {
  email: string;
  role: ManagerRole;
  organizationIds: string[];
}

function normalizeEmail(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export async function getManagerAccessContext(): Promise<ManagerAccessContext | null> {
  const user = await getAuthenticatedUser().catch(() => null);
  const email = normalizeEmail(user?.email);

  if (!email) return null;

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  const role: ManagerRole = superAdminEmails.includes(email)
    ? "super_admin"
    : "manager";

  if (role === "super_admin") {
    return { email, role, organizationIds: [] };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("email", email);

  if (error) {
    throw new Error(error.message);
  }

  return {
    email,
    role,
    organizationIds: (data ?? []).map((row: { id: string }) => row.id),
  };
}

export async function requireManagerAccess(): Promise<ManagerAccessContext> {
  const access = await getManagerAccessContext();
  if (!access) {
    throw new Error("Unauthorized");
  }
  return access;
}

export function canAccessOrganization(access: ManagerAccessContext, organizationId: string): boolean {
  return access.role === "super_admin" || access.organizationIds.includes(organizationId);
}
