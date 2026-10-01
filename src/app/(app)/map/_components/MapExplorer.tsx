"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { downloadCsv } from "@/lib/csv";
import type { Viewer } from "@/types/auth";
import type { Submission } from "@/types/submission";
import Filters from "./Filters";
import { NO_FILTERS, applyFilters, type MapFilters } from "./mapFilters";
import MapView from "./MapView";
import PendingList from "./PendingList";
import SubmissionDetail from "./SubmissionDetail";

interface MapExplorerProps {
  /** Loaded on the server, already limited to what this viewer may see */
  initialSubmissions: Submission[];
  viewer: Viewer;
}

/** The interactive part of /map: map, filters, CSV export and the details dialog */
export default function MapExplorer({ initialSubmissions, viewer }: MapExplorerProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [filters, setFilters] = useState<MapFilters>(NO_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Looked up by ID so the dialog shows changes, e.g. after approving
  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  const plantOptions = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.plantName))).sort(),
    [submissions],
  );

  // Pending reports appear on the map only for admins (in red); submitters
  // see their own pending reports in My Log
  const displayed = useMemo(
    () =>
      applyFilters(
        viewer.isAdmin ? submissions : submissions.filter((s) => s.status === "approved"),
        filters,
      ),
    [submissions, filters, viewer.isAdmin],
  );

  const pending = useMemo(
    () => (viewer.isAdmin ? submissions.filter((s) => s.status === "pending") : []),
    [submissions, viewer.isAdmin],
  );

  const select = useCallback((submission: Submission) => setSelectedId(submission.id), []);

  const isOwn = (submission: Submission) =>
    viewer.userId !== null && submission.userId === viewer.userId;

  async function handleDelete(submission: Submission) {
    const confirmed = await confirm({
      title: "Delete this report?",
      message: `${submission.plantName}, spotted ${new Date(submission.timestamp).toLocaleDateString()}. This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/submissions/${submission.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete submission");
      }
      setSubmissions((current) => current.filter((s) => s.id !== submission.id));
      setSelectedId(null);
      toast.success("Report deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete submission");
    }
  }

  async function handleApprove(submission: Submission) {
    try {
      const response = await fetch(`/api/submissions/${submission.id}/approve`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to approve submission");
      }
      setSubmissions((current) =>
        current.map((s) => (s.id === submission.id ? { ...s, status: "approved" } : s)),
      );
      toast.success("Report approved. It's now on the public map.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve submission");
    }
  }

  // Exports exactly what's on the map: same filters, same visibility
  function handleExportCsv() {
    const rows = displayed.map((s) => ({
      id: s.id,
      plantName: s.plantName,
      scientificName: s.scientificName ?? "",
      status: s.status,
      latitude: s.lat,
      longitude: s.lng,
      spottedAtISO: new Date(s.timestamp).toISOString(),
      spottedAtLocal: new Date(s.timestamp).toLocaleString(),
      notes: s.notes ?? "",
      createdBy: s.createdBy ?? "",
      userId: s.userId ?? "",
      createdAtISO: s.createdAt,
      updatedAtISO: s.updatedAt ?? "",
      photoUrl: new URL(s.photoUrl, window.location.origin).href,
    }));
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`swamp-spotter-map-export-${stamp}.csv`, rows);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
        <MapView submissions={displayed} highlightPending={viewer.isAdmin} onSelect={select} />

        <div className="flex justify-center border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={displayed.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-black/10 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:text-white dark:ring-white/10 dark:hover:bg-gray-800"
            title="Download sightings as CSV"
          >
            ⬇️ Export CSV
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({displayed.length} shown)
            </span>
          </button>
        </div>
      </div>

      <Filters
        plantOptions={plantOptions}
        value={filters}
        onChange={setFilters}
        shown={displayed.length}
        total={submissions.length}
      />

      <PendingList submissions={pending} onSelect={select} />

      <SubmissionDetail
        submission={selected}
        canEdit={selected !== null && isOwn(selected)}
        canDelete={selected !== null && (viewer.isAdmin || isOwn(selected))}
        canApprove={viewer.isAdmin && selected?.status === "pending"}
        onClose={() => setSelectedId(null)}
        onEdit={() => selected && router.push(`/submit/edit/${selected.id}`)}
        onDelete={() => selected && handleDelete(selected)}
        onApprove={() => selected && handleApprove(selected)}
      />
    </>
  );
}
