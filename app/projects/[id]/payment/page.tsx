import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userCanAccessProject } from "@/lib/payments/check-access";
import { stripeConfigured } from "@/lib/stripe/stripe-server";
import { getDisplayPrices } from "@/lib/stripe/prices";
import { hydrateWizardData } from "@/lib/wizard/schema";
import { PaymentGate } from "@/components/payments/PaymentGate";

export const metadata = { title: "Unlock your documents" };

export default async function PaymentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=/projects/${params.id}/payment`);

  const project = await prisma.willProject.findUnique({
    where: { id: params.id },
  });
  if (!project || project.userId !== user.id) notFound();

  // Already entitled → straight to download.
  if (await userCanAccessProject(user.id, project.id)) {
    redirect(`/projects/${project.id}/download`);
  }

  const prices = await getDisplayPrices();
  const data = hydrateWizardData(project.data);
  const willType = data.willType === "mirror" ? "mirror" : "single";

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-medium text-navy-600">Stage 4 · Unlock</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-navy-900">
        Unlock your documents
      </h1>
      <p className="mt-3 max-w-prose text-navy-700">
        {willType === "mirror"
          ? "Your mirror wills are ready. Pay once to generate and download both wills, the signing guide, and the storage guide as PDFs."
          : "Your will is ready. Pay once to generate and download your will, the signing guide, and the storage guide as PDFs."}
      </p>

      <div className="mt-8">
        <PaymentGate
          projectId={project.id}
          willType={willType}
          stripeConfigured={stripeConfigured}
          prices={prices}
        />
      </div>
    </div>
  );
}
