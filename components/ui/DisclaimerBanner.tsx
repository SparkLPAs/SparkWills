import { DISCLAIMER } from "@/lib/constants";

/** Prominent legal disclaimer block. Use on preview, download, and dashboard. */
export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <aside
      role="note"
      className={`rounded-lg border border-warning/30 bg-amber-50/60 p-4 text-sm leading-relaxed text-navy-800 ${className}`}
    >
      <p className="mb-1 font-semibold text-warning">Important — please read</p>
      <p>{DISCLAIMER}</p>
    </aside>
  );
}
