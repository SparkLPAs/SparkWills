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

/**
 * Runs the validation checks for a straightforward will.
 * Red = blocks compile; Amber = warning only.
 */
export function runDocumentChecks(data: WizardData): CheckResult[] {
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

  // ── Amber (warnings) ──
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

export function summariseChecks(data: WizardData): ProofSummary {
  const checks = runDocumentChecks(data);
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
