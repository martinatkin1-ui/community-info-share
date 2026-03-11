"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  HeartHandshake,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import StepDataEngine from "./steps/StepDataEngine";
import StepGovernance from "./steps/StepGovernance";
import StepIdentity from "./steps/StepIdentity";
import OnboardingStep_Services from "./steps/OnboardingStep_Services";
import StepVerification from "./steps/StepVerification";
import StepVibeSocials from "./steps/StepVibeSocials";
import {
  dataEngineSchema,
  governanceSchema,
  identitySchema,
  onboardingSchema,
  servicesSchema,
  STEP_TITLES,
  vibeSchema,
  type OnboardingFormValues,
} from "./types";

const STEP_ICONS = [Building2, HeartHandshake, Link2, BriefcaseMedical, ShieldCheck, BadgeCheck] as const;

const INITIAL_VALUES: OnboardingFormValues = {
  orgName: "",
  orgType: "LERO",
  logoFile: null,
  bio: "",
  facebookHandle: "",
  instagramHandle: "",
  xHandle: "",
  websiteUrl: "",
  scrapingUrl: "",
  coreServices: [
    {
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
    },
  ],
  dataSharingAgreement: false,
  warmHandoverAcknowledged: false,
};

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<OnboardingFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scrapeState, setScrapeState] = useState<"idle" | "testing" | "success">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const logoPreviewUrl = useMemo(() => {
    if (!values.logoFile) return null;
    return URL.createObjectURL(values.logoFile);
  }, [values.logoFile]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  function onFieldChange<K extends keyof OnboardingFormValues>(
    key: K,
    value: OnboardingFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function applyValidationError(err: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
    const mapped: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!mapped[key]) mapped[key] = issue.message;
    }
    setErrors(mapped);
  }

  function validateCurrentStep(): boolean {
    let result;
    if (step === 0) {
      result = identitySchema.safeParse(values);
    } else if (step === 1) {
      result = vibeSchema.safeParse(values);
    } else if (step === 2) {
      result = dataEngineSchema.safeParse(values);
    } else if (step === 3) {
      result = servicesSchema.safeParse(values);
    } else if (step === 4) {
      result = governanceSchema.safeParse(values);
    } else {
      result = onboardingSchema.safeParse(values);
    }

    if (!result.success) {
      applyValidationError(result.error);
      return false;
    }

    setErrors({});
    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function testScrape() {
    if (!dataEngineSchema.safeParse(values).success) {
      const parse = dataEngineSchema.safeParse(values);
      if (!parse.success) applyValidationError(parse.error);
      return;
    }

    setScrapeState("testing");
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setScrapeState("success");
  }

  async function submitForVerification() {
    const parse = onboardingSchema.safeParse(values);
    if (!parse.success) {
      applyValidationError(parse.error);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.set("name", values.orgName.trim());
      formData.set("orgType", values.orgType);
      formData.set("bio", values.bio.trim());
      formData.set("websiteUrl", values.websiteUrl.trim());
      formData.set("scrapingUrl", values.scrapingUrl.trim());
      formData.set("facebookHandle", values.facebookHandle.trim());
      formData.set("instagramHandle", values.instagramHandle.trim());
      formData.set("xHandle", values.xHandle.trim());
      formData.set(
        "servicesJson",
        JSON.stringify(
          values.coreServices.map((service) => ({
            title: service.title.trim(),
            description: service.description.trim(),
            category: service.category,
            needTags: service.needTagsInput
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
              .filter(Boolean),
            eligibilityBadge: service.eligibilityBadge.trim() || null,
            isCrisis: service.isCrisis,
            availabilityStatus: service.availabilityStatus,
            referralMethod: service.referralMethod,
            contactEmail: service.contactEmail.trim() || null,
            contactPhone: service.contactPhone.trim() || null,
          }))
        )
      );
      formData.set("dataSharingAgreement", String(values.dataSharingAgreement));
      formData.set("warmHandoverAcknowledged", String(values.warmHandoverAcknowledged));
      if (values.logoFile) {
        formData.set("logoFile", values.logoFile);
      }

      const response = await fetch("/api/organizations/onboarding", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit profile.");
      }

      setSubmitMessage(data.message ?? "Submitted for verification.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STEP_TITLES.map((title, i) => {
          const Icon = STEP_ICONS[i];
          const isActive = i === step;
          const isDone = i < step;
          return (
            <li
              key={title}
              className={`rounded-xl border px-3 py-2 text-xs transition ${
                isActive
                  ? "border-brand-coral bg-brand-coral/10 text-brand-slate"
                  : isDone
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-brand-sky/30 bg-white text-brand-slate/70"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Icon className="h-3.5 w-3.5" /> {i + 1}. {title}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-brand-sky/30 bg-white p-5 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 0 && (
              <StepIdentity
                values={values}
                errors={errors}
                logoPreviewUrl={logoPreviewUrl}
                onFieldChange={onFieldChange}
              />
            )}
            {step === 1 && (
              <StepVibeSocials
                values={values}
                errors={errors}
                onFieldChange={onFieldChange}
              />
            )}
            {step === 2 && (
              <StepDataEngine
                values={values}
                errors={errors}
                scrapeState={scrapeState}
                onFieldChange={onFieldChange}
                onTestScrape={testScrape}
              />
            )}
            {step === 3 && (
              <OnboardingStep_Services values={values} errors={errors} onFieldChange={onFieldChange} />
            )}
            {step === 4 && (
              <StepGovernance values={values} errors={errors} onFieldChange={onFieldChange} />
            )}
            {step === 5 && <StepVerification orgName={values.orgName} />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0 || isSubmitting}
            className="inline-flex items-center gap-2 rounded-full border border-brand-sky/40 bg-white px-4 py-2 text-sm font-medium text-brand-slate transition hover:bg-brand-sky/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < STEP_TITLES.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 rounded-full bg-brand-slate px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitForVerification}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-coral px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </button>
          )}
        </div>

        {submitError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </p>
        )}
        {submitMessage && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {submitMessage}
          </p>
        )}
      </div>
    </div>
  );
}
