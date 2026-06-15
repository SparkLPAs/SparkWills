import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const rows = await prisma.consultationRequest.findMany({
  orderBy: { createdAt: "desc" },
});
console.log(`${rows.length} consultation request(s):`);
for (const r of rows) {
  console.log(`- ${r.name} <${r.email}> | source=${r.source} | handled=${r.handled} | ${r.message ?? ""}`);
}
await prisma.$disconnect();
