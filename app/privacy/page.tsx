import { DISCLAIMER } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-prose px-6 py-14">
      <h1 className="font-serif text-3xl font-bold text-navy-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-navy-500">Last updated 14 October 2026.</p>

      <div className="mt-6 space-y-4 text-navy-700">
        <p>
          {siteConfig.business.legalName} ({siteConfig.business.name}) is the data
          controller for the personal data described below. This policy covers the
          {" "}{siteConfig.business.name} website and wizard — not any legal advice,
          since we don&apos;t give any (see the disclaimer at the bottom of this page).
        </p>

        <h2 className="font-serif text-xl font-semibold text-navy-900">Data we process</h2>
        <p>
          <strong>Your account</strong> — name, email address and password (stored as a
          secure hash, never in plain text), plus, if you sign in with Google, the
          tokens needed to keep you signed in. If you were referred by one of our
          partners, we also hold a referral code used once, at registration, to check
          your eligibility for partner pricing.
        </p>
        <p>
          <strong>What you enter into the will wizard</strong> — both partners&apos; full
          name, date of birth, address and occupation; the executors and guardians you
          name, with their addresses; specific gifts and who they go to; residuary
          beneficiaries, including their relationship to you, date of birth and share
          of the estate; and any funeral wishes you choose to record. This is the
          information your will is built from, so we need all of it to produce your
          documents.
        </p>
        <p>
          <strong>Payment</strong> — handled entirely by Stripe. We never see or store
          your card details; Stripe holds all PCI scope for payment data. We keep a
          record of your plan and payment status, not your card itself.
        </p>
        <p>
          <strong>If you contact us</strong> — if you submit a consultation or support
          request, we hold the name, email, phone number and message you provide, to
          respond to you.
        </p>
        <p>
          We don&apos;t use cookies or scripts for analytics or advertising — the only
          cookie this site sets is the one that keeps you signed in.
        </p>

        <h2 className="font-serif text-xl font-semibold text-navy-900">How your documents are stored</h2>
        <p>
          Your wizard answers are stored in our database. We don&apos;t keep a permanent
          copy of the generated PDF itself — it&apos;s re-generated from your stored
          answers each time you (or we) need it, and any temporary file created in that
          process is not kept.
        </p>

        <h2 className="font-serif text-xl font-semibold text-navy-900">Why we process it, and who we share it with</h2>
        <p>
          We process your data to provide the service you&apos;ve asked for: building and
          generating your documents, taking payment, and emailing you about your
          account (for example, when your documents are ready, or a periodic reminder
          to review your will). We share data only with the processors who help us run
          the service — our hosting and database provider, our email-sending provider,
          and Stripe for payment — and never sell it or use it for advertising.
        </p>

        <h2 className="font-serif text-xl font-semibold text-navy-900">How long we keep it</h2>
        <p>
          We keep your account and wizard data for as long as your account is open, so
          you can come back and update your documents. You can delete your account
          permanently at any time from account settings — this removes your profile,
          every will project, and any support requests you&apos;ve raised, immediately
          and irreversibly.
        </p>

        <h2 className="font-serif text-xl font-semibold text-navy-900">Your rights</h2>
        <p>
          Under UK GDPR, you have the right to access, correct, or delete the personal
          data we hold about you, and to ask us for a copy of it. You can delete your
          own account and data at any time from account settings, with no need to
          contact us. For anything else — including requesting a copy of your data, or
          any question about this policy — email us at{" "}
          <a href={`mailto:${siteConfig.business.contactEmail}`} className="underline">
            {siteConfig.business.contactEmail}
          </a>
          .
        </p>

        <p className="rounded-md bg-cream-100 p-4 text-sm">{DISCLAIMER}</p>
      </div>
    </article>
  );
}
