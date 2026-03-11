import { redirect } from "next/navigation";

import ServiceStatusManager from "@/components/Manager/ServiceStatusManager";
import { getManagerAccessContext } from "@/lib/auth/managerAccess";

export default async function ServiceStatusPage() {
  const access = await getManagerAccessContext();

  if (!access) {
    redirect("/manager-signin?next=/service-status");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Organization Management</h1>
      <p className="mt-3 max-w-3xl text-neutral-600">
        Manage service visibility and live wait-times so the directory stays honest,
        useful, and referral-ready for caseworkers across the West Midlands.
      </p>

      <div className="mt-8">
        <ServiceStatusManager />
      </div>
    </main>
  );
}
