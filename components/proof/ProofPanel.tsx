"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProofSummary } from "@/lib/validation/document-checks";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

const MANUAL_CHECKLIST = [
  "The details I've entered are correct.",
  "I understand my witnesses must not be beneficiaries (or their spouses).",
  "I understand this is legal information, not legal advice, and an expert review is recommended.",
];

export function ProofPanel({
  projectId,
  summary,
  documents,
  price,
}: {
  projectId: string;
  summary: ProofSummary;
  /** Labels of the documents the customer will receive (no content). */
  documents: string[];
  /** Price for this project (single vs mirror), e.g. "£39". */
  price: string;
}) {
  const [ticked, setTicked] = useState<boolean[]>(
    MANUAL_CHECKLIST.map(() => false),
  );
  const allTicked = ticked.every(Boolean);
  const canProceed = summary.canCompile && allTicked;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm font-medium text-navy-600">Stage 3 · Review &amp; unlock</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-navy-900">
        Review &amp; unlock your documents
      </h1>

      {/* Completeness */}
      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif text-lg font-semibold text-navy-800">
              {summary.completeness}% complete
            </p>
            <p className="text-sm text-navy-600">
              {summary.redFailures.length === 0
                ? "All required checks pass — you're ready to unlock."
                : `${summary.redFailures.length} item${summary.redFailures.length > 1 ? "s" : ""} need attention first.`}
            </p>
          </div>
          <div className="h-14 w-14 shrink-0">
            <CompletenessRing pct={summary.completeness} />
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-cream-200">
          <div
            className={`h-full rounded-full transition-all ${
              summary.canCompile ? "bg-success" : "bg-warning"
            }`}
            style={{ width: `${summary.completeness}%` }}
          />
        </div>
      </div>

      {/* Red failures */}
      {summary.redFailures.length > 0 && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-red-50/60 p-5">
          <h2 className="font-semibold text-danger">Must fix first</h2>
          <ul className="mt-3 space-y-2">
            {summary.redFailures.map((c) => (
              <li key={c.id} className="text-sm text-navy-800">
                <span className="font-medium">{c.label}.</span>{" "}
                <span className="text-navy-600">{c.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Amber warnings */}
      {summary.amberFailures.length > 0 && (
        <div className="mt-6 rounded-lg border border-warning/30 bg-amber-50/60 p-5">
          <h2 className="font-semibold text-warning">Worth checking</h2>
          <ul className="mt-3 space-y-2">
            {summary.amberFailures.map((c) => (
              <li key={c.id} className="text-sm text-navy-800">
                <span className="font-medium">{c.label}.</span>{" "}
                <span className="text-navy-600">{c.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Locked documents */}
      <h2 className="mt-10 font-serif text-2xl font-semibold text-navy-900">
        Your documents are ready
      </h2>
      <p className="mt-1 text-sm text-navy-600">
        Everything below is prepared and waiting. Unlock to view and download your
        full documents as PDFs.
      </p>
      <ul className="mt-6 divide-y divide-cream-200 rounded-xl border border-cream-300 bg-white">
        {documents.map((label) => (
          <li key={label} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-cream-200 text-xs font-semibold text-navy-700">
                PDF
              </span>
              <span className="text-sm font-medium text-navy-800">{label}</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-navy-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
              </svg>
              Locked
            </span>
          </li>
        ))}
      </ul>

      <DisclaimerBanner className="mt-8" />

      {/* Manual checklist */}
      <div className="card mt-8 p-6">
        <h2 className="font-serif text-lg font-semibold text-navy-800">
          Before you unlock
        </h2>
        <div className="mt-4 space-y-3">
          {MANUAL_CHECKLIST.map((item, i) => (
            <label key={i} className="flex items-start gap-3 text-sm text-navy-800">
              <input
                type="checkbox"
                checked={ticked[i]}
                onChange={(e) =>
                  setTicked((t) =>
                    t.map((v, idx) => (idx === i ? e.target.checked : v)),
                  )
                }
                className="mt-1 h-4 w-4 rounded border-navy-300 text-navy-800 focus:ring-navy-500"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cream-300 pt-6">
        <Link href={`/projects/${projectId}/wizard/review`} className="btn-secondary">
          Back to wizard
        </Link>
        {canProceed ? (
          <Link href={`/projects/${projectId}/payment`} className="btn-primary">
            Unlock your documents — {price}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="btn-primary"
            title={
              summary.canCompile
                ? "Tick the checklist to continue"
                : "Fix the required items first"
            }
          >
            Unlock your documents — {price}
          </button>
        )}
      </div>
    </div>
  );
}

function CompletenessRing({ pct }: { pct: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#f3ede0" strokeWidth="6" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={pct === 100 ? "#2f855a" : "#b7791f"}
        strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
