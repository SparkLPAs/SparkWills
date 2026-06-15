import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { AdminLeads } from "@/components/admin/AdminLeads";

export const metadata = { title: "Admin" };

// List-price estimate only — actual revenue lives in Stripe.
const SINGLE_PRICE = 39;
const ANNUAL_PRICE = 79;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-500">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-bold text-navy-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-navy-500">{sub}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?callbackUrl=/admin");
  const admin = await getAdminUser();
  if (!admin) notFound(); // don't reveal the route to non-admins

  const [
    totalUsers,
    annualUsers,
    singleUsers,
    totalProjects,
    paidProjects,
    compiledProjects,
    totalLeads,
    openLeads,
    recentUsers,
    leads,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "annual" } }),
    prisma.user.count({ where: { plan: "single" } }),
    prisma.willProject.count(),
    prisma.willProject.count({ where: { paymentStatus: "paid" } }),
    prisma.willProject.count({
      where: { status: { in: ["compiled", "executed", "stored"] } },
    }),
    prisma.consultationRequest.count(),
    prisma.consultationRequest.count({ where: { handled: false } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    }),
    prisma.consultationRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const estRevenue =
    paidProjects * SINGLE_PRICE + annualUsers * ANNUAL_PRICE;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-navy-900">Admin</h1>
        <Link href="/dashboard" className="btn-secondary">
          My dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={String(totalUsers)} sub={`${annualUsers} annual · ${singleUsers} single`} />
        <StatCard label="Projects" value={String(totalProjects)} sub={`${compiledProjects} compiled`} />
        <StatCard label="Paid projects" value={String(paidProjects)} />
        <StatCard
          label="Est. revenue"
          value={`£${estRevenue.toLocaleString("en-GB")}`}
          sub="list-price estimate"
        />
      </div>

      {/* Recent users */}
      <h2 className="mt-12 font-serif text-xl font-semibold text-navy-900">
        Recent users
      </h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-cream-300">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-left text-navy-700">
            <tr>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Plan</th>
              <th className="p-3 font-semibold">Projects</th>
              <th className="p-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td className="p-3 text-navy-800">
                  {u.email}
                  {u.isAdmin && (
                    <span className="ml-2 rounded bg-navy-800 px-1.5 py-0.5 text-[10px] font-semibold text-cream-50">
                      ADMIN
                    </span>
                  )}
                </td>
                <td className="p-3 capitalize text-navy-700">{u.plan}</td>
                <td className="p-3 text-navy-700">{u._count.projects}</td>
                <td className="p-3 text-navy-600">
                  {new Date(u.createdAt).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consultation leads */}
      <div className="mt-12 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-navy-900">
          Consultation leads
        </h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-warning">
          {openLeads} open of {totalLeads}
        </span>
      </div>
      <div className="mt-4">
        <AdminLeads
          leads={leads.map((l) => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
