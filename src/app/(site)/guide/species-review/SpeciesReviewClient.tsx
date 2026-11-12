"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Proposal = {
  id: string;
  name: string;
  scientific_name: string;
  description: string;
  image_url: string | null;
  created_at: string;
};
export default function SpeciesReviewClient() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [levels, setLevels] = useState<Record<string, "Low" | "Moderate" | "Significant">>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/species-proposals");
    if (!response.ok) throw new Error("Unable to load proposals");
    setProposals(await response.json());
  }, []);
  useEffect(() => {
    load().catch(() => setMessage("Unable to load proposals"));
  }, [load]);
  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch(`/api/species-proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "approve" ? { action, threatLevel: levels[id] || "Moderate" } : { action },
        ),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Review failed");
      setProposals((current) => current.filter((item) => item.id !== id));
      setMessage(action === "approve" ? "Species added to the guide." : "Proposal rejected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed");
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/guide" className="text-sm font-semibold text-emerald-700">
        ← Back to guide
      </Link>
      <h1 className="mt-5 text-3xl font-bold text-slate-900">Review proposed species</h1>
      <p className="mt-2 text-slate-600">
        Verify the identification and invasive status before approving. Approval publishes the
        species to the guide.
      </p>
      {message && (
        <p role="status" className="mt-4 text-sm text-slate-700">
          {message}
        </p>
      )}
      <div className="mt-6 space-y-4">
        {proposals.length === 0 && <p className="text-slate-600">No pending proposals.</p>}
        {proposals.map((p) => (
          <article key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
            <p className="italic text-slate-600">{p.scientific_name}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{p.description}</p>
            {p.image_url && (
              <a
                href={p.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-sm text-emerald-700 underline"
              >
                View reference image
              </a>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-sm">
                Threat level{" "}
                <select
                  value={levels[p.id] || "Moderate"}
                  onChange={(e) =>
                    setLevels((v) => ({
                      ...v,
                      [p.id]: e.target.value as "Low" | "Moderate" | "Significant",
                    }))
                  }
                  className="ml-2 rounded border p-2"
                >
                  <option>Low</option>
                  <option>Moderate</option>
                  <option>Significant</option>
                </select>
              </label>
              <button
                disabled={busy === p.id}
                onClick={() => review(p.id, "approve")}
                className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busy === p.id}
                onClick={() => review(p.id, "reject")}
                className="rounded border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
