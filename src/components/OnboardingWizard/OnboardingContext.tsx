"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

interface OnboardingContextValue {
  step: number;
  values: OnboardingFormValues;
  errors: Record<string, string>;
  scrapeState: "idle" | "testing" | "success";
  isSubmitting: boolean;
  submitMessage: string | null;
  submitError: string | null;
  logoPreviewUrl: string | null;
  onFieldChange: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitForVerification: () => Promise<void>;
  testScrape: () => Promise<void>;
}

const INITIAL_VALUES: OnboardingFormValues = {
  orgName: "",
  orgType: "LERO",
  logoFile: null,
  bio: "",
  facebookHandle: "",
  instagramHandle: "",
  xHandle: "",
  websiteUrl: "",
  scrapingUrls: "",
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

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
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

  function onFieldChange<K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) {
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
      formData.set("scrapingUrls", values.scrapingUrls.trim());
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
    <OnboardingContext.Provider
      value={{
        step,
        values,
        errors,
        scrapeState,
        isSubmitting,
        submitMessage,
        submitError,
        logoPreviewUrl,
        onFieldChange,
        nextStep,
        prevStep,
        submitForVerification,
        testScrape,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
