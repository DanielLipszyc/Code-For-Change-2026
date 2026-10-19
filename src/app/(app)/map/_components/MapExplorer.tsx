"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { downloadCsv } from "@/lib/csv";
import type { MapPoint, Submission } from "@/types/submission";
import Filters from "./Filters";
import { NO_FILTERS, applyFilters, type MapFilters } from "./mapFilters";
import MapView from "./MapView";
import PendingList from "./PendingList";
import SightingsList from "./SightingsList";
import SubmissionDetail from "./SubmissionDetail";
import { useUserLocation } from "./useUserLocation";

type View = "map" | "list";

const toPoint = (s: Submission): MapPoint => ({
  id: s.id,
  plantName: s.plantName,
  scientificName: s.scientificName,
  lat: s.lat,
  lng: s.lng,
  timestamp: s.timestamp,
  status: s.status,
  hasPhoto: s.hasPhoto,
});

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body as T;
}

interface MapExplorerProps {
  /** Every approved sighting, built into the page on the server */
  approvedPoints: MapPoint[];
}

/**
 * The interactive part of /map: the map and list views, filters, CSV export
 * and the details dialog.
 *
 * The page arrives with the approved sightings, the same for everyone. What
 * depends on who's looking loads afterwards: admins get the pending reports,
 * and a sighting's full details (notes, submitter, what you may change) load
 * when it's opened. The server checks every change again; the role here only
 * decides which buttons to show.
 */
export default function MapExplorer({ approvedPoints }: MapExplorerProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useUser();
  const userId = user?.id ?? null;
  const isAdmin = user?.publicMetadata?.role === "admin";
  const userLocation = useUserLocation();

  const [approved, setApproved] = useState(approvedPoints);
  const [pending, setPending] = useState<Submission[]>([]);
  const [filters, setFilters] = useState<MapFilters>(NO_FILTERS);
  const [view, setView] = useState<View>("map");

  // Full details by ID, loaded when a sighting is opened (or its popup shown)
  const [details, setDetails] = useState<Record<string, Submission>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const requested = useRef(new Set<string>());
  const [selected, setSelected] = useState<MapPoint | null>(null);

  // ?view=list opens the list (the old /sightings page redirects here)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "list") setView("list");
  }, []);

  function changeView(next: View) {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "list") url.searchParams.set("view", "list");
    else url.searchParams.delete("view");
    window.history.replaceState(window.history.state, "", url);
  }

  // Admins also see reports waiting for review
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchJson<Submission[]>("/api/submissions?status=pending")
      .then((list) => {
        if (cancelled) return;
        setPending(list);
        setDetails((current) => ({
          ...current,
          ...Object.fromEntries(list.map((s) => [s.id, s])),
        }));
      })
      .catch((error) => toast.error(`Couldn't load pending reports: ${error.message}`));
    return () => {
      cancelled = true;
    };
  }, [isAdmin, toast]);

  const loadDetails = useCallback((id: string) => {
    if (requested.current.has(id)) return;
    requested.current.add(id);
    fetchJson<Submission>(`/api/submissions/${id}`)
      .then((submission) => setDetails((current) => ({ ...current, [id]: submission })))
      .catch((error) => {
        requested.current.delete(id);
        setDetailErrors((current) => ({ ...current, [id]: error.message }));
      });
  }, []);

  const select = useCallback(
    (point: MapPoint) => {
      setDetailErrors(({ [point.id]: _, ...rest }) => rest);
      loadDetails(point.id);
      setSelected(point);
    },
    [loadDetails],
  );
  const preview = useCallback((point: MapPoint) => loadDetails(point.id), [loadDetails]);

  const pendingPoints = useMemo(() => (isAdmin ? pending.map(toPoint) : []), [isAdmin, pending]);
  const allPoints = useMemo(() => [...approved, ...pendingPoints], [approved, pendingPoints]);
  const displayed = useMemo(() => applyFilters(allPoints, filters), [allPoints, filters]);
  const plantOptions = useMemo(
    () => Array.from(new Set(allPoints.map((p) => p.plantName))).sort(),
    [allPoints],
  );

  const selectedDetails = selected ? (details[selected.id] ?? null) : null;
  const isOwn = selectedDetails !== null && userId !== null && selectedDetails.userId === userId;

  function forget(id: string) {
    setApproved((current) => current.filter((p) => p.id !== id));
    setPending((current) => current.filter((s) => s.id !== id));
    setDetails(({ [id]: _, ...rest }) => rest);
  }

  async function handleDelete(submission: Submission) {
    const confirmed = await confirm({
      title: "Delete this report?",
      message: `${submission.plantName}, spotted ${new Date(submission.timestamp).toLocaleDateString()}. This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await fetchJson(`/api/submissions/${submission.id}`, { method: "DELETE" });
      setSelected(null);
      forget(submission.id);
      toast.success("Report deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete submission");
    }
  }

  async function handleApprove(submission: Submission) {
    try {
      await fetchJson(`/api/submissions/${submission.id}/approve`, { method: "POST" });
      const approvedSubmission = { ...submission, status: "approved" as const };
      setPending((current) => current.filter((s) => s.id !== submission.id));
      setApproved((current) => [toPoint(approvedSubmission), ...current]);
      setDetails((current) => ({ ...current, [submission.id]: approvedSubmission }));
      setSelected((current) => current && { ...current, status: "approved" });
      toast.success("Report approved. It's now on the public map.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve submission");
    }
  }

  // Exports exactly what's shown: same filters, same visibility. The full
  // records (notes, submitter) load only when someone exports.
  async function handleExportCsv() {
    try {
      const shown = new Set(displayed.map((p) => p.id));
      const all = await fetchJson<Submission[]>("/api/submissions");
      const rows = all
        .filter((s) => shown.has(s.id))
        .map((s) => ({
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-[#136207] text-white"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
    }`;

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
        <div
          role="tablist"
          aria-label="Show sightings as"
          className="flex gap-2 border-b border-gray-200 p-2 dark:border-gray-700"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "map"}
            onClick={() => changeView("map")}
            className={tabClass(view === "map")}
          >
            Map
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            onClick={() => changeView("list")}
            className={tabClass(view === "list")}
          >
            List
          </button>
        </div>

        {/* The map stays mounted behind the list, so switching back is instant */}
        <div hidden={view !== "map"}>
          <MapView
            points={displayed}
            highlightPending={isAdmin}
            userLocation={userLocation}
            visible={view === "map"}
            onPreview={preview}
            onSelect={select}
          />
        </div>
        {view === "list" && (
          <SightingsList
            points={displayed}
            userLocation={userLocation}
            highlightPending={isAdmin}
            onSelect={select}
          />
        )}

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
        total={allPoints.length}
      />

      <PendingList submissions={isAdmin ? pending : []} onSelect={(s) => select(toPoint(s))} />

      <SubmissionDetail
        open={selected !== null}
        title={selected ? `${selected.plantName} sighting` : ""}
        submission={selectedDetails}
        error={selected ? (detailErrors[selected.id] ?? null) : null}
        canEdit={isOwn}
        canDelete={selectedDetails !== null && (isAdmin || isOwn)}
        canApprove={isAdmin && selectedDetails?.status === "pending"}
        onClose={() => setSelected(null)}
        onEdit={() => selectedDetails && router.push(`/submit/edit/${selectedDetails.id}`)}
        onDelete={() => selectedDetails && handleDelete(selectedDetails)}
        onApprove={() => selectedDetails && handleApprove(selectedDetails)}
      />
    </>
  );
}
