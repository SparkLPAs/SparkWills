import { prisma } from "@/lib/db/prisma";

/**
 * Whether the user may access the compiled documents for a project.
 * Annual-plan users get all projects; otherwise the specific project must
 * be paid. A project a SparkLegal partner gave away free is marked paid
 * directly at the point that was decided (see app/projects/[id]/payment) —
 * there's no separate standing "free account" flag to check here, since a
 * partner's payment choice can change at any time and shouldn't be cached.
 */
export async function userCanAccessProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  if (user.plan === "annual") {
    const planValid = !user.planExpiresAt || user.planExpiresAt > new Date();
    if (planValid) return true;
  }

  const project = await prisma.willProject.findUnique({
    where: { id: projectId },
  });
  if (!project || project.userId !== userId) return false;

  return project.paymentStatus === "paid";
}
