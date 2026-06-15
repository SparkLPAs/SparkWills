"use client";

import { useState } from "react";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string | null;
  handled: boolean;
  createdAt: string;
}

export function AdminLeads({ leads }: { leads: Lead[] }) {
  const [rows, setRows] = useState(leads);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(id: string, handled: boolean) {
    setBusy(id);
    const res = await fetch(`/api/admin/consultations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled }),
    });
    if (res.ok) {
      setRows((r) => r.map((l) => (l.id === id ? { ...l, handled } : l)));
    }
    setBusy(null);
  }

  if (rows.length === 0) {
    return <p className="text-sm text-navy-500">No consultation requests yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-cream-300">
      <table className="w-full text-sm">
        <thead className="bg-cream-100 text-left text-navy-700">
          <tr>
            <th className="p-3 font-semibold">Name</th>
            <th className="p-3 font-semibold">Contact</th>
            <th className="p-3 font-semibold">Source</th>
            <th className="p-3 font-semibold">Message</th>
            <th className="p-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {rows.map((l) => (
            <tr key={l.id} className={l.handled ? "opacity-60" : ""}>
              <td className="p-3">
                <div className="font-medium text-navy-800">{l.name}</div>
                <div className="text-xs text-navy-500">
                  {new Date(l.createdAt).toLocaleDateString("en-GB")}
                </div>
              </td>
              <td className="p-3 text-navy-700">
                <div>{l.email}</div>
                {l.phone && <div className="text-xs text-navy-500">{l.phone}</div>}
              </td>
              <td className="p-3 text-navy-600">{l.source ?? "—"}</td>
              <td className="max-w-[16rem] p-3 text-navy-600">
                {l.message ?? "—"}
              </td>
              <td className="p-3">
                <button
                  type="button"
                  disabled={busy === l.id}
                  onClick={() => toggle(l.id, !l.handled)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    l.handled
                      ? "bg-cream-200 text-navy-600"
                      : "bg-navy-800 text-cream-50"
                  }`}
                >
                  {busy === l.id
                    ? "…"
                    : l.handled
                      ? "Handled — reopen"
                      : "Mark handled"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
