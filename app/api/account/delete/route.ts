import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteProjectObjects } from "@/lib/storage/local-storage";

/**
 * GDPR right to erasure — permanently deletes the user, all their projects and
 * generated documents (DB cascade), their stored document files, and any
 * consultation requests linked to them.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Remove stored document files for each project.
  const projects = await prisma.willProject.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  for (const p of projects) {
    await deleteProjectObjects(p.id);
  }

  // Detach/clear consultation enquiries linked to this user.
  await prisma.consultationRequest.deleteMany({ where: { userId: user.id } });

  // Cascade deletes projects, documents, accounts, and sessions.
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
