import { DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-prose px-6 py-14">
      <h1 className="font-serif text-3xl font-bold text-navy-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-navy-500">Placeholder — to be finalised before launch.</p>

      <div className="mt-6 space-y-4 text-navy-700">
        <p>
          This page will set out, in full and in PECR/UK-GDPR compliant terms, what
          personal data we collect, why, how long we keep it, and your rights —
          including the right to erasure, which removes your account and all stored
          documents.
        </p>
        <h2 className="font-serif text-xl font-semibold text-navy-900">Data we process</h2>
        <p>
          Account details (email), the information you enter into the will wizard,
          and generated documents. Payment is handled by Stripe; we never see or
          store your card details.
        </p>
        <h2 className="font-serif text-xl font-semibold text-navy-900">Your rights</h2>
        <p>
          You can export or delete your data at any time from your account settings.
          Deletion is permanent and removes all stored documents.
        </p>
        <p className="rounded-md bg-cream-100 p-4 text-sm">{DISCLAIMER}</p>
      </div>
    </article>
  );
}
