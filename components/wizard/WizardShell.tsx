"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  WIZARD_SECTIONS,
  TOTAL_SECTIONS,
  type WizardData,
} from "@/lib/wizard/schema";
import type { SectionProps } from "@/components/wizard/sectionTypes";
import { AboutSection } from "@/components/wizard/sections/AboutSection";
import { ExecutorsSection } from "@/components/wizard/sections/ExecutorsSection";
import { GuardiansSection } from "@/components/wizard/sections/GuardiansSection";
import { EstateSection } from "@/components/wizard/sections/EstateSection";
import { ResidueSection } from "@/components/wizard/sections/ResidueSection";
import { WishesSection } from "@/components/wizard/sections/WishesSection";
import { ReviewSection } from "@/components/wizard/sections/ReviewSection";

const SECTION_COMPONENTS: Record<string, (p: SectionProps) => JSX.Element> = {
  about: AboutSection,
  executors: ExecutorsSection,
  guardians: GuardiansSection,
  gifts: EstateSection,
  residue: ResidueSection,
  wishes: WishesSection,
  review: ReviewSection,
};

export function WizardShell({
  projectId,
  step,
  initialData,
}: {
  projectId: string;
  step: string;
  initialData: WizardData;
}) {
  const router = useRouter();
  const [data, setData] = useState<WizardData>(initialData);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const dataRef = useRef(data);
  dataRef.current = data;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const section = WIZARD_SECTIONS.find((s) => s.slug === step);
  const sectionIndex = section?.index ?? 1;

  const persist = useCallback(
    async (completedStep?: number) => {
      setSaveState("saving");
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: dataRef.current,
            lastCompletedStep: completedStep,
          }),
        });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    },
    [projectId],
  );

  // Debounced autosave on edits.
  const update = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(), 1000);
  }, [persist]);

  // Flush pending save on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function navigate(toSlug: string | null, completedStep?: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await persist(completedStep);
    if (toSlug) {
      router.push(`/projects/${projectId}/wizard/${toSlug}`);
    } else {
      router.push(`/projects/${projectId}/preview`);
    }
  }

  if (!section) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-navy-700">Unknown wizard step.</p>
        <Link href={`/projects/${projectId}/wizard/about`} className="btn-primary mt-4">
          Start at the beginning
        </Link>
      </div>
    );
  }

  const SectionComponent = SECTION_COMPONENTS[step];
  const prevSection = WIZARD_SECTIONS[sectionIndex - 2]; // 1-based → prev
  const nextSection = WIZARD_SECTIONS[sectionIndex]; // 1-based → next
  const isLast = sectionIndex === TOTAL_SECTIONS;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Stepper */}
      <nav aria-label="Progress" className="mb-8">
        <div className="flex items-center justify-between text-xs text-navy-500">
          <span>
            Step {sectionIndex} of {TOTAL_SECTIONS}
          </span>
          <SaveIndicator state={saveState} />
        </div>
        <ol className="mt-2 flex flex-wrap gap-1.5">
          {WIZARD_SECTIONS.map((s) => {
            const isCurrent = s.slug === step;
            const isDone = s.index < sectionIndex;
            return (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => navigate(s.slug)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-navy-800 text-cream-50"
                      : isDone
                        ? "bg-navy-100 text-navy-700 hover:bg-navy-200"
                        : "bg-cream-200 text-navy-500 hover:bg-cream-300"
                  }`}
                >
                  {s.index}. {s.short}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <h1 className="font-serif text-2xl font-bold text-navy-900">
        {section.title}
      </h1>

      <div className="mt-6">
        {SectionComponent && (
          <SectionComponent data={data} update={update} projectId={projectId} />
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-10 flex items-center justify-between border-t border-cream-300 pt-6">
        <button
          type="button"
          onClick={() =>
            prevSection
              ? navigate(prevSection.slug)
              : router.push("/dashboard")
          }
          className="btn-secondary"
        >
          {prevSection ? "Back" : "Save & exit"}
        </button>

        <button
          type="button"
          onClick={() =>
            isLast
              ? navigate(null, sectionIndex)
              : navigate(nextSection.slug, sectionIndex)
          }
          className="btn-primary"
        >
          {isLast ? "Continue to proofing" : "Save & continue"}
        </button>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "saving")
    return <span className="text-navy-400">Saving…</span>;
  if (state === "saved")
    return <span className="text-success">✓ Saved</span>;
  return <span className="text-navy-400">Auto-saves as you type</span>;
}
