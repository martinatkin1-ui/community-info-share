import { ShieldCheck } from "lucide-react";

import { useOnboarding } from "../OnboardingContext";

export default function StepGovernance() {
  const { values, errors, onFieldChange } = useOnboarding();

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-brand-sky/40 bg-brand-sky/20 p-4 text-sm text-brand-slate">
        <p className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-sky-700" />
          Warm Handover keeps referrals human: context, consent, and dignity first.
        </p>
        <p className="mt-2 text-sm text-brand-slate/90">
          When a referral is sent, your team receives key context and any optional Warm Handover notes
          so clients are welcomed safely and respectfully from the first interaction.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-brand-lime/40 bg-brand-lime/20 p-4 text-sm text-brand-slate">
        <input
          type="checkbox"
          checked={values.dataSharingAgreement}
          onChange={(e) => onFieldChange("dataSharingAgreement", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-emerald-700"
        />
        <span>
          I accept the Data Sharing Agreement and confirm we will process referral data only for coordinated care,
          under UK GDPR principles.
        </span>
      </label>
      {errors.dataSharingAgreement && <p className="text-xs text-red-600">{errors.dataSharingAgreement}</p>}

      <label className="flex items-start gap-3 rounded-xl border border-brand-amber/40 bg-brand-cream p-4 text-sm text-brand-slate">
        <input
          type="checkbox"
          checked={values.warmHandoverAcknowledged}
          onChange={(e) => onFieldChange("warmHandoverAcknowledged", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-orange-600"
        />
        <span>
          I understand and support the Warm Handover model: our team should use referral context to make the
          first contact welcoming, especially for clients who may be anxious or at risk of disengagement.
        </span>
      </label>
      {errors.warmHandoverAcknowledged && <p className="text-xs text-red-600">{errors.warmHandoverAcknowledged}</p>}
    </section>
  );
}
