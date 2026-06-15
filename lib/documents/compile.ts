import { prisma } from "@/lib/db/prisma";
import { hydrateWizardData } from "@/lib/wizard/schema";
import {
  generateDocument,
  documentsForProject,
  documentLabel,
} from "@/lib/pdf-generation/templates";
import { putObject } from "@/lib/storage/local-storage";
import type { DocumentType } from "@/lib/constants";

function gbDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Generate every document for a project, store a copy, and record versioned
 * GeneratedDocument rows. Sets project.status to "compiled".
 */
export async function compileProject(projectId: string) {
  const project = await prisma.willProject.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("Project not found");

  const data = hydrateWizardData(project.data);
  const compiledDate = gbDate(new Date());
  const types = documentsForProject(data);

  // Next version number (one batch per compile).
  const lastDoc = await prisma.generatedDocument.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  const version = (lastDoc?.version ?? 0) + 1;

  // Replace previous records with this fresh batch.
  await prisma.generatedDocument.deleteMany({ where: { projectId } });

  for (const type of types) {
    const bytes = await generateDocument(type as DocumentType, {
      data,
      compiledDate,
    });
    const key = `${projectId}/v${version}/${type}.pdf`;
    const { checksum } = await putObject(key, bytes);
    await prisma.generatedDocument.create({
      data: {
        projectId,
        type,
        version,
        storageKey: key,
        checksum,
        isDraft: false,
      },
    });
  }

  await prisma.willProject.update({
    where: { id: projectId },
    data: { status: "compiled", compiledAt: new Date() },
  });

  return { version, types, compiledDate };
}

export { documentLabel };
