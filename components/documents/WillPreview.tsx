import type { WillDocument } from "@/lib/documents/will-content";
import { DISCLAIMER_SHORT } from "@/lib/constants";

/** Web-rendered preview of a single will (mirrors the PDF layout). */
export function WillPreview({ doc }: { doc: WillDocument }) {
  return (
    <article className="rounded-lg border border-cream-300 bg-white p-8 font-serif text-[15px] leading-relaxed text-navy-900 shadow-card">
      <header className="mb-6 text-center">
        <h3 className="text-xl font-bold tracking-wide">
          LAST WILL AND TESTAMENT
        </h3>
        <p className="mt-1">of</p>
        <p className="text-lg font-semibold">{doc.testatorName}</p>
        <p className="text-sm text-navy-600">of {doc.testatorAddress}</p>
      </header>

      <div className="space-y-5 font-sans">
        {doc.clauses.map((clause, i) => (
          <section key={i}>
            {clause.heading && (
              <h4 className="font-serif text-sm font-bold uppercase tracking-wide text-navy-800">
                {clause.number ? `${clause.number}. ` : ""}
                {clause.heading}
              </h4>
            )}
            <div className="mt-1 space-y-1.5 text-navy-700">
              {clause.paragraphs.map((p, j) => (
                <p
                  key={j}
                  className={
                    p.startsWith('"') || /^[0-9]+\.[0-9]/.test(p) ? "" : ""
                  }
                >
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}

        <section className="border-t border-cream-300 pt-4">
          <div className="space-y-1 whitespace-pre-wrap text-navy-700">
            {doc.attestation.map((line, i) => (
              <p key={i}>{line || " "}</p>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-6 border-t border-cream-300 pt-3 text-[10px] text-navy-400">
        {doc.testatorName} — Last Will and Testament · DISCLAIMER:{" "}
        {DISCLAIMER_SHORT}
      </footer>
    </article>
  );
}
