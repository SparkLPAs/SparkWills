import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userCanAccessProject } from "@/lib/payments/check-access";
import { hydrateWizardData } from "@/lib/wizard/schema";
import {
  generateDocument,
  documentsForProject,
  documentLabel,
} from "@/lib/pdf-generation/templates";

function gbDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

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
  const compiledDate = gbDate();
  const zip = new JSZip();

  let n = 1;
  for (const type of documentsForProject(data)) {
    const bytes = await generateDocument(type, { data, compiledDate });
    const name = `${String(n).padStart(2, "0")} ${documentLabel(type, data)}.pdf`;
    zip.file(name, bytes);
    n++;
  }

  const blob = await zip.generateAsync({ type: "uint8array" });
  return new NextResponse(blob as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="PPT-Wills.zip"`,
    },
  });
}
