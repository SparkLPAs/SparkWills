"use client";

import { Field, TextInput, InfoBox } from "@/components/wizard/fields";
import { newId } from "@/components/wizard/sectionTypes";
import type { SectionProps } from "@/components/wizard/sectionTypes";

export function EstateSection({ data, update }: SectionProps) {
  function setAt(i: number, patch: { item?: string; recipient?: string }) {
    update({
      bequests: data.bequests.map((b, idx) =>
        idx === i ? { ...b, ...patch } : b,
      ),
    });
  }
  function add() {
    update({
      bequests: [...data.bequests, { id: newId(), item: "", recipient: "" }],
    });
  }
  function removeAt(i: number) {
    update({ bequests: data.bequests.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-6">
      <InfoBox term="What are specific gifts?">
        Specific gifts are particular items or sums of money you want to leave to
        named people — for example a piece of jewellery, a keepsake, or a fixed
        amount. Everything else (your &ldquo;residuary estate&rdquo;) is handled
        in the next step. This section is optional.
      </InfoBox>

      <section>
        <h3 className="font-serif text-lg font-semibold text-navy-800">
          Specific gifts (optional)
        </h3>
        <p className="mt-1 text-sm text-navy-600">
          Add any particular items or sums you want to leave to named people.
          Leave empty if you have none.
        </p>
        <div className="mt-4 space-y-4">
          {data.bequests.map((b, i) => (
            <div
              key={b.id}
              className="rounded-lg border border-cream-300 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy-700">
                  Gift {i + 1}
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
                <Field label="Item or amount">
                  <TextInput
                    value={b.item}
                    onChange={(v) => setAt(i, { item: v })}
                    placeholder="e.g. My wedding ring / £1,000"
                  />
                </Field>
                <Field label="To whom">
                  <TextInput
                    value={b.recipient}
                    onChange={(v) => setAt(i, { recipient: v })}
                    placeholder="Full name"
                  />
                </Field>
              </div>
            </div>
          ))}
          <button type="button" onClick={add} className="btn-secondary">
            + Add a specific gift
          </button>
        </div>
      </section>
    </div>
  );
}
