"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TOTAL_SECTIONS } from "@/lib/wizard/schema";

interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  paymentStatus: string;
  lastCompletedStep: number;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "In review",
  compiled: "Compiled",
  executed: "Executed",
  stored: "Stored",
};

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const pct = Math.round((project.lastCompletedStep / TOTAL_SECTIONS) * 100);
  const resumeHref =
    project.status === "draft"
      ? `/projects/${project.id}/wizard/about`
      : `/projects/${project.id}/preview`;

  async function remove() {
    if (!confirm("Delete these draft wills? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy-800">
            {project.title}
          </h3>
          <p className="mt-1 text-xs text-navy-500">
            {STATUS_LABELS[project.status] ?? project.status} · updated{" "}
            {new Date(project.updatedAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            project.paymentStatus === "paid"
              ? "bg-green-100 text-success"
              : "bg-cream-200 text-navy-600"
          }`}
        >
          {project.paymentStatus === "paid" ? "Paid" : "Unpaid"}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
          <div
            className="h-full rounded-full bg-navy-700 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-navy-500">
          {project.lastCompletedStep} of {TOTAL_SECTIONS} sections complete
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Link href={resumeHref} className="btn-primary">
          {project.status === "draft" ? "Resume" : "Open"}
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="text-sm text-navy-500 hover:text-danger"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
