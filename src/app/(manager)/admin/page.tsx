import AdminDashboard from "@/components/Admin/AdminDashboard";
import { requireManagerPageAccess } from "@/lib/auth/managerPageGuard";

export default async function AdminPage() {
  await requireManagerPageAccess({ nextPath: "/admin", superAdminOnly: true, requireOrganization: false });

  return <AdminDashboard />;
}
