"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ContactMethod, Organization, ReferralFormData, UrgencyLevel } from "@/types/domain";

type FormState = "idle" | "loading" | "success" | "error";

interface SubmitResult {
  referralId: string;
  message: string;
}

const URGENCY_OPTIONS: Array<{ value: UrgencyLevel; label: string; hint: string }> = [
  { value: "routine", label: "Routine", hint: "No immediate concern" },
  { value: "soon", label: "Soon", hint: "Within a few days" },
  { value: "urgent", label: "Urgent", hint: "Needs rapid response" },
];

const FIELD = "rounded-md border border-neutral-300 px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-400";
const LABEL = "block text-sm font-medium text-neutral-700 mb-1";

export default function ReferralForm() {
  const searchParams = useSearchParams();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState(false);

  const [fromOrgId, setFromOrgId] = useState("");
  const [toOrgId, setToOrgId] = useState("");
  const [clientInitials, setClientInitials] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [contactValue, setContactValue] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [vibeCheckNote, setVibeCheckNote] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("routine");
  const [consentGiven, setConsentGiven] = useState(false);

  const [formState, setFormState] = useState<FormState>("idle");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((payload) => {
        setOrgs(payload.organizations ?? []);
      })
      .catch(() => setOrgsError(true))
      .finally(() => setOrgsLoading(false));
  }, []);

  useEffect(() => {
    if (orgs.length === 0) return;

    const toOrganizationId = searchParams.get("toOrganizationId");
    const serviceTitle = searchParams.get("serviceTitle");

    if (toOrganizationId && orgs.some((o) => o.id === toOrganizationId)) {
      setToOrgId((prev) => prev || toOrganizationId);
    }

    if (serviceTitle && !referralReason.trim()) {
      setReferralReason(`Referral requested for service: ${serviceTitle}. `);
    }
  }, [orgs, searchParams, referralReason]);

  const toOrgName = useMemo(
    () => orgs.find((o) => o.id === toOrgId)?.name ?? "",
    [orgs, toOrgId]
  );

  const toOptions = useMemo(
    () => orgs.filter((o) => o.id !== fromOrgId),
    [orgs, fromOrgId]
  );

  const canSubmit =
    consentGiven &&
    fromOrgId &&
    toOrgId &&
    clientInitials.trim().length >= 1 &&
    contactValue.trim().length >= 4 &&
    referralReason.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setFormState("loading");
    setApiError(null);

    const body: ReferralFormData = {
      fromOrganizationId: fromOrgId,
      toOrganizationId: toOrgId,
      clientInitials: clientInitials.trim(),
      contactMethod,
      contactValue: contactValue.trim(),
      referralReason: referralReason.trim(),
      vibeCheckNote: vibeCheckNote.trim() || undefined,
      urgency,
      consentGiven: true,
    };

    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Submission failed.");
      }

      setSubmitResult({ referralId: data.referralId, message: data.message });
      setFormState("success");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unexpected error.");
      setFormState("error");
    }
  }

  if (formState === "success" && submitResult) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-800">Referral Submitted</h2>
        <p className="mt-2 text-emerald-700">{submitResult.message}</p>
        <p className="mt-1 text-sm text-emerald-600">
          Referral ID: <span className="font-mono">{submitResult.referralId}</span>
        </p>
        <p className="mt-3 text-sm text-neutral-500">
          Client contact details were sent directly to the receiving organisation and
          have not been stored in this system.
        </p>
        <button
          type="button"
          onClick={() => {
            setFormState("idle");
            setSubmitResult(null);
            setFromOrgId("");
            setToOrgId("");
            setClientInitials("");
            setContactValue("");
            setReferralReason("");
            setVibeCheckNote("");
            setUrgency("routine");
            setConsentGiven(false);
          }}
          className="mt-4 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Submit another referral
        </button>
      </div>
    );
  }

  if (orgsLoading) {
    return <p className="text-sm text-neutral-500">Loading verified organisations…</p>;
  }

  if (orgsError) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Could not load organisations. Please refresh and try again.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>

      {/* ── Step 1: Organisation selection ── */}
      <fieldset className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
        <legend className="px-1 text-base font-semibold text-neutral-800">
          Step 1 — Organisations
        </legend>

        <div>
          <label htmlFor="fromOrg" className={LABEL}>Referring from</label>
          <select id="fromOrg" className={FIELD} value={fromOrgId}
            onChange={(e) => {
              setFromOrgId(e.target.value);
              if (toOrgId === e.target.value) setToOrgId("");
            }}>
            <option value="">Select your organisation…</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}{org.city ? ` — ${org.city}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="toOrg" className={LABEL}>Referring to</label>
          <select id="toOrg" className={FIELD} value={toOrgId}
            onChange={(e) => setToOrgId(e.target.value)}
            disabled={!fromOrgId}>
            <option value="">Select target service…</option>
            {toOptions.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}{org.city ? ` — ${org.city}` : ""}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* ── Step 2: Client details (only visible once both orgs chosen) ── */}
      {fromOrgId && toOrgId && (
        <fieldset className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <legend className="px-1 text-base font-semibold text-neutral-800">
            Step 2 — Client Details
          </legend>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <strong>UK GDPR — data minimisation:</strong> only provide the minimum
            information necessary. Client contact details will be transmitted
            <strong> directly and securely</strong> to {toOrgName || "the receiving organisation"}
            {" "}and will <strong>not be stored</strong> in this system.
          </div>

          <div>
            <label htmlFor="clientInitials" className={LABEL}>
              Client initials <span className="text-neutral-400 font-normal">(e.g. J.S.)</span>
            </label>
            <input id="clientInitials" type="text" maxLength={12}
              placeholder="J.S."
              className={FIELD} value={clientInitials}
              onChange={(e) => setClientInitials(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="contactMethod" className={LABEL}>Contact method</label>
              <select id="contactMethod" className={FIELD} value={contactMethod}
                onChange={(e) => {
                  setContactMethod(e.target.value as ContactMethod);
                  setContactValue("");
                }}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div>
              <label htmlFor="contactValue" className={LABEL}>
                {contactMethod === "email" ? "Email address" : "Phone number"}
              </label>
              <input id="contactValue"
                type={contactMethod === "email" ? "email" : "tel"}
                autoComplete="off"
                placeholder={contactMethod === "email" ? "client@example.com" : "07700 900000"}
                className={FIELD} value={contactValue}
                onChange={(e) => setContactValue(e.target.value)} />
            </div>
          </div>

          <div>
            <label htmlFor="referralReason" className={LABEL}>
              Reason for referral
              <span className="ml-1 text-neutral-400 font-normal">(clinical context only — no diagnoses or sensitive categories unless essential)</span>
            </label>
            <textarea id="referralReason" rows={4} maxLength={1000}
              placeholder="Brief description of the support needed…"
              className={FIELD} value={referralReason}
              onChange={(e) => setReferralReason(e.target.value)} />
            <p className="mt-1 text-xs text-neutral-400 text-right">
              {referralReason.length}/1000
            </p>
          </div>

          {/* —— Vibe Check: warm handover note —— */}
          <div className="rounded-xl border border-dashed border-brand-amber/60 bg-brand-cream p-4 space-y-2">
            <label htmlFor="vibeCheckNote" className="block text-sm font-semibold text-amber-800">
              💛 Warm Handover Note
              <span className="ml-1 font-normal text-amber-700">(optional &mdash; seen only by the receiving worker)</span>
            </label>
            <p className="text-xs text-amber-700">
              Use this to prepare the receiving worker — e.g. &ldquo;Client is nervous about new groups, please meet them at the door&rdquo;.
              This note is NOT stored in the database: it travels only in the referral email.
            </p>
            <textarea
              id="vibeCheckNote"
              rows={3}
              maxLength={500}
              placeholder="e.g. Client is nervous about groups. A warm welcome at the door would help."
              className={`${FIELD} border-brand-amber/50 focus:ring-brand-amber/50`}
              value={vibeCheckNote}
              onChange={(e) => setVibeCheckNote(e.target.value)}
            />
            <p className="text-xs text-amber-600 text-right">{vibeCheckNote.length}/500</p>
          </div>

          <div>
            <label className={LABEL}>Urgency level</label>
            <div className="flex flex-wrap gap-3">
              {URGENCY_OPTIONS.map((opt) => (
                <label key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    urgency === opt.value
                      ? "border-neutral-800 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}>
                  <input type="radio" name="urgency" value={opt.value}
                    checked={urgency === opt.value}
                    onChange={() => setUrgency(opt.value)}
                    className="sr-only" />
                  <span className="font-medium">{opt.label}</span>
                  <span className={urgency === opt.value ? "text-neutral-300" : "text-neutral-400"}>
                    {opt.hint}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {/* ── Step 3: Consent ── */}
      {fromOrgId && toOrgId && (
        <fieldset className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <legend className="px-1 text-base font-semibold text-neutral-800">
            Step 3 — Client Consent
          </legend>

          <label className={`flex gap-3 items-start cursor-pointer rounded-lg border p-4 transition-colors ${
            consentGiven ? "border-emerald-400 bg-emerald-50" : "border-neutral-200"
          }`}>
            <input type="checkbox" checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-700 flex-shrink-0" />
            <span className="text-sm leading-relaxed text-neutral-800">
              I confirm that the client has given their explicit, informed consent for
              their initials and contact details to be shared with{" "}
              <strong>{toOrgName || "the receiving organisation"}</strong> for the
              purpose of this referral. The client has been informed of their right to
              withdraw consent and of how their data will be used, in line with{" "}
              <strong>UK GDPR Article 6(1)(a)</strong>. A record of this consent is
              held by the referring caseworker.
            </span>
          </label>
        </fieldset>
      )}

      {/* ── Error ── */}
      {apiError && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {apiError}
        </p>
      )}

      {/* ── Submit ── */}
      {fromOrgId && toOrgId && (
        <button type="submit"
          disabled={!canSubmit || formState === "loading"}
          className="w-full rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-neutral-700">
          {formState === "loading" ? "Submitting…" : "Submit Referral"}
        </button>
      )}

    </form>
  );
}
