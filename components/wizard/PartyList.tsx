"use client";

import type { NamedParty } from "@/lib/wizard/schema";
import { Field, TextInput } from "@/components/wizard/fields";
import { newId } from "@/components/wizard/sectionTypes";

/** Editor for a list of named parties (executors, trustees, guardians). */
export function PartyList({
  parties,
  onChange,
  addLabel = "Add another",
  minRecommended = 2,
}: {
  parties: NamedParty[];
  onChange: (next: NamedParty[]) => void;
  addLabel?: string;
  minRecommended?: number;
}) {
  function setAt(i: number, patch: Partial<NamedParty>) {
    onChange(parties.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function add() {
    onChange([...parties, { fullName: "", address: "" }]);
  }
  function removeAt(i: number) {
    onChange(parties.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {parties.map((p, i) => (
        <div key={i} className="rounded-lg border border-cream-300 bg-cream-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-navy-700">
              Person {i + 1}
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
            <Field label="Full legal name">
              <TextInput
                value={p.fullName}
                onChange={(v) => setAt(i, { fullName: v })}
                placeholder="e.g. Margaret Jane Smith"
              />
            </Field>
            <Field label="Address">
              <TextInput
                value={p.address}
                onChange={(v) => setAt(i, { address: v })}
                placeholder="Full postal address"
              />
            </Field>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button type="button" onClick={add} className="btn-secondary">
          + {addLabel}
        </button>
        {parties.length < minRecommended && (
          <span className="text-xs text-warning">
            At least {minRecommended} recommended ({parties.length} so far)
          </span>
        )}
      </div>
    </div>
  );
}

/** Seed helper: ensure the partner is the first party if the list is empty. */
export function seedWithPartner(
  parties: NamedParty[],
  partner: NamedParty,
): NamedParty[] {
  if (parties.length > 0) return parties;
  if (!partner.fullName) return parties;
  return [{ ...partner }];
}

export { newId };
