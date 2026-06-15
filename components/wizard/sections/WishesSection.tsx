"use client";

import { Field, TextArea } from "@/components/wizard/fields";
import type { SectionProps } from "@/components/wizard/sectionTypes";

export function WishesSection({ data, update }: SectionProps) {
  const isMirror = data.willType === "mirror";
  const p1Name = data.person1.fullName || "You";
  const p2Name = data.person2.fullName || "Your partner";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-cream-300 bg-cream-50 p-4 text-sm text-navy-700">
        Funeral wishes are a <strong>non-binding</strong> expression of preference
        — your executors are not legally obliged to follow them, but they offer
        helpful guidance. This section is entirely optional.
      </div>

      <Field label={isMirror ? `${p1Name}'s funeral wishes` : "Your funeral wishes"} optional>
        <TextArea
          value={data.funeralWishesP1}
          onChange={(v) => update({ funeralWishesP1: v })}
          rows={4}
          placeholder="e.g. Burial / cremation, any specific requests…"
        />
      </Field>

      {isMirror && (
        <Field label={`${p2Name}'s funeral wishes`} optional>
          <TextArea
            value={data.funeralWishesP2}
            onChange={(v) => update({ funeralWishesP2: v })}
            rows={4}
            placeholder="e.g. Burial / cremation, any specific requests…"
          />
        </Field>
      )}
    </div>
  );
}
