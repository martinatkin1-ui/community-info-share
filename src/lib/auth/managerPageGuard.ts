import { redirect } from "next/navigation";

import { getManagerAccessContext } from "@/lib/auth/managerAccess";

interface ManagerPageGuardOptions {
  nextPath: string;
  superAdminOnly?: boolean;
  requireOrganization?: boolean;
}

export async function requireManagerPageAccess(options: ManagerPageGuardOptions) {
  const access = await getManagerAccessContext();

  if (!access) {
    redirect(`/manager-signin?next=${encodeURIComponent(options.nextPath)}`);
  }

  if (options.superAdminOnly && access.role !== "super_admin") {
    redirect("/dashboard");
  }

  const requireOrganization = options.requireOrganization ?? true;
  if (requireOrganization && access.role !== "super_admin" && access.organizationIds.length === 0) {
    redirect("/manager-signin");
  }

  return access;
}
