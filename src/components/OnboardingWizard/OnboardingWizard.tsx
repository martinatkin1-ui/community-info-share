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
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

import StepDataEngine from "./steps/StepDataEngine";
import StepGovernance from "./steps/StepGovernance";
import StepIdentity from "./steps/StepIdentity";
import OnboardingStep_Services from "./steps/OnboardingStep_Services";
import StepVerification from "./steps/StepVerification";
import StepVibeSocials from "./steps/StepVibeSocials";
import {
  STEP_TITLES,
} from "./types";

const STEP_ICONS = [Building2, HeartHandshake, Link2, BriefcaseMedical, ShieldCheck, BadgeCheck] as const;

export default function OnboardingWizard() {
  return (
    <OnboardingProvider>
      <OnboardingWizardContent />
    </OnboardingProvider>
  );
}

function OnboardingWizardContent() {
  const {
    step,
    isSubmitting,
    submitError,
    submitMessage,
    nextStep,
    prevStep,
    submitForVerification,
  } = useOnboarding();

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
            {step === 0 && <StepIdentity />}
            {step === 1 && <StepVibeSocials />}
            {step === 2 && <StepDataEngine />}
            {step === 3 && <OnboardingStep_Services />}
            {step === 4 && <StepGovernance />}
            {step === 5 && <StepVerification />}
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
