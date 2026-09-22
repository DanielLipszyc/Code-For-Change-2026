"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

const handleDelete = async (sightingId: string) => {
  if (!confirm('Are you sure you want to delete this sighting?')) {
    return;
  }

  try {
    const response = await fetch(`/api/sightings/${sightingId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Sighting deleted successfully');
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to delete sighting');
    }
  } catch (error) {
    console.error('Error deleting sighting:', error);
    alert('Failed to delete sighting');
  }
};

interface Sighting {
  _id: string;
  speciesId?: string | null;
  lat: number;
  lng: number;
  locationAccuracyM?: number;
  addressApprox?: string;
  observedAt?: string;
  reportedAt?: string;
  notes?: string;
  status: string;
  userId?: string;
  createdBy?: string;
  updatedAt?: string;
}

function statusBadgeClasses(status: string) {
  switch (status) {
    case "verified":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function SightingCard({ sighting }: { sighting: Sighting }) {
  const reportedDate = sighting.reportedAt
    ? new Date(sighting.reportedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {sighting.speciesId || "Unknown Species"}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClasses(
                  sighting.status || "pending"
                )}`}
              >
                {sighting.status === "verified" ? "✓ Verified" : "⏳ Pending"}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-2">
              Reported: {reportedDate}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>📍 {sighting.lat.toFixed(4)}, {sighting.lng.toFixed(4)}</span>
            </div>

            {sighting.addressApprox && (
              <p className="text-sm text-slate-600 mb-2">
                🏠 {sighting.addressApprox}
              </p>
            )}

            {sighting.notes && (
              <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                {sighting.notes}
              </p>
            )}

            {sighting.createdBy && (
              <p className="text-xs text-slate-500">
                By: {sighting.createdBy}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/sightings/edit/${sighting._id}`}
              className="rounded-lg bg-[#136207] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f5006] text-center"
              title="Edit sighting"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDelete(sighting._id!)}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
              title="Delete sighting"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SightingsPage() {
  const { user, isLoaded } = useUser();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "verified" | "pending">("All");

  useEffect(() => {
    async function fetchSightings() {
      try {
        const response = await fetch("/api/sightings");
        if (response.ok) {
          const data = await response.json();
          setSightings(data);
        }
      } catch (error) {
        console.error("Error fetching sightings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchSightings();
    }
  }, [isLoaded]);

  const userSightings = useMemo(() => {
    if (!user) return [];

    const q = query.trim().toLowerCase();

    return sightings
      .filter((s) => s.userId === user.id)
      .filter((s) => {
        const matchesStatus = statusFilter === "All" ? true : s.status === statusFilter;
        const matchesQuery =
          !q ||
          s.speciesId?.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q) ||
          s.addressApprox?.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        const aTime = new Date(a.reportedAt || a.observedAt || Date.now()).getTime();
        const bTime = new Date(b.reportedAt || b.observedAt || Date.now()).getTime();
        return bTime - aTime; // Most recent first
      });
  }, [sightings, user, query, statusFilter]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-slate-600">Loading your sightings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Sign In Required</h1>
          <p className="text-slate-600 mb-6">
            Please sign in to view your sightings log.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-6 py-3 bg-[#136207] text-white font-semibold rounded-lg hover:bg-[#0f5006] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              My Sightings Log
            </h1>
            <p className="mt-2 text-slate-600">
              View and manage all your plant sightings
            </p>
          </div>

          <Link
            href="/sightings/submit"
            className="inline-flex items-center justify-center rounded-xl bg-[#136207] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#0f5006] transition-colors"
          >
            🌱 New Sighting
          </Link>
        </div>

        <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px] mb-8">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your sightings..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="All">All statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="mt-8">
          <p className="text-sm text-slate-600">
            Showing <b>{userSightings.length}</b> sighting
            {userSightings.length !== 1 ? "s" : ""}
          </p>

          {userSightings.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              {query || statusFilter !== "All" ? (
                <>
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="font-semibold mb-2">No matches found</p>
                  <p className="text-sm text-slate-600">
                    Try adjusting your search or filter
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">🌱</div>
                  <p className="font-semibold mb-2">No sightings yet</p>
                  <p className="text-sm text-slate-600 mb-4">
                    Start contributing by submitting your first plant sighting!
                  </p>
                  <Link
                    href="/sightings/submit"
                    className="inline-block px-4 py-2 bg-[#136207] text-white font-semibold rounded-lg hover:bg-[#0f5006] transition-colors"
                  >
                    Submit a Sighting
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userSightings.map((s) => (
                <SightingCard key={s._id} sighting={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
