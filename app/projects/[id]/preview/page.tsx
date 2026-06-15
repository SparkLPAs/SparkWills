import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hydrateWizardData } from "@/lib/wizard/schema";
import { summariseChecks } from "@/lib/validation/document-checks";
import { documentsForProject, documentLabel } from "@/lib/pdf-generation/templates";
import { siteConfig } from "@/config/site.config";
import { ProofPanel } from "@/components/proof/ProofPanel";

export const metadata = { title: "Review & unlock" };

export default async function PreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=/projects/${params.id}/preview`);

  const project = await prisma.willProject.findUnique({
    where: { id: params.id },
  });
  if (!project || project.userId !== user.id) notFound();

  const data = hydrateWizardData(project.data);
  const summary = summariseChecks(data);

  // Only the document LABELS are sent to the browser pre-payment — never the
  // document content (that would let someone copy it without paying).
  const documents = documentsForProject(data).map((t) => documentLabel(t, data));
  const price =
    data.willType === "mirror"
      ? siteConfig.pricing.mirror.price
      : siteConfig.pricing.single.price;

  return (
    <ProofPanel
      projectId={project.id}
      summary={summary}
      documents={documents}
      price={price}
    />
  );
}
