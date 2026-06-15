"use client";

import type { Person } from "@/lib/wizard/schema";
import { COUPLE_TYPES, type CoupleType } from "@/lib/constants";
import { Field, TextInput, TextArea, Select } from "@/components/wizard/fields";
import type { SectionProps } from "@/components/wizard/sectionTypes";

const COUPLE_LABELS: Record<CoupleType, string> = {
  married: "Married",
  civil_partner: "Civil partners",
  cohabiting: "Cohabiting (living together, not married)",
};

function PersonFields({
  title,
  person,
  onChange,
}: {
  title: string;
  person: Person;
  onChange: (patch: Partial<Person>) => void;
}) {
  return (
    <div className="card p-5">
      <h3 className="font-serif text-lg font-semibold text-navy-800">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Full legal name" hint="Exactly as it should appear on the will.">
          <TextInput
            value={person.fullName}
            onChange={(v) => onChange({ fullName: v })}
            placeholder="e.g. John William Smith"
          />
        </Field>
        <Field label="Date of birth">
          <TextInput
            type="date"
            value={person.dateOfBirth}
            onChange={(v) => onChange({ dateOfBirth: v })}
          />
        </Field>
        <Field label="Occupation">
          <TextInput
            value={person.occupation}
            onChange={(v) => onChange({ occupation: v })}
            placeholder="e.g. Teacher (or Retired)"
          />
        </Field>
        <Field label="Home address" hint="The address used on the will.">
          <TextArea
            value={person.address}
            onChange={(v) => onChange({ address: v })}
            rows={2}
          />
        </Field>
      </div>
    </div>
  );
}

export function AboutSection({ data, update }: SectionProps) {
  const isMirror = data.willType === "mirror";

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-navy-800">
          What would you like to create?
        </legend>
        <label className="flex items-start gap-3 rounded-lg border border-cream-300 bg-cream-50 p-4">
          <input
            type="radio"
            name="willType"
            checked={!isMirror}
            onChange={() => update({ willType: "single" })}
            className="mt-1"
          />
          <span className="text-sm text-navy-800">
            <strong>A single will</strong> — just for me
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-cream-300 bg-cream-50 p-4">
          <input
            type="radio"
            name="willType"
            checked={isMirror}
            onChange={() => update({ willType: "mirror" })}
            className="mt-1"
          />
          <span className="text-sm text-navy-800">
            <strong>Mirror wills</strong> — for me and my partner (two matching wills)
          </span>
        </label>
      </fieldset>

      {isMirror && (
        <Field label="Your relationship">
          <Select<CoupleType>
            value={data.coupleType}
            onChange={(v) => update({ coupleType: v })}
            options={COUPLE_TYPES.map((c) => ({ value: c, label: COUPLE_LABELS[c] }))}
            placeholder="Choose your relationship type"
          />
        </Field>
      )}

      <PersonFields
        title={isMirror ? "About you (Person 1)" : "About you"}
        person={data.person1}
        onChange={(patch) => update({ person1: { ...data.person1, ...patch } })}
      />

      {isMirror && (
        <PersonFields
          title="Your partner (Person 2)"
          person={data.person2}
          onChange={(patch) => update({ person2: { ...data.person2, ...patch } })}
        />
      )}
    </div>
  );
}
