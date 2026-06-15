import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { stripeConfigured } from "@/lib/stripe/stripe-server";
import { BillingPortalButton } from "@/components/account/BillingPortalButton";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata = { title: "Account settings" };

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  single: "Single project",
  annual: "Unlimited Annual",
};

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account/settings");

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-serif text-3xl font-bold text-navy-900">
        Account settings
      </h1>

      {/* Profile */}
      <section className="card mt-8 p-6">
        <h2 className="font-serif text-lg font-semibold text-navy-800">Profile</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-navy-500">Name</dt>
            <dd className="font-medium text-navy-800">{user.name || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Email</dt>
            <dd className="font-medium text-navy-800">{user.email}</dd>
          </div>
        </dl>
      </section>

      {/* Plan & billing */}
      <section className="card mt-6 p-6">
        <h2 className="font-serif text-lg font-semibold text-navy-800">
          Plan &amp; billing
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-navy-500">Current plan</dt>
            <dd className="font-medium text-navy-800">
              {PLAN_LABELS[user.plan] ?? user.plan}
            </dd>
          </div>
          {user.planExpiresAt && (
            <div className="flex justify-between">
              <dt className="text-navy-500">Renews / expires</dt>
              <dd className="font-medium text-navy-800">
                {new Date(user.planExpiresAt).toLocaleDateString("en-GB")}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-4">
          <BillingPortalButton
            enabled={stripeConfigured && user.plan === "annual"}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section className="card mt-6 p-6">
        <h2 className="font-serif text-lg font-semibold text-navy-800">
          Delete account
        </h2>
        <p className="mt-2 text-sm text-navy-600">
          Under data-protection law you can delete your account and all associated
          data at any time. This removes your profile, every will project, and all
          stored documents permanently.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>

      <DisclaimerBanner className="mt-8" />

      <div className="mt-8">
        <Link href="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
