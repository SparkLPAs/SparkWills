import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { hydrateWizardData } from "@/lib/wizard/schema";

async function loadOwned(projectId: string, userId: string) {
  const project = await prisma.willProject.findUnique({
    where: { id: projectId },
  });
  if (!project || project.userId !== userId) return null;
  return project;
}

// GET /api/projects/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const project = await loadOwned(params.id, user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ project });
}

// PATCH /api/projects/:id — autosave wizard data + derived state
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const project = await loadOwned(params.id, user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = hydrateWizardData(body.data ?? project.data);

  const updated = await prisma.willProject.update({
    where: { id: project.id },
    data: {
      data: data as object,
      title:
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : project.title,
      coupleType: data.coupleType || null,
      lastCompletedStep:
        typeof body.lastCompletedStep === "number"
          ? Math.max(body.lastCompletedStep, project.lastCompletedStep)
          : project.lastCompletedStep,
    },
    select: { id: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt });
}

// DELETE /api/projects/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const project = await loadOwned(params.id, user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.willProject.delete({ where: { id: project.id } });
  return NextResponse.json({ ok: true });
}
