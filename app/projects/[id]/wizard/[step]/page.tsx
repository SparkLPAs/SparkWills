import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hydrateWizardData, WIZARD_SECTIONS } from "@/lib/wizard/schema";
import { WizardShell } from "@/components/wizard/WizardShell";

export default async function WizardStepPage({
  params,
}: {
  params: { id: string; step: string };
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=/projects/${params.id}/wizard/${params.step}`);
  }

  const valid = WIZARD_SECTIONS.some((s) => s.slug === params.step);
  if (!valid) redirect(`/projects/${params.id}/wizard/about`);

  const project = await prisma.willProject.findUnique({
    where: { id: params.id },
  });
  if (!project || project.userId !== user.id) notFound();

  const data = hydrateWizardData(project.data);

  return (
    <WizardShell
      projectId={project.id}
      step={params.step}
      initialData={data}
    />
  );
}
