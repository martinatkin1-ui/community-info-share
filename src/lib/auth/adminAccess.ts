import { getManagerAccessContext } from "@/lib/auth/managerAccess";

export async function requireSuperAdminAccess() {
  const access = await getManagerAccessContext();

  if (!access) {
    throw new Error("Unauthorized");
  }

  if (access.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  return access;
}
