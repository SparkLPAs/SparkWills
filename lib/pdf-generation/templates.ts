import type { WizardData } from "@/lib/wizard/schema";
import { DOCUMENT_SOURCE, type DocumentType } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";
import { buildWill, type WillDocument } from "@/lib/documents/will-content";
import { buildPdf, type Block } from "@/lib/pdf-generation/pdf-utils";

function willBlocks(doc: WillDocument): Block[] {
  const blocks: Block[] = [
    { type: "h1", text: "LAST WILL AND TESTAMENT" },
    { type: "h3", text: `of ${doc.testatorName}` },
    { type: "small", text: `of ${doc.testatorAddress}` },
    { type: "spacer", indent: 6 },
  ];
  for (const clause of doc.clauses) {
    if (clause.heading) {
      blocks.push({
        type: "h2",
        text: `${clause.number ? `${clause.number}. ` : ""}${clause.heading}`,
      });
    }
    for (const p of clause.paragraphs) {
      blocks.push({ type: "para", text: p });
    }
  }
  blocks.push({ type: "rule" });
  for (const line of doc.attestation) {
    blocks.push({ type: line.trim() ? "para" : "spacer", text: line });
  }
  return blocks;
}

function signingGuideBlocks(): Block[] {
  return [
    { type: "h1", text: "How to sign your will — important instructions" },
    { type: "h2", text: "What you will need" },
    { type: "para", text: "• Printed copy of your will (single-sided, unstapled)" },
    { type: "para", text: "• Two witnesses (see rules below)" },
    { type: "para", text: "• Black or blue pen (not pencil)" },
    { type: "h2", text: "Witness rules" },
    { type: "para", text: "Your witnesses MUST: be aged 18 or over; be physically present when you sign; both be present at the same time as each other; each sign the will after you have signed it." },
    { type: "para", text: "Your witnesses MUST NOT be: a beneficiary named in your will, or the spouse, civil partner, or cohabitee of any beneficiary (the gift to that beneficiary would be void). If making mirror wills, use fully independent witnesses for both — do not use your partner as a witness." },
    { type: "h2", text: "Step-by-step process" },
    { type: "h3", text: "Step 1 — Print" },
    { type: "para", text: "Print each page single-sided on white A4 paper. Do not staple." },
    { type: "h3", text: "Step 2 — Final read" },
    { type: "para", text: "Read the entire document one last time." },
    { type: "h3", text: "Step 3 — Sign in front of both witnesses simultaneously" },
    { type: "para", text: "Both witnesses must be in the same room when you sign. Sign your name on the signature line on the final page." },
    { type: "h3", text: "Step 4 — Witnesses sign" },
    { type: "para", text: "Each witness signs the attestation clause immediately after you, in your presence, adding their full name, address, and occupation." },
    { type: "h3", text: "Step 5 — Date the will" },
    { type: "para", text: "Insert today's date." },
    { type: "h3", text: "Step 6 — Do not alter after signing" },
    { type: "para", text: "Any post-execution alterations are presumed invalid unless separately signed and witnessed as a codicil." },
    { type: "h3", text: "Step 7 — Store the original safely" },
    { type: "para", text: "See the Storage Guide for your options." },
  ];
}

function storageGuideBlocks(): Block[] {
  return [
    { type: "h1", text: "Storing your will" },
    { type: "h2", text: "Storage options" },
    { type: "para", text: "• Solicitor's storage — professional, fireproof, traceable (typically £10–30/year)." },
    { type: "para", text: "• Bank safe deposit box — secure, but can be difficult to access on death." },
    { type: "para", text: "• Home fireproof safe — immediate access, but fire/flood/theft risk." },
    { type: "para", text: "• HMCTS Probate Registry — official deposit; fee payable; less convenient." },
    { type: "para", text: "• Will storage service (e.g. Certainty) — specialist; often includes registration." },
    { type: "h2", text: "Post-execution checklist" },
    { type: "para", text: "• Tell your executors where the original is stored." },
    { type: "para", text: "• Keep a copy (marked COPY — NOT THE ORIGINAL) separately." },
    { type: "para", text: "• Register with Certainty — The National Will Register." },
    { type: "para", text: "• Review every 3–5 years or after: marriage, divorce, new child, property purchase." },
    { type: "para", text: "• Note: marriage automatically revokes a will (Wills Act 1837, s.18)." },
  ];
}

