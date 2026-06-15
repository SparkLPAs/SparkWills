// Verifies GDPR erasure cascade: deleting a User removes their projects,
// generated documents, and consultation requests.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const u = await prisma.user.create({
  data: { email: `throwaway-${Date.now()}@example.com`, plan: "free" },
});
const p = await prisma.willProject.create({
  data: { userId: u.id, status: "compiled", data: {} },
});
await prisma.generatedDocument.create({
  data: { projectId: p.id, type: "will_p1", version: 1, storageKey: "x/y.pdf" },
});
await prisma.consultationRequest.create({
  data: { name: "T", email: u.email, userId: u.id },
});

const before = {
  projects: await prisma.willProject.count({ where: { userId: u.id } }),
  docs: await prisma.generatedDocument.count({ where: { projectId: p.id } }),
  enquiries: await prisma.consultationRequest.count({ where: { userId: u.id } }),
};

// Mirror the API: clear consultation enquiries, then cascade-delete the user.
await prisma.consultationRequest.deleteMany({ where: { userId: u.id } });
await prisma.user.delete({ where: { id: u.id } });

const after = {
  user: await prisma.user.count({ where: { id: u.id } }),
  projects: await prisma.willProject.count({ where: { id: p.id } }),
  docs: await prisma.generatedDocument.count({ where: { projectId: p.id } }),
  enquiries: await prisma.consultationRequest.count({ where: { userId: u.id } }),
};

console.log("BEFORE:", before);
console.log("AFTER :", after);
const ok =
  after.user === 0 &&
  after.projects === 0 &&
  after.docs === 0 &&
  after.enquiries === 0;
console.log(ok ? "PASS — full erasure" : "FAIL — residual data remains");
await prisma.$disconnect();
