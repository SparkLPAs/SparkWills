import Link from "next/link";

export const metadata = { title: "Signing guide" };

const steps = [
  ["Step 1 — Print", "Print each page single-sided on white A4 paper. Do not staple."],
  ["Step 2 — Final read", "Read the entire document one last time."],
  [
    "Step 3 — Sign in front of both witnesses simultaneously",
    "Both witnesses must be in the same room when you sign. Sign your name on the signature line on the final page.",
  ],
  [
    "Step 4 — Witnesses sign",
    "Each witness signs the attestation clause immediately after you, in your presence, adding their full name, address, and occupation.",
  ],
  [
    "Step 5 — Date the will",
    "Insert today's date. Both wills should ideally be signed the same day.",
  ],
  [
    "Step 6 — Do not alter after signing",
    "Any post-execution alterations are presumed invalid unless separately signed and witnessed as a codicil.",
  ],
  ["Step 7 — Store the original safely", "See the Storage Guide for your options."],
];

export default function SigningGuidePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-serif text-3xl font-bold text-navy-900">
        How to sign your will
      </h1>

      <div className="mt-6 rounded-lg border border-warning/40 bg-amber-50/60 p-5">
        <h2 className="font-semibold text-warning">Witness rules</h2>
        <p className="mt-2 text-sm text-navy-700">
          Your witnesses <strong>must</strong> be 18 or over, physically present
          when you sign, both present at the same time, and must each sign after
          you. They <strong>must not</strong> be a beneficiary (or the spouse or
          civil partner of one) — otherwise the gift to that beneficiary is void.
          In a mirror will, use fully independent witnesses; do not use your
          partner.
        </p>
      </div>

      <ol className="mt-8 space-y-5">
        {steps.map(([title, body], i) => (
          <li key={i} className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-800 text-sm font-semibold text-cream-50">
              {i + 1}
            </span>
            <div>
              <h3 className="font-serif font-semibold text-navy-800">{title}</h3>
              <p className="mt-1 text-sm text-navy-700">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex gap-3">
        <Link href={`/projects/${params.id}/download`} className="btn-secondary">
          Back to downloads
        </Link>
        <Link href={`/projects/${params.id}/storage`} className="btn-primary">
          Storage guide
        </Link>
      </div>
    </div>
  );
}
