import { Plus, Trash2 } from "lucide-react";

import { useOnboarding } from "../OnboardingContext";
import type { CoreServiceDraft } from "../types";

const SERVICE_CATEGORIES = [
  "Housing",
  "Mental Health",
  "Debt Advice",
  "Advocacy",
  "Family Support",
  "Employment",
  "Substance Recovery",
  "Other",
] as const;

const REFERRAL_OPTIONS = [
  { value: "professional_only", label: "Professional-Only (Warm Handover)" },
  { value: "self_referral", label: "Self-Referral" },
] as const;

const AVAILABILITY_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "busy", label: "Busy (about 2-week wait)" },
  { value: "waitlist_closed", label: "Waitlist Closed" },
] as const;

const SPECIALIST_FOCUS_OPTIONS = [
  { value: "prison-leavers", label: "Prison Leavers" },
  { value: "residential-rehab-graduates", label: "Residential Rehab Graduates" },
  { value: "mental-health-discharge", label: "Mental Health Discharge" },
  { value: "homelessness-support", label: "Homelessness Support" },
  { value: "new-to-recovery", label: "New to Recovery" },
] as const;

function newService(): CoreServiceDraft {
  return {
    title: "",
    description: "",
    category: "Housing",
    needTagsInput: "",
    eligibilityBadge: "",
    isCrisis: false,
    availabilityStatus: "open",
    referralMethod: "professional_only",
    contactEmail: "",
    contactPhone: "",
  };
}

export default function OnboardingStep_Services() {
  const { values, errors, onFieldChange } = useOnboarding();

  function toggleSpecialistFocus(value: string) {
    if (values.specialist_focus.includes(value)) {
      onFieldChange(
        "specialist_focus",
        values.specialist_focus.filter((item) => item !== value)
      );
      return;
    }

    onFieldChange("specialist_focus", [...values.specialist_focus, value]);
  }

  function updateService(index: number, patch: Partial<CoreServiceDraft>) {
    const next = [...values.coreServices];
    next[index] = { ...next[index], ...patch };
    onFieldChange("coreServices", next);
  }

  function addService() {
    onFieldChange("coreServices", [...values.coreServices, newService()]);
  }

  function removeService(index: number) {
    onFieldChange(
      "coreServices",
      values.coreServices.filter((_, i) => i !== index)
    );
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-brand-slate/80">
        List your core long-term services so residents can find support even when there is no event date.
      </p>

      <div className="rounded-xl border border-brand-coral/30 bg-brand-coral/5 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-brand-slate">Specialist Visibility For Public Routing</h3>
        <p className="text-xs text-brand-slate/80">
          These details power urgent matching on specialist support pages.
        </p>

        <div>
          <p className="text-xs font-semibold text-brand-slate">Specialist Focus</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {SPECIALIST_FOCUS_OPTIONS.map((option) => {
              const checked = values.specialist_focus.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-lg border border-brand-sky/30 bg-white px-3 py-2 text-xs text-brand-slate"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSpecialistFocus(option.value)}
                    className="h-4 w-4 accent-brand-slate"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
          {errors.specialist_focus && <p className="mt-1 text-xs text-red-600">{errors.specialist_focus}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-brand-slate">Immediate Contact Number</label>
            <input
              type="tel"
              value={values.immediate_contact}
              onChange={(e) => onFieldChange("immediate_contact", e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
              placeholder="01902 123456"
            />
            {errors.immediate_contact && <p className="mt-1 text-xs text-red-600">{errors.immediate_contact}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-slate">Public Self-Referral URL (optional)</label>
            <input
              type="url"
              value={values.self_referral_url}
              onChange={(e) => onFieldChange("self_referral_url", e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
              placeholder="https://your-org.org/self-referral"
            />
            {errors.self_referral_url && <p className="mt-1 text-xs text-red-600">{errors.self_referral_url}</p>}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 rounded-lg border border-brand-amber/40 bg-brand-cream px-3 py-2 text-xs font-medium text-brand-slate">
          <input
            type="checkbox"
            checked={values.is_emergency_provider}
            onChange={(e) => onFieldChange("is_emergency_provider", e.target.checked)}
            className="h-4 w-4 accent-red-600"
          />
          We provide emergency / same-day specialist support
        </label>
      </div>

      {errors.coreServices && <p className="text-xs text-red-600">{errors.coreServices}</p>}

      <div className="space-y-4">
        {values.coreServices.map((service, index) => (
          <div key={index} className="rounded-xl border border-brand-sky/30 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-slate">Service {index + 1}</h3>
              {values.coreServices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-brand-slate">Service Title</label>
                <input
                  type="text"
                  value={service.title}
                  onChange={(e) => updateService(index, { title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                  placeholder="Housing Advice Clinic"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-slate">Category</label>
                <select
                  value={service.category}
                  onChange={(e) => updateService(index, { category: e.target.value as CoreServiceDraft["category"] })}
                  className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                >
                  {SERVICE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-slate">Description</label>
              <textarea
                rows={3}
                value={service.description}
                onChange={(e) => updateService(index, { description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                placeholder="Describe what support is provided, who it helps, and outcomes..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-brand-slate">Need Tags (comma-separated)</label>
                <input
                  type="text"
                  value={service.needTagsInput}
                  onChange={(e) => updateService(index, { needTagsInput: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                  placeholder="debt, housing, benefits"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-slate">Eligibility Badge</label>
                <input
                  type="text"
                  value={service.eligibilityBadge}
                  onChange={(e) => updateService(index, { eligibilityBadge: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                  placeholder="Wolverhampton residents only"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-brand-amber/40 bg-brand-cream px-3 py-2 text-xs font-medium text-brand-slate">
                <input
                  type="checkbox"
                  checked={service.isCrisis}
                  onChange={(e) => updateService(index, { isCrisis: e.target.checked })}
                  className="h-4 w-4 accent-red-600"
                />
                Crisis / same-day support
              </label>

              <div>
                <label className="block text-xs font-semibold text-brand-slate">Wait-time Status</label>
                <select
                  value={service.availabilityStatus}
                  onChange={(e) => updateService(index, { availabilityStatus: e.target.value as CoreServiceDraft["availabilityStatus"] })}
                  className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate">Referral Method</label>
                <select
                  value={service.referralMethod}
                  onChange={(e) => updateService(index, { referralMethod: e.target.value as CoreServiceDraft["referralMethod"] })}
                  className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                >
                  {REFERRAL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {service.referralMethod === "self_referral" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate">Contact Email</label>
                  <input
                    type="email"
                    value={service.contactEmail}
                    onChange={(e) => updateService(index, { contactEmail: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                    placeholder="support@organisation.org"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-slate">Contact Phone</label>
                  <input
                    type="tel"
                    value={service.contactPhone}
                    onChange={(e) => updateService(index, { contactPhone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-brand-sky/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
                    placeholder="01902 123456"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addService}
        className="inline-flex items-center gap-2 rounded-full border border-brand-slate px-4 py-2 text-sm font-medium text-brand-slate hover:bg-brand-sky/10"
      >
        <Plus className="h-4 w-4" /> Add another service
      </button>
    </section>
  );
}
