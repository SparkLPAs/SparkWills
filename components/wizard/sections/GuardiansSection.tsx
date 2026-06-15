"use client";

import { PartyList } from "@/components/wizard/PartyList";
import { Checkbox, InfoBox } from "@/components/wizard/fields";
import type { SectionProps } from "@/components/wizard/sectionTypes";

export function GuardiansSection({ data, update }: SectionProps) {
  return (
    <div className="space-y-6">
      <InfoBox term="When do I need a guardian?">
        If you have children under 18, you can appoint a guardian to care for them
        if both parents die. If your children are all adults, you can skip this
        section.
      </InfoBox>

      <Checkbox
        checked={data.hasMinorChildren}
        onChange={(v) => update({ hasMinorChildren: v })}
        label="We have one or more children under 18"
      />

      {data.hasMinorChildren && (
        <section>
          <h3 className="font-serif text-lg font-semibold text-navy-800">
            Appoint guardian(s)
          </h3>
          <p className="mt-1 text-sm text-navy-600">
            Name the person (or people) you would want to look after your minor
            children. Discuss it with them first.
          </p>
          <div className="mt-4">
            <PartyList
              parties={data.guardians}
              onChange={(next) => update({ guardians: next })}
              addLabel="Add guardian"
              minRecommended={1}
            />
          </div>
        </section>
      )}
    </div>
  );
}
