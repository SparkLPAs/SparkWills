// Backdates a compiled project's compiledAt by 4 years so it's due for a
// review reminder. Usage: node scripts/backdate-compiled.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const project = await prisma.willProject.findFirst({
  where: { status: { in: ["compiled", "executed", "stored"] } },
  orderBy: { updatedAt: "desc" },
  include: { user: { select: { email: true } } },
});

if (!project) {
  console.log("No compiled project found. Compile one first.");
  process.exit(0);
}

const fourYearsAgo = new Date();
fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

await prisma.willProject.update({
  where: { id: project.id },
  data: { compiledAt: fourYearsAgo, lastReminderAt: null },
});

console.log(
  `Backdated project ${project.id} (owner ${project.user.email}) to compiledAt=${fourYearsAgo.toISOString()}`,
);
await prisma.$disconnect();
