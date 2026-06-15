import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

/** The authenticated session user (id + email), or null. */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session.user : null;
}

/** The full User record for the authenticated user, or null. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
