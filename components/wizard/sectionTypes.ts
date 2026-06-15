import type { WizardData } from "@/lib/wizard/schema";

export interface SectionProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  projectId: string;
}

/** Generate a client-side id for new list rows. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.floor(performance.now() * 1000)}`;
}
