// Grant admin access to a user. Usage: node scripts/set-admin.mjs [email]
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const email = (process.argv[2] || "jason@example.com").toLowerCase();
const user = await prisma.user.update({
  where: { email },
  data: { isAdmin: true },
}).catch(() => null);

console.log(user ? `${email} is now an admin.` : `User ${email} not found.`);
await prisma.$disconnect();
