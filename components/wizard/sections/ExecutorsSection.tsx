"use client";

import { PartyList } from "@/components/wizard/PartyList";
import { Field, Select, InfoBox } from "@/components/wizard/fields";
import type { SectionProps } from "@/components/wizard/sectionTypes";
import { siteConfig } from "@/config/site.config";

export function ExecutorsSection({ data, update }: SectionProps) {
  const isMirror = data.willType === "mirror";
  const p1Name = data.person1.fullName || "You";
  const p2Name = data.person2.fullName || "Your partner";
  const rec = siteConfig.executors.recommendedExecutor;
  const useRecommended = data.executorChoice === "recommended";

  function seedPartner(which: "executorsP1" | "executorsP2") {
    const partner = which === "executorsP1" ? data.person2 : data.person1;
    if (!partner.fullName) return;
    update({
      [which]: [
        { fullName: partner.fullName, address: partner.address },
        ...data[which],
      ],
    } as Partial<typeof data>);
  }

  return (
    <div className="space-y-8">
      <InfoBox term="What is an executor?">
        <p className="mb-2">
          Your executors are the people (or professionals) you appoint to handle
          your affairs after your death — settling bills and taxes, and
          distributing your estate to your beneficiaries.
        </p>
        <p>
          We recommend at least two executors per will. Many people appoint a
          professional executor to take the burden off their family.
        </p>
      </InfoBox>

      {rec.enabled && (
        <Field label="How would you like to appoint your executors?">
          <Select<"recommended" | "own">
            value={data.executorChoice}
            onChange={(v) => update({ executorChoice: v })}
            options={[
              { value: "recommended", label: `Use ${rec.name}` },
              { value: "own", label: "Appoint our own executors" },
            ]}
            placeholder="Choose an option"
          />
        </Field>
      )}

      {rec.enabled && useRecommended ? (
        <section className="rounded-lg border border-navy-200 bg-cream-50 p-6">
          <h3 className="font-serif text-lg font-semibold text-navy-800">
            {rec.name}
          </h3>
          <p className="mt-2 text-sm text-navy-700">{rec.blurb}</p>
          <ul className="mt-4 space-y-2">
            {rec.benefits.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm text-navy-700">
                <span className="text-success">✓</span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-md bg-white p-3 text-xs text-navy-600">
            {rec.name} will be appointed as the professional executor
            {isMirror ? " of both wills" : ""}. You can change this to your own
            executors at any time using the dropdown above.
          </p>
        </section>
      ) : (
        <>
          <section>
            <h3 className="font-serif text-lg font-semibold text-navy-800">
              {isMirror ? `Executors of ${p1Name}'s will` : "Your executors"}
            </h3>
            {isMirror && (
              <>
                <p className="mt-1 text-sm text-navy-600">
                  Usually {p2Name} plus a reserve.
                </p>
                <button
                  type="button"
                  onClick={() => seedPartner("executorsP1")}
                  className="btn-secondary mt-3 text-xs"
                >
                  + Add {p2Name} as primary executor
                </button>
              </>
            )}
            <div className="mt-4">
              <PartyList
                parties={data.executorsP1}
                onChange={(next) => update({ executorsP1: next })}
              />
            </div>
          </section>

          {isMirror && (
            <section>
              <h3 className="font-serif text-lg font-semibold text-navy-800">
                Executors of {p2Name}&apos;s will
              </h3>
              <p className="mt-1 text-sm text-navy-600">
                Usually {p1Name} plus a reserve.
              </p>
              <button
                type="button"
                onClick={() => seedPartner("executorsP2")}
                className="btn-secondary mt-3 text-xs"
              >
                + Add {p1Name} as primary executor
              </button>
              <div className="mt-4">
                <PartyList
                  parties={data.executorsP2}
                  onChange={(next) => update({ executorsP2: next })}
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
