import { redirect } from "next/navigation";

import AdminDashboard from "@/components/Admin/AdminDashboard";
import { getManagerAccessContext } from "@/lib/auth/managerAccess";

export default async function AdminPage() {
  const access = await getManagerAccessContext();

  if (!access) {
    redirect("/manager-signin?next=/admin");
  }

  if (access.role !== "super_admin") {
    redirect("/dashboard");
  }

  return <AdminDashboard />;
}
