import { getCurrentUser } from "@/lib/auth/session";

/** Returns the current user if they are an admin, otherwise null. */
export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}
