import type { CoupleType } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────
// SparkWills wizard data model — a straightforward single or mirror will.
// Stored as the WillProject.data JSON blob. Every field has an empty default
// so forms stay controlled; strict validation happens at the proof stage.
// ─────────────────────────────────────────────────────────────────────────

export interface Person {
  fullName: string;
  dateOfBirth: string; // yyyy-mm-dd
  address: string;
  occupation: string;
}

export interface NamedParty {
  fullName: string;
  address: string;
}

export interface Beneficiary {
  id: string;
  fullName: string;
  relationship: string;
  dateOfBirth: string; // yyyy-mm-dd ("" if adult / unknown)
  sharePercentage: number;
  /** Name of the beneficiary this person substitutes for, or "" / "survivors". */
  substituteFor: string;
}

export interface Bequest {
  id: string;
  item: string;
  recipient: string;
}

export interface WizardData {
  // Section 1 — About / will type
  willType: "single" | "mirror";
  coupleType: CoupleType | ""; // mirror only
  person1: Person;
  person2: Person; // mirror only

  // Section 2 — Executors (same choice as PPT: recommended professional or own)
  executorChoice: "recommended" | "own";
  executorsP1: NamedParty[];
  executorsP2: NamedParty[]; // mirror only

  // Section 3 — Guardians
  hasMinorChildren: boolean;
  guardians: NamedParty[];

  // Section 4 — Specific gifts
  bequests: Bequest[];

  // Section 5 — Residuary estate (who inherits)
  /** Mirror only: leave the residue to the surviving partner first. */
  residueToPartner: boolean;
  survivorshipDays: number; // default 30
  beneficiaries: Beneficiary[]; // ultimate beneficiaries
  vestingAge: number; // hold a minor's share until this age (default 18)

  // Section 6 — Funeral wishes (optional, non-binding)
  funeralWishesP1: string;
  funeralWishesP2: string;

  // Section 7 — Review & confirm
  accuracyConfirmed: boolean;
}

const emptyPerson = (): Person => ({
  fullName: "",
  dateOfBirth: "",
  address: "",
  occupation: "",
});

export function blankWizardData(): WizardData {
  return {
    willType: "single",
    coupleType: "",
    person1: emptyPerson(),
    person2: emptyPerson(),
    executorChoice: "own",
    executorsP1: [],
    executorsP2: [],
    hasMinorChildren: false,
    guardians: [],
    bequests: [],
    residueToPartner: true,
    survivorshipDays: 30,
    beneficiaries: [],
    vestingAge: 18,
    funeralWishesP1: "",
    funeralWishesP2: "",
    accuracyConfirmed: false,
  };
}

/** Merge stored (possibly partial / older) data over a blank default. */
export function hydrateWizardData(stored: unknown): WizardData {
  const base = blankWizardData();
  if (!stored || typeof stored !== "object") return base;
  const s = stored as Record<string, unknown>;
  return {
    ...base,
    ...s,
    person1: { ...base.person1, ...(s.person1 as object) },
    person2: { ...base.person2, ...(s.person2 as object) },
  } as WizardData;
}

// ─── Wizard section metadata (drives the stepper) ───

export interface WizardSection {
  slug: string;
  index: number; // 1-based
  title: string;
  short: string;
}

export const WIZARD_SECTIONS: WizardSection[] = [
  { slug: "about", index: 1, title: "About you", short: "About you" },
  { slug: "executors", index: 2, title: "Executors", short: "Executors" },
  { slug: "guardians", index: 3, title: "Guardians", short: "Guardians" },
  { slug: "gifts", index: 4, title: "Specific gifts", short: "Gifts" },
  { slug: "residue", index: 5, title: "Who inherits", short: "Inheritance" },
  { slug: "wishes", index: 6, title: "Funeral wishes", short: "Wishes" },
  { slug: "review", index: 7, title: "Review & confirm", short: "Review" },
];

export const TOTAL_SECTIONS = WIZARD_SECTIONS.length;
