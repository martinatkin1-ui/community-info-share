import { HeartHandshake } from "lucide-react";

import type { OnboardingFormValues } from "../types";

interface StepVibeSocialsProps {
  values: OnboardingFormValues;
  errors: Record<string, string>;
  onFieldChange: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
}

function SocialInput({
  label,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-slate">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-brand-sky/40 bg-white px-4 py-2.5 text-sm outline-none ring-brand-sky transition focus:ring-2"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function StepVibeSocials({ values, errors, onFieldChange }: StepVibeSocialsProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-brand-lime/40 bg-brand-lime/20 p-4 text-sm text-brand-slate">
        <p className="flex items-center gap-2 font-semibold">
          <HeartHandshake className="h-4 w-4 text-emerald-700" />
          Your community vibe helps people trust the service before first contact.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-slate">Community-facing Bio</label>
        <textarea
          rows={5}
          value={values.bio}
          onChange={(e) => onFieldChange("bio", e.target.value)}
          placeholder="Tell residents what you do, who you support, and what a first visit feels like..."
          className="mt-1 w-full rounded-xl border border-brand-sky/40 bg-white px-4 py-3 text-sm outline-none ring-brand-sky transition focus:ring-2"
        />
        <p className="mt-1 text-xs text-brand-slate/60">{values.bio.length}/1200</p>
        {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SocialInput
          label="Facebook Handle"
          value={values.facebookHandle}
          error={errors.facebookHandle}
          placeholder="wolverhampton.wellbeing"
          onChange={(v) => onFieldChange("facebookHandle", v)}
        />
        <SocialInput
          label="Instagram Handle"
          value={values.instagramHandle}
          error={errors.instagramHandle}
          placeholder="wm_wellbeing"
          onChange={(v) => onFieldChange("instagramHandle", v)}
        />
        <SocialInput
          label="X Handle"
          value={values.xHandle}
          error={errors.xHandle}
          placeholder="wmwellbeing"
          onChange={(v) => onFieldChange("xHandle", v)}
        />
      </div>
    </section>
  );
}
