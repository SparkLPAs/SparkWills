import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userCanAccessProject } from "@/lib/payments/check-access";
import { hydrateWizardData } from "@/lib/wizard/schema";
import {
  generateDocument,
  documentsForProject,
  documentLabel,
} from "@/lib/pdf-generation/templates";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/constants";

function gbDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; type: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  if (!DOCUMENT_TYPES.includes(params.type as DocumentType)) {
    return NextResponse.json({ error: "Unknown document" }, { status: 404 });
  }
  const type = params.type as DocumentType;

  if (!(await userCanAccessProject(user.id, params.id))) {
    return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }

  const project = await prisma.willProject.findUnique({
    where: { id: params.id },
  });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = hydrateWizardData(project.data);
  if (!documentsForProject(data).includes(type)) {
    return NextResponse.json(
      { error: "Document not applicable to this project" },
      { status: 404 },
    );
  }

  const bytes = await generateDocument(type, { data, compiledDate: gbDate() });
  const filename = `${documentLabel(type, data).replace(/[^a-z0-9]+/gi, "-")}.pdf`;

  return new NextResponse(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
