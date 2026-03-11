import { Building2, UploadCloud } from "lucide-react";

import { useOnboarding } from "../OnboardingContext";
import { ORG_TYPES, type OnboardingFormValues } from "../types";

export default function StepIdentity() {
  const { values, errors, logoPreviewUrl, onFieldChange } = useOnboarding();

  return (
    <section className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-brand-slate">Organisation Name</label>
        <input
          type="text"
          value={values.orgName}
          onChange={(e) => onFieldChange("orgName", e.target.value)}
          placeholder="e.g. Wolverhampton Wellbeing Circle"
          className="mt-1 w-full rounded-xl border border-brand-sky/40 bg-white px-4 py-2.5 text-sm outline-none ring-brand-sky transition focus:ring-2"
        />
        {errors.orgName && <p className="mt-1 text-xs text-red-600">{errors.orgName}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-slate">Organisation Type</label>
        <div className="mt-1 relative">
          <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-slate/50" />
          <select
            value={values.orgType}
            onChange={(e) => onFieldChange("orgType", e.target.value as OnboardingFormValues["orgType"])}
            className="w-full rounded-xl border border-brand-sky/40 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-brand-sky transition focus:ring-2"
          >
            {ORG_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-brand-amber/60 bg-brand-cream p-4">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-brand-slate">
          <UploadCloud className="h-5 w-5 text-brand-amber" />
          Upload Logo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFieldChange("logoFile", e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        <p className="mt-1 text-xs text-brand-slate/70">PNG/JPG recommended. This upload is queued for verification.</p>

        {values.logoFile && (
          <p className="mt-3 text-xs text-brand-slate/80">Selected: {values.logoFile.name}</p>
        )}

        {logoPreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreviewUrl}
            alt="Logo preview"
            className="mt-3 h-20 w-20 rounded-lg border border-brand-sky/30 object-cover"
          />
        )}
      </div>
    </section>
  );
}
