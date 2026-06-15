import Link from "next/link";

export const metadata = { title: "Storage guide" };

const options = [
  ["Solicitor's storage", "Professional, fireproof, traceable", "Typically £10–30/year"],
  ["Bank safe deposit box", "Secure", "Can be hard to access on death"],
  ["Home fireproof safe", "Immediate access", "Fire, flood, theft risk"],
  ["HMCTS Probate Registry", "Official deposit", "Fee payable; less convenient"],
  ["Will storage service (e.g. Certainty)", "Specialist; often includes registration", "Variable quality"],
];

const checklist = [
  "Tell your executors where the originals are stored.",
  "Keep a copy (marked COPY — NOT THE ORIGINAL) separately.",
  "Register with Certainty — The National Will Register.",
  "Review every 3–5 years or after marriage, divorce, a new child, or a property purchase.",
  "Remember: marriage automatically revokes a will (Wills Act 1837, s.18).",
];

export default function StorageGuidePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-serif text-3xl font-bold text-navy-900">
        Storing your will
      </h1>

      <h2 className="mt-8 font-serif text-xl font-semibold text-navy-800">
        Your options
      </h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-cream-300">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-left text-navy-700">
            <tr>
              <th className="p-3 font-semibold">Option</th>
              <th className="p-3 font-semibold">Pros</th>
              <th className="p-3 font-semibold">Cons</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {options.map(([opt, pro, con]) => (
              <tr key={opt} className="text-navy-700">
                <td className="p-3 font-medium text-navy-800">{opt}</td>
                <td className="p-3">{pro}</td>
                <td className="p-3">{con}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-serif text-xl font-semibold text-navy-800">
        Post-execution checklist
      </h2>
      <ul className="mt-4 space-y-2">
        {checklist.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-navy-700">
            <span className="text-success">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link href={`/projects/${params.id}/download`} className="btn-secondary">
          Back to downloads
        </Link>
      </div>
    </div>
  );
}
