import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { blankWizardData } from "@/lib/wizard/schema";

// GET /api/projects — list the current user's projects
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const projects = await prisma.willProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      paymentStatus: true,
      lastCompletedStep: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ projects });
}

// POST /api/projects — create a new draft project
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "Our Protective Property Trust Wills";

  const project = await prisma.willProject.create({
    data: {
      userId: user.id,
      title,
      status: "draft",
      data: blankWizardData() as object,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: project.id }, { status: 201 });
}
