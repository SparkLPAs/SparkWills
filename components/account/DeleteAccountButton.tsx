"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setError("Could not delete your account. Please try again.");
      setLoading(false);
      return;
    }
    // Sign out and return home.
    await signOut({ callbackUrl: "/" });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-danger/40 px-4 py-2 text-sm font-semibold text-danger hover:bg-red-50"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-danger/30 bg-red-50/50 p-4">
      <p className="text-sm text-navy-800">
        This permanently deletes your account, all your wills, and every stored
        document. This cannot be undone. Type <strong>DELETE</strong> to confirm.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE"
        className="mt-3 w-full max-w-xs rounded-md border border-navy-200 bg-white px-3 py-2 text-navy-900 focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={confirmText !== "DELETE" || loading}
          onClick={remove}
          className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
