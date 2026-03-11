import ReferralForm from "@/components/ReferralForm";

export default function ReferralsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Submit a Referral</h1>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Use this form to refer a client to another West Midlands organisation.
        All referrals require explicit client consent and follow UK GDPR data
        minimisation principles.
      </p>
      <div className="mt-8">
        <ReferralForm />
      </div>
    </main>
  );
}
