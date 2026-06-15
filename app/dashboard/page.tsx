import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  const [projects, account] = await Promise.all([
    prisma.willProject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        paymentStatus: true,
        lastCompletedStep: true,
        updatedAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">
            Your wills
          </h1>
          <p className="mt-1 text-navy-700">
            {user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {account?.isAdmin && (
            <Link href="/admin" className="btn-secondary">
              Admin
            </Link>
          )}
          <NewProjectButton />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <h2 className="font-serif text-xl font-semibold text-navy-800">
            You haven&apos;t started any wills yet
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-navy-700">
            Creating a pair of Protective Property Trust Wills takes around 20
            minutes. Your answers save automatically, so you can stop and resume
            any time.
          </p>
          <div className="mt-6 flex justify-center">
            <NewProjectButton label="Start your wills" />
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={{ ...p, updatedAt: p.updatedAt.toISOString() }}
            />
          ))}
        </div>
      )}

      <DisclaimerBanner className="mt-12" />
    </div>
  );
}
