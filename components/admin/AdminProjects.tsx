"use client";

import { useState } from "react";

export interface AdminProject {
  id: string;
  title: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  userEmail: string;
}

export function AdminProjects({ projects }: { projects: AdminProject[] }) {
  const [rows, setRows] = useState(projects);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setComped(id: string, comped: boolean) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/admin/projects/${id}/comp`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comped }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setRows((r) =>
        r.map((p) =>
          p.id === id ? { ...p, paymentStatus: data.paymentStatus } : p,
        ),
      );
    } else {
      setError(data.error ?? "Could not update that project.");
    }
    setBusy(null);
  }

  if (rows.length === 0) {
    return <p className="text-sm text-navy-500">No projects yet.</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-cream-300">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-left text-navy-700">
            <tr>
              <th className="p-3 font-semibold">Customer</th>
              <th className="p-3 font-semibold">Project</th>
              <th className="p-3 font-semibold">Payment</th>
              <th className="p-3 font-semibold">Free access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="p-3 text-navy-800">{p.userEmail}</td>
                <td className="p-3">
                  <div className="text-navy-800">{p.title}</div>
                  <div className="text-xs text-navy-500">
                    {p.status} · created{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-GB")}
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.paymentStatus === "paid"
                        ? "bg-green-100 text-success"
                        : p.paymentStatus === "comped"
                          ? "bg-amber-100 text-warning"
                          : "bg-cream-200 text-navy-600"
                    }`}
                  >
                    {p.paymentStatus === "comped"
                      ? "Free"
                      : p.paymentStatus === "paid"
                        ? "Paid"
                        : "Unpaid"}
                  </span>
                </td>
                <td className="p-3">
                  {p.paymentStatus === "paid" ? (
                    // Never undo a real payment from here.
                    <span className="text-xs text-navy-500">—</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy === p.id}
                      onClick={() =>
                        setComped(p.id, p.paymentStatus !== "comped")
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        p.paymentStatus === "comped"
                          ? "bg-cream-200 text-navy-600"
                          : "bg-navy-800 text-cream-50"
                      }`}
                    >
                      {busy === p.id
                        ? "…"
                        : p.paymentStatus === "comped"
                          ? "Revoke"
                          : "Grant free"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
