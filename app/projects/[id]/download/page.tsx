import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userCanAccessProject } from "@/lib/payments/check-access";
import { hydrateWizardData } from "@/lib/wizard/schema";
import { documentsForProject, documentLabel } from "@/lib/pdf-generation/templates";
import { compileProject } from "@/lib/documents/compile";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { siteConfig } from "@/config/site.config";
import { getStripe, stripeConfigured } from "@/lib/stripe/stripe-server";

export const metadata = { title: "Download your wills" };

export default async function DownloadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { session_id?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=/projects/${params.id}/download`);

  let project = await prisma.willProject.findUnique({
    where: { id: params.id },
  });
  if (!project || project.userId !== user.id) notFound();

  // Returning from Stripe Checkout: verify the session and mark the order paid
  // (a safety net alongside the webhook, so the success redirect is self-sufficient).
  if (
    searchParams.session_id &&
    stripeConfigured &&
    project.paymentStatus !== "paid"
  ) {
    try {
      const s = await getStripe().checkout.sessions.retrieve(
        searchParams.session_id,
      );
      const paid = s.payment_status === "paid" || s.status === "complete";
      if (paid && s.metadata?.projectId === project.id) {
        project = await prisma.willProject.update({
          where: { id: project.id },
          data: {
            paymentStatus: "paid",
            stripeSessionId: s.id,
            storageRequested: s.metadata?.storageRequested === "true",
          },
        });
      }
    } catch {
      // ignore — fall through to the access check below
    }
  }

  if (!(await userCanAccessProject(user.id, project.id))) {
    redirect(`/projects/${project.id}/payment`);
  }

  // Compile (persist versioned documents) the first time, or if data changed since.
  if (project.status !== "compiled" && project.status !== "executed" && project.status !== "stored") {
    await compileProject(project.id);
  }

  const data = hydrateWizardData(project.data);
  const types = documentsForProject(data);
  const base = `/api/projects/${project.id}/documents`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-medium text-success">✓ Payment complete</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-navy-900">
        Your documents are ready
      </h1>
      <p className="mt-3 max-w-prose text-navy-700">
        Download everything as a ZIP, or open each document individually. Print
        each will single-sided on white A4 paper, then follow the Signing Guide.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href={`${base}/zip`} className="btn-primary">
          Download all (ZIP)
        </a>
        <Link href={`/projects/${project.id}/signing`} className="btn-secondary">
          Signing guide
        </Link>
        <Link href={`/projects/${project.id}/storage`} className="btn-secondary">
          Storage guide
        </Link>
      </div>

      <ul className="mt-8 divide-y divide-cream-200 rounded-xl border border-cream-300 bg-white">
        {types.map((type) => (
          <li key={type} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-cream-200 text-xs font-semibold text-navy-700">
                PDF
              </span>
              <span className="text-sm font-medium text-navy-800">
                {documentLabel(type, data)}
              </span>
            </div>
            <a
              href={`${base}/${type}`}
              target="_blank"
              rel="noopener"
              className="text-sm font-semibold text-navy-700 underline"
            >
              Open
            </a>
          </li>
        ))}
      </ul>

      {project.storageRequested && siteConfig.storage.enabled && (
        <div className="mt-8 rounded-xl border border-navy-200 bg-cream-50 p-6">
          <h2 className="font-serif text-lg font-semibold text-navy-800">
            {siteConfig.storage.label} — where to post your signed will
          </h2>
          <p className="mt-2 text-sm text-navy-700">
            {siteConfig.storage.instructions}
          </p>
          <div className="mt-4 rounded-md border border-cream-300 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Post your signed original to
            </p>
            <p className="mt-1 whitespace-pre-line font-medium text-navy-800">
              {siteConfig.storage.postalAddress}
            </p>
          </div>
          <p className="mt-3 text-xs text-navy-500">
            Send the <strong>original</strong> (not a copy) by a tracked or
            signed-for service, and keep your proof of postage.
          </p>
        </div>
      )}

      <DisclaimerBanner className="mt-8" />

      <div className="mt-8">
        <Link href="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
