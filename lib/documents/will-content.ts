import type { WizardData, NamedParty, Person } from "@/lib/wizard/schema";
import { siteConfig } from "@/config/site.config";

export interface WillClause {
  number?: string;
  heading?: string;
  paragraphs: string[];
}

export interface WillDocument {
  who: "P1" | "P2";
  testatorName: string;
  testatorAddress: string;
  testatorOccupation: string;
  clauses: WillClause[];
  attestation: string[];
}

function partyLine(p: NamedParty): string {
  return p.address ? `${p.fullName} of ${p.address}` : p.fullName;
}

function joinAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Standard professional-executor appointment clause. */
function professionalExecutorClause(name: string, address: string): string {
  return `I appoint the persons who at the date of my death are directors of ${name}${address ? ` of ${address}` : ""}, or such other firm succeeding to or carrying on its practice, as executors of my Will. I express the wish that two and only two of the directors shall prove my Will.`;
}

function beneficiariesText(data: WizardData): string {
  const valid = data.beneficiaries.filter((b) => b.fullName.trim());
  return joinAnd(
    valid.map(
      (b) =>
        `${b.fullName}${b.relationship ? ` (my ${b.relationship})` : ""} as to ${b.sharePercentage}%`,
    ),
  );
}

/** Build one testator's will. who = "P1" → person1 is testator. */
export function buildWill(data: WizardData, who: "P1" | "P2"): WillDocument {
  const testator: Person = who === "P1" ? data.person1 : data.person2;
  const partner: Person = who === "P1" ? data.person2 : data.person1;
  const isMirror = data.willType === "mirror";

  const rec = siteConfig.executors.recommendedExecutor;
  const useRecommended = data.executorChoice === "recommended" && rec.enabled;
  const executors: NamedParty[] = useRecommended
    ? [{ fullName: rec.name, address: rec.address ?? "" }]
    : (who === "P1" ? data.executorsP1 : data.executorsP2).filter((e) =>
        e.fullName.trim(),
      );

  const partnerName = partner.fullName || "my partner";
  const survivorship = data.survivorshipDays || 30;
  const vesting = data.vestingAge || 18;
  const beneficiaries = beneficiariesText(data) || "[beneficiaries]";

  const clauses: WillClause[] = [];

  // Opening
  clauses.push({
    paragraphs: [
      `I, ${testator.fullName || "[full legal name]"} of ${testator.address || "[address]"}${testator.occupation ? `, ${testator.occupation}` : ""}, being of sound mind and testamentary capacity, hereby revoke all former wills and testamentary dispositions previously made by me and declare this to be my last Will.`,
    ],
  });

  // 1. Executors
  const execParagraphs: string[] = [];
  if (useRecommended) {
    const clauseText =
      rec.clause?.trim() || professionalExecutorClause(rec.name, rec.address ?? "");
    execParagraphs.push(`1.1 ${clauseText}`);
  } else if (executors.length >= 1) {
    execParagraphs.push(
      `1.1 I appoint ${joinAnd(executors.map(partyLine))} to be the Executors and Trustees of this my Will ("my Executors").`,
    );
    if (executors.length >= 2) {
      execParagraphs.push(
        `1.2 If ${executors[0].fullName} is unable or unwilling to act, the remaining Executor(s) shall act.`,
      );
    }
  } else {
    execParagraphs.push("1.1 [No executors specified yet.]");
  }
  clauses.push({
    number: "1",
    heading: "APPOINTMENT OF EXECUTORS",
    paragraphs: execParagraphs,
  });

  let clauseNo = 2;

  // 2. Guardians (if minor children)
  if (data.hasMinorChildren) {
    const guardians = data.guardians.filter((g) => g.fullName.trim());
    const condition =
      isMirror && partner.fullName
        ? `If ${partnerName} does not survive me, `
        : "";
    clauses.push({
      number: String(clauseNo),
      heading: "APPOINTMENT OF GUARDIANS",
      paragraphs: [
        `${clauseNo}.1 ${condition}I appoint ${
          guardians.length ? joinAnd(guardians.map(partyLine)) : "[guardian]"
        } to be the guardian(s) of my minor children.`,
      ],
    });
    clauseNo++;
  }

  // Specific gifts
  const bequests = data.bequests.filter((b) => b.item.trim() && b.recipient.trim());
  const giftParas: string[] = [];
  if (bequests.length === 0) {
    giftParas.push(`${clauseNo}.1 I make no specific gifts.`);
  } else {
    bequests.forEach((b, i) => {
      giftParas.push(
        `${clauseNo}.${i + 1} I give ${b.item} to ${b.recipient} absolutely.`,
      );
    });
  }
  clauses.push({
    number: String(clauseNo),
    heading: "SPECIFIC GIFTS",
    paragraphs: giftParas,
  });
  clauseNo++;

  // Residuary estate
  const resNo = clauseNo;
  const resParas: string[] = [];
  const goesToPartnerFirst =
    isMirror && data.residueToPartner && !!partner.fullName;

  if (goesToPartnerFirst) {
    resParas.push(
      `${resNo}.1 I give all my residuary estate to ${partnerName} absolutely, provided they survive me by ${survivorship} days.`,
    );
    resParas.push(
      `${resNo}.2 If ${partnerName} does not survive me by ${survivorship} days, I give my residuary estate to ${beneficiaries}.`,
    );
  } else {
    resParas.push(
      `${resNo}.1 I give all my residuary estate to ${beneficiaries}.`,
    );
  }
  resParas.push(
    `If any beneficiary of my residuary estate predeceases me leaving children who survive me, those children shall take their parent's share equally; otherwise that share shall pass to the surviving beneficiaries in proportion to their shares.`,
  );
  if (data.beneficiaries.some((b) => b.dateOfBirth)) {
    resParas.push(
      `Any share passing to a beneficiary under the age of ${vesting} shall be held by my Executors upon trust until that beneficiary attains the age of ${vesting}.`,
    );
  }
  clauses.push({
    number: String(resNo),
    heading: "RESIDUARY ESTATE",
    paragraphs: resParas,
  });
  clauseNo++;

  // Funeral wishes
  const wishes = who === "P1" ? data.funeralWishesP1 : data.funeralWishesP2;
  if (wishes.trim()) {
    clauses.push({
      number: String(clauseNo),
      heading: "FUNERAL WISHES (non-binding expression only)",
      paragraphs: [wishes.trim()],
    });
    clauseNo++;
  }

  const attestation = [
    `IN WITNESS WHEREOF I sign this Will on the ____ day of ____________ 20__.`,
    ``,
    `Signed by ${testator.fullName || "[testator]"} as their last Will in our presence, and by us in theirs, all being present at the same time:`,
    ``,
    `Testator's signature: _______________________________`,
    ``,
    `Witness 1 — Signature: ____________________  Full name: ____________________`,
    `Address: ________________________________  Occupation: ____________________`,
    ``,
    `Witness 2 — Signature: ____________________  Full name: ____________________`,
    `Address: ________________________________  Occupation: ____________________`,
  ];

  return {
    who,
    testatorName: testator.fullName || "[full legal name]",
    testatorAddress: testator.address || "[address]",
    testatorOccupation: testator.occupation,
    clauses,
    attestation,
  };
}
