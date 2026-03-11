"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import { AlertOctagon, Building2, Home, Shield, Stethoscope, Wallet } from "lucide-react";

import type { SupportService } from "@/types/services";
import BaseDiscoveryCard from "./BaseDiscoveryCard";

const CATEGORY_ICON: Record<string, ComponentType<{ className?: string }>> = {
  Housing: Home,
  Advocacy: Shield,
  "Mental Health": Stethoscope,
  "Debt Advice": Wallet,
};

function toTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

interface ServiceCardProps {
  service: SupportService;
}

const AGE_OPTIONS = ["16-17", "18-25", "26-64", "65+"] as const;

function statusMeta(status: SupportService["availabilityStatus"]) {
  if (status === "open") {
    return {
      label: "Open",
      style: "bg-emerald-100 text-emerald-800 border-emerald-200",
      helper: "Accepting referrals now",
    };
  }
  if (status === "busy") {
    return {
      label: "Busy (2-week wait)",
      style: "bg-amber-100 text-amber-800 border-amber-200",
      helper: "Expect roughly a 2-week wait",
    };
  }
  return {
    label: "Waitlist Closed",
    style: "bg-red-100 text-red-800 border-red-200",
    helper: "Currently not taking new referrals",
  };
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const Icon = CATEGORY_ICON[service.category] ?? Building2;
  const [showChecker, setShowChecker] = useState(false);
  const [ageBand, setAgeBand] = useState("");
  const [location, setLocation] = useState("");
  const [need, setNeed] = useState("");

  const status = statusMeta(service.availabilityStatus);

  const check = useMemo(() => {
    if (!ageBand || !location.trim() || !need.trim()) return null;

    const eligibilityText = (service.eligibilityBadge ?? "").toLowerCase();
    const locationOk =
      !eligibilityText.includes("wolverhampton") ||
      location.toLowerCase().includes("wolverhampton");
    const ageOk =
      !eligibilityText.includes("18+") ||
      ageBand === "18-25" ||
      ageBand === "26-64" ||
      ageBand === "65+";
    const needOk =
      service.needTags.length === 0 ||
      service.needTags.some((t) => need.toLowerCase().includes(t.toLowerCase()));

    const qualifies = locationOk && ageOk && needOk;

    return {
      qualifies,
      message: qualifies
        ? "This service looks like a good fit."
        : "This may not be the best fit today. Consider another option or ask a caseworker.",
    };
  }, [ageBand, location, need, service.eligibilityBadge, service.needTags]);

  return (
    <BaseDiscoveryCard
      imageAlt={`Service card for ${service.title}`}
      fallbackBanner={
        <div className="flex h-full items-end bg-gradient-to-br from-brand-sky/30 to-brand-lime/20 p-3">
          <Icon className="h-7 w-7 text-brand-slate/70" />
        </div>
      }
      title={service.title}
      subtitle={
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-slate/60">
              <Icon className="h-3.5 w-3.5" /> {service.category}
            </p>
            <Link
              href={`/organizations/${service.organizationId}`}
              className="mt-0.5 inline-block text-xs text-neutral-500 underline-offset-2 hover:underline"
            >
              {service.organizationName}
            </Link>
          </div>

          {service.isCrisis && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              <AlertOctagon className="h-3.5 w-3.5" /> Crisis
            </span>
          )}
        </div>
      }
      badges={
        <div className="mt-1 flex flex-wrap gap-2">
          {service.eligibilityBadge && (
            <span className="rounded-full bg-brand-amber/20 px-2.5 py-1 text-xs font-medium text-amber-900">
              {service.eligibilityBadge}
            </span>
          )}
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.style}`} title={status.helper}>
            {status.label}
          </span>
          {service.needTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-brand-lime/30 px-2.5 py-1 text-xs font-medium text-emerald-900">
              {tag}
            </span>
          ))}
        </div>
      }
      body={<p className="text-sm text-neutral-700 line-clamp-3">{service.description}</p>}
      footer={<>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <button
          type="button"
          onClick={() => setShowChecker((v) => !v)}
          className="text-xs font-semibold text-brand-slate hover:underline"
        >
          Check if this fits you
        </button>

        {showChecker && (
          <div className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value)}
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
              >
                <option value="">Age?</option>
                {AGE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location?"
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
              />
              <input
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                placeholder="Need?"
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
              />
            </div>

            {check && (
              <p className={`text-xs font-medium ${check.qualifies ? "text-emerald-700" : "text-amber-700"}`}>
                {check.qualifies ? "✓ " : "! "}{check.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        {service.availabilityStatus === "waitlist_closed" ? (
          <p className="text-xs font-medium text-red-700">
            This service is currently closed to new referrals.
          </p>
        ) : service.referralMethod === "professional_only" ? (
          <Link
            href={`/referrals?serviceId=${service.id}&toOrganizationId=${service.organizationId}&serviceTitle=${encodeURIComponent(service.title)}`}
            className="inline-flex rounded-full bg-brand-slate px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Refer to this Service
          </Link>
        ) : (
          <div className="flex flex-wrap gap-2">
            {service.contactEmail && (
              <a
                href={`mailto:${service.contactEmail}?subject=${encodeURIComponent(`Self-referral: ${service.title}`)}`}
                className="inline-flex rounded-full bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Contact Now (Email)
              </a>
            )}
            {service.contactPhone && (
              <a
                href={toTelHref(service.contactPhone)}
                className="inline-flex rounded-full border border-brand-coral px-4 py-2 text-sm font-semibold text-brand-coral hover:bg-brand-coral/10"
              >
                Call Now
              </a>
            )}
          </div>
        )}
      </div>
      </>}
    />
  );
}