function coverSheetBlocks(data: WizardData, compiledDate: string): Block[] {
  const isMirror = data.willType === "mirror";
  return [
    { type: "h1", text: `Your will${isMirror ? "s" : ""} from ${siteConfig.business.name}` },
    { type: "small", text: `Compiled ${compiledDate} — England & Wales` },
    { type: "spacer", indent: 8 },
    {
      type: "para",
      text: isMirror
        ? `Prepared for ${data.person1.fullName || "Person 1"} and ${data.person2.fullName || "Person 2"}.`
        : `Prepared for ${data.person1.fullName || "Person 1"}.`,
    },
    { type: "h2", text: "What's in this bundle" },
    { type: "para", text: `• Last Will and Testament of ${data.person1.fullName || "Person 1"}` },
    ...(isMirror
      ? [{ type: "para" as const, text: `• Last Will and Testament of ${data.person2.fullName || "Person 2"}` }]
      : []),
    { type: "para", text: "• Signing Guide" },
    { type: "para", text: "• Storage Guide" },
    { type: "para", text: "• Storage Insert (for whoever files or stores the signed original)" },
    { type: "h2", text: "Important" },
    { type: "para", text: "These documents are legal information and templates only — not legal advice. We strongly recommend a qualified solicitor reviews them before you execute (sign) them. Follow the Signing Guide carefully: a will signed or witnessed incorrectly may be invalid." },
  ];
}

// A short, human-readable reference for physical filing/retrieval — not a
// secret, just an index key, so an 8-char slice of the cuid is plenty.
function shortReference(projectId: string): string {
  return projectId.slice(0, 8).toUpperCase();
}

// Printed alongside (not merged into) the will itself, meant to physically
// travel with the signed original into storage — solicitor's storage, a
// safe, or SparkWills' own postal storage service (siteConfig.storage).
// Business owner's explicit ask (Aug 2026): staff handling physical wills
// from multiple sources/partners need to identify at a glance which
// platform and which white-labelled partner a given will came through, for
// correct filing and retrieval. Source is the platform (DOCUMENT_SOURCE,
// fixed per template/repo); Partner is the specific deployment's own brand
// (siteConfig.business.name — for this flagship deployment it's the same
// value as Source, but won't be for a future white-labelled partner clone).
function storageInsertBlocks(data: WizardData, compiledDate: string, projectId: string): Block[] {
  const isMirror = data.willType === "mirror";
  const clientNames = isMirror
    ? `${data.person1.fullName || "Person 1"} & ${data.person2.fullName || "Person 2"}`
    : data.person1.fullName || "Person 1";

  return [
    { type: "h1", text: "Storage & Retrieval Record" },
    { type: "small", text: "Keep this page with the signed original — for filing and retrieval only, not part of the will itself." },
    { type: "spacer", indent: 8 },
    { type: "h2", text: "Source" },
    { type: "para", text: DOCUMENT_SOURCE },
    { type: "h2", text: "Partner" },
    { type: "para", text: siteConfig.business.name },
    { type: "h2", text: "Client" },
    { type: "para", text: clientNames },
    { type: "h2", text: "Document type" },
    { type: "para", text: isMirror ? "Mirror Wills" : "Single Will" },
    { type: "h2", text: "Date compiled" },
    { type: "para", text: compiledDate },
    { type: "h2", text: "Reference" },
    { type: "para", text: shortReference(projectId) },
  ];
}

export interface CompileContext {
  data: WizardData;
  compiledDate: string;
  projectId: string;
}

export function documentLabel(type: DocumentType, data: WizardData): string {
  switch (type) {
    case "will_p1":
      return `${data.person1.fullName || "Person 1"} — Last Will and Testament`;
    case "will_p2":
      return `${data.person2.fullName || "Person 2"} — Last Will and Testament`;
    case "signing_guide":
      return "Signing Guide";
    case "storage_guide":
      return "Storage Guide";
    case "storage_insert":
      return "Storage Insert";
    case "cover_sheet":
      return "Cover Sheet";
  }
}

export async function generateDocument(
  type: DocumentType,
  ctx: CompileContext,
): Promise<Uint8Array> {
  const { data, compiledDate, projectId } = ctx;
  let blocks: Block[];
  switch (type) {
    case "will_p1":
      blocks = willBlocks(buildWill(data, "P1"));
      break;
    case "will_p2":
      blocks = willBlocks(buildWill(data, "P2"));
      break;
    case "signing_guide":
      blocks = signingGuideBlocks();
      break;
    case "storage_guide":
      blocks = storageGuideBlocks();
      break;
    case "storage_insert":
      blocks = storageInsertBlocks(data, compiledDate, projectId);
      break;
    case "cover_sheet":
      blocks = coverSheetBlocks(data, compiledDate);
      break;
  }
  return buildPdf({
    footerLabel: documentLabel(type, data),
    compiledDate,
    blocks,
  });
}

/** The set of documents to produce for a project. */
export function documentsForProject(data: WizardData): DocumentType[] {
  const docs: DocumentType[] = ["cover_sheet", "will_p1"];
  if (data.willType === "mirror") docs.push("will_p2");
  docs.push("signing_guide", "storage_guide", "storage_insert");
  return docs;
}
