"use client";

import Link from "next/link";
import { Checkbox } from "@/components/wizard/fields";
import type { SectionProps } from "@/components/wizard/sectionTypes";
import { siteConfig } from "@/config/site.config";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-navy-500">{label}</span>
      <span className="text-right font-medium text-navy-800">
        {value || <span className="text-danger">—</span>}
      </span>
    </div>
  );
}

function Block({
  title,
  slug,
  projectId,
  children,
}: {
  title: string;
  slug: string;
  projectId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-base font-semibold text-navy-800">
          {title}
        </h3>
        <Link
          href={`/projects/${projectId}/wizard/${slug}`}
          className="text-xs font-medium text-navy-600 underline"
        >
          Edit
        </Link>
      </div>
      <div className="mt-2 divide-y divide-cream-200">{children}</div>
    </div>
  );
}

export function ReviewSection({ data, update, projectId }: SectionProps) {
  const isMirror = data.willType === "mirror";
  const recommended =
    data.executorChoice === "recommended" &&
    siteConfig.executors.recommendedExecutor.enabled;
  const sharesTotal = data.beneficiaries.reduce(
    (s, b) => s + (Number(b.sharePercentage) || 0),
    0,
  );

  return (
    <div className="space-y-5">
      <p className="text-navy-700">
        Check everything below carefully. Use the <strong>Edit</strong> links to
        make changes, then confirm accuracy and continue.
      </p>

      <Block title="About you" slug="about" projectId={projectId}>
        <Row
          label="Type"
          value={isMirror ? "Mirror wills (couple)" : "Single will"}
        />
        <Row label="You" value={data.person1.fullName} />
        {isMirror && <Row label="Partner" value={data.person2.fullName} />}
      </Block>

      <Block title="Executors" slug="executors" projectId={projectId}>
        {recommended ? (
          <Row
            label="Professional executor"
            value={siteConfig.executors.recommendedExecutor.name}
          />
        ) : (
          <>
            <Row
              label={isMirror ? "Your will" : "Executors"}
              value={data.executorsP1.map((e) => e.fullName).filter(Boolean).join(", ")}
            />
            {isMirror && (
              <Row
                label="Partner's will"
                value={data.executorsP2.map((e) => e.fullName).filter(Boolean).join(", ")}
              />
            )}
          </>
        )}
      </Block>

      <Block title="Who inherits" slug="residue" projectId={projectId}>
        {isMirror && (
          <Row
            label="To partner first"
            value={data.residueToPartner ? "Yes" : "No"}
          />
        )}
        <Row
          label="Beneficiaries"
          value={data.beneficiaries
            .filter((b) => b.fullName)
            .map((b) => `${b.fullName} (${b.sharePercentage}%)`)
            .join(", ")}
        />
        <Row
          label="Shares total"
          value={
            <span className={sharesTotal === 100 ? "text-success" : "text-danger"}>
              {sharesTotal}%
            </span>
          }
        />
      </Block>

      <Block title="Guardians" slug="guardians" projectId={projectId}>
        <Row label="Minor children" value={data.hasMinorChildren ? "Yes" : "No"} />
        {data.hasMinorChildren && (
          <Row
            label="Guardian(s)"
            value={data.guardians.map((g) => g.fullName).filter(Boolean).join(", ")}
          />
        )}
      </Block>

      <div className="rounded-lg border border-navy-200 bg-cream-50 p-5">
        <Checkbox
          checked={data.accuracyConfirmed}
          onChange={(v) => update({ accuracyConfirmed: v })}
          label="I confirm the information above is accurate to the best of my knowledge."
        />
      </div>
    </div>
  );
}
