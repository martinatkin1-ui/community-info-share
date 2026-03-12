import { CheckCircle2, Clock3 } from "lucide-react";

import { useOnboarding } from "../OnboardingContext";

export default function StepVerification() {
  const { values } = useOnboarding();

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Ready to Submit for Verification
        </h3>
        <p className="mt-2 text-sm text-emerald-700">
          {values.orgName || "Your organisation profile"} will be placed in the verification queue for a human admin review.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-sky/40 bg-white p-5">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-slate">
          <Clock3 className="h-4 w-4 text-sky-700" />
          What happens next
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-slate/90">
          <li>Our team reviews your profile and links within 24 hours.</li>
          <li>Once verified, your public profile and events feed go live.</li>
          <li>You can start receiving Warm Handover referrals securely.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-brand-sky/40 bg-white p-5">
        <h4 className="text-sm font-semibold text-brand-slate">Specialist visibility snapshot</h4>
        <p className="mt-2 text-sm text-brand-slate/80">
          Focus areas: {values.specialist_focus.length > 0 ? values.specialist_focus.join(", ") : "None selected"}
        </p>
        <p className="mt-1 text-sm text-brand-slate/80">
          Immediate contact: {values.immediate_contact || "Not provided"}
        </p>
        <p className="mt-1 text-sm text-brand-slate/80">
          Self-referral URL: {values.self_referral_url || "Not provided"}
        </p>
        <p className="mt-1 text-sm text-brand-slate/80">
          Emergency provider: {values.is_emergency_provider ? "Yes" : "No"}
        </p>
      </div>
    </section>
  );
}
