"use client";

import { BeneficiaryList } from "@/components/wizard/BeneficiaryList";
import { Field, Select, Checkbox, InfoBox } from "@/components/wizard/fields";
import type { SectionProps } from "@/components/wizard/sectionTypes";

export function ResidueSection({ data, update }: SectionProps) {
  const isMirror = data.willType === "mirror";
  const partnerName = data.person2.fullName || "your partner";

  return (
    <div className="space-y-8">
      <InfoBox term="What is the residuary estate?">
        Your residuary estate is everything you own after any specific gifts,
        debts, and expenses — your savings, possessions, property, and so on. This
        is where you say who should ultimately inherit it.
      </InfoBox>

      {isMirror && (
        <section className="space-y-3">
          <Checkbox
            checked={data.residueToPartner}
            onChange={(v) => update({ residueToPartner: v })}
            label={`Leave everything to ${partnerName} first`}
            hint="The usual choice for couples: each of you leaves everything to the other, and only if they have already died does it pass to the beneficiaries below."
          />
          {data.residueToPartner && (
            <Field
              label="Survivorship period (days)"
              hint="Your partner must survive you by this many days to inherit. 30 is standard."
            >
              <Select<string>
                value={String(data.survivorshipDays)}
                onChange={(v) => update({ survivorshipDays: Number(v) })}
                options={[
                  { value: "28", label: "28 days" },
                  { value: "30", label: "30 days (standard)" },
                  { value: "0", label: "No survivorship period" },
                ]}
              />
            </Field>
          )}
        </section>
      )}

      <section>
        <h3 className="font-serif text-lg font-semibold text-navy-800">
          {isMirror && data.residueToPartner
            ? "If you both die — who inherits?"
            : "Who inherits your estate?"}
        </h3>
        <p className="mt-1 text-sm text-navy-600">
          Name your beneficiaries and their shares. Shares must total 100%.
        </p>
        <div className="mt-4">
          <BeneficiaryList
            beneficiaries={data.beneficiaries}
            onChange={(next) => update({ beneficiaries: next })}
          />
        </div>
      </section>

      <Field
        label="Age at which beneficiaries inherit"
        hint="If any beneficiary is under 18, their share is held by your executors until they reach this age."
      >
        <Select<string>
          value={String(data.vestingAge)}
          onChange={(v) => update({ vestingAge: Number(v) })}
          options={[
            { value: "18", label: "18 (default)" },
            { value: "21", label: "21" },
            { value: "25", label: "25" },
          ]}
        />
      </Field>
    </div>
  );
}
