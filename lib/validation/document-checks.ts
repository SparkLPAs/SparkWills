import type { WizardData } from "@/lib/wizard/schema";
import { siteConfig } from "@/config/site.config";

export type Severity = "red" | "amber";

export interface CheckResult {
  id: string;
  label: string;
  severity: Severity;
  passed: boolean;
  detail?: string;
}

function isUnder18(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return age < 18;
}

/** What was self-certified at the eligibility gate (app/eligibility), before
 *  any of this wizard data existed — see User.eligibilityAnswers. */
export type EligibilityAnswers = Record<string, boolean> | null | undefined;

/**
 * Runs the validation checks for a straightforward will.
 * Red = blocks compile; Amber = warning only.
 */
export function runDocumentChecks(
  data: WizardData,
  eligibilityAnswers?: EligibilityAnswers,
): CheckResult[] {
  const checks: CheckResult[] = [];
  const isMirror = data.willType === "mirror";
  const useRecommended =
    data.executorChoice === "recommended" &&
    siteConfig.executors.recommendedExecutor.enabled;

  const add = (
    id: string,
    label: string,
    severity: Severity,
    passed: boolean,
    detail?: string,
  ) => checks.push({ id, label, severity, passed, detail });

  // Names
  add(
    "nameP1",
    "Your full legal name is provided",
    "red",
    !!data.person1.fullName.trim(),
    "Enter your full legal name in 'About you'.",
  );
  if (isMirror) {
    add(
      "nameP2",
      "Your partner's full legal name is provided",
      "red",
      !!data.person2.fullName.trim(),
      "Enter your partner's full legal name in 'About you'.",
    );
  }

  // Executors
  add(
    "executorsP1",
    useRecommended ? "Executor for your will" : "Executors for your will (min. 2)",
    "red",
    useRecommended ||
      data.executorsP1.filter((e) => e.fullName.trim()).length >= 2,
    "Add at least two executors, or choose a professional executor.",
  );
  if (isMirror) {
    add(
      "executorsP2",
      useRecommended
        ? "Executor for your partner's will"
        : "Executors for your partner's will (min. 2)",
      "red",
      useRecommended ||
        data.executorsP2.filter((e) => e.fullName.trim()).length >= 2,
      "Add at least two executors, or choose a professional executor.",
    );
  }

  // Beneficiaries
  const validBeneficiaries = data.beneficiaries.filter((b) => b.fullName.trim());
  const sharesTotal = validBeneficiaries.reduce(
    (s, b) => s + (Number(b.sharePercentage) || 0),
    0,
  );
  add(
    "beneficiaries",
    "At least one beneficiary is named",
    "red",
    validBeneficiaries.length >= 1,
    "Name who inherits your residuary estate in 'Who inherits'.",
  );
  add(
    "shares100",
    "Beneficiary shares total 100%",
    "red",
    validBeneficiaries.length === 0 || sharesTotal === 100,
    `Beneficiary shares currently total ${sharesTotal}%. They must add up to 100%.`,
  );

  // Vesting age for minors
  const hasMinorBeneficiary = validBeneficiaries.some((b) => {
    if (!b.dateOfBirth) return false;
    const dob = new Date(b.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return false;
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age < 18;
  });
  add(
    "vestingAge",
    "Vesting age set for minor beneficiaries",
    "red",
    !hasMinorBeneficiary || data.vestingAge >= 18,
    "A vesting age must be set when a beneficiary is under 18.",
  );

  // Guardians if minor children
  add(
    "guardians",
    "Guardian appointed for minor children",
    "red",
    !data.hasMinorChildren ||
      data.guardians.filter((g) => g.fullName.trim()).length >= 1,
    "You indicated you have minor children — appoint at least one guardian.",
  );

  // Age contradicts the "18 or over" self-certified at eligibility — a
  // person's actual date of birth is only entered here, in the wizard, so
  // this is the first point it can actually be checked against what was
  // confirmed with a single click, weeks earlier, before any name or DOB
  // was known. A will made under 18 isn't valid (Wills Act 1837), so this
  // blocks compile rather than just warning.
  add(
    "ageConsistency",
    "Date of birth confirms you're both 18 or over",
    "red",
    !isUnder18(data.person1.dateOfBirth) &&
      (!isMirror || !isUnder18(data.person2.dateOfBirth)),
    eligibilityAnswers?.ageOver18 === true
      ? "The date of birth entered shows one of you is under 18. You must be 18 or over to make a valid will in England & Wales (Wills Act 1837) — this doesn't match the eligibility check you confirmed earlier."
      : "You must be 18 or over to make a valid will in England & Wales (Wills Act 1837). The date of birth entered shows one of you is under 18.",
  );

  // ── Amber (warnings) ──

  // "No trusts" was self-certified at eligibility, before any beneficiary
  // was named. A gift to a minor is automatically held in trust until the
  // vesting age — if one's since been named, flag the contradiction rather
  // than silently proceeding on an eligibility answer that no longer holds.
  if (eligibilityAnswers?.straightforward === true) {
    add(
      "eligibilityTrustContradiction",
      "Still a straightforward estate with no trusts",
      "amber",
      !hasMinorBeneficiary,
      "You confirmed a straightforward estate with no trusts at the eligibility check, but you've named a beneficiary under 18 — gifts to minors are automatically held in trust until the vesting age. You can still proceed, but if your circumstances turned out more complex than you first thought, consider getting advice before relying on a DIY will.",
    );
  }

  add(
    "beneficiaryAsWitness",
    "Reminder: beneficiaries must not witness the will",
    "amber",
    false,
    "When signing, do not use any beneficiary (or their spouse) as a witness — the gift to them would be void. Choose independent witnesses.",
  );
  add(
    "accuracyConfirmed",
    "Accuracy confirmed",
    "amber",
    data.accuracyConfirmed,
    "Tick the accuracy confirmation on the review step.",
  );

  return checks;
}

export interface ProofSummary {
  checks: CheckResult[];
  redFailures: CheckResult[];
  amberFailures: CheckResult[];
  completeness: number;
  canCompile: boolean;
}

export function summariseChecks(
  data: WizardData,
  eligibilityAnswers?: EligibilityAnswers,
): ProofSummary {
  const checks = runDocumentChecks(data, eligibilityAnswers);
  const reds = checks.filter((c) => c.severity === "red");
  const redFailures = reds.filter((c) => !c.passed);
  const amberFailures = checks.filter(
    (c) => c.severity === "amber" && !c.passed,
  );
  const completeness = Math.round(
    ((reds.length - redFailures.length) / reds.length) * 100,
  );
  return {
    checks,
    redFailures,
    amberFailures,
    completeness,
    canCompile: redFailures.length === 0,
  };
}
