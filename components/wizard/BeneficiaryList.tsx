"use client";

import type { Beneficiary } from "@/lib/wizard/schema";
import { Field, TextInput } from "@/components/wizard/fields";
import { newId } from "@/components/wizard/sectionTypes";

export function BeneficiaryList({
  beneficiaries,
  onChange,
}: {
  beneficiaries: Beneficiary[];
  onChange: (next: Beneficiary[]) => void;
}) {
  function setAt(i: number, patch: Partial<Beneficiary>) {
    onChange(
      beneficiaries.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    );
  }
  function add() {
    onChange([
      ...beneficiaries,
      {
        id: newId(),
        fullName: "",
        relationship: "",
        dateOfBirth: "",
        sharePercentage: 0,
        substituteFor: "",
      },
    ]);
  }
  function removeAt(i: number) {
    onChange(beneficiaries.filter((_, idx) => idx !== i));
  }

  const total = beneficiaries.reduce(
    (sum, b) => sum + (Number(b.sharePercentage) || 0),
    0,
  );

  return (
    <div className="space-y-4">
      {beneficiaries.map((b, i) => (
        <div key={b.id} className="rounded-lg border border-cream-300 bg-cream-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-navy-700">
              Beneficiary {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="text-xs text-navy-500 hover:text-danger"
            >
              Remove
            </button>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput
                value={b.fullName}
                onChange={(v) => setAt(i, { fullName: v })}
              />
            </Field>
            <Field label="Relationship">
              <TextInput
                value={b.relationship}
                onChange={(v) => setAt(i, { relationship: v })}
                placeholder="e.g. son, daughter, niece"
              />
            </Field>
            <Field label="Date of birth" optional hint="Needed if under 18.">
              <TextInput
                type="date"
                value={b.dateOfBirth}
                onChange={(v) => setAt(i, { dateOfBirth: v })}
              />
            </Field>
            <Field label="Share (%)">
              <TextInput
                type="number"
                value={String(b.sharePercentage)}
                onChange={(v) =>
                  setAt(i, { sharePercentage: Number(v) || 0 })
                }
              />
            </Field>
            <Field
              label="Substitute for"
              optional
              hint="If this person inherits only when another beneficiary has died, name that person. Otherwise leave blank."
            >
              <TextInput
                value={b.substituteFor}
                onChange={(v) => setAt(i, { substituteFor: v })}
              />
            </Field>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button type="button" onClick={add} className="btn-secondary">
          + Add beneficiary
        </button>
        <span
          className={`text-sm font-medium ${
            total === 100 ? "text-success" : "text-warning"
          }`}
        >
          Shares total: {total}%{total !== 100 && " (must equal 100%)"}
        </span>
      </div>
    </div>
  );
}
