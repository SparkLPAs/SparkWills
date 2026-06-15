"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectButton({
  className = "btn-primary",
  label = "Start new wills",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch("/api/projects", { method: "POST" });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/projects/${id}/wizard/about`);
      return;
    }
    setLoading(false);
  }

  return (
    <button type="button" onClick={create} disabled={loading} className={className}>
      {loading ? "Creating…" : label}
    </button>
  );
}
