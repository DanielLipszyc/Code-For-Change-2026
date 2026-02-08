"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface Submission {
  _id: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
  imageData?: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
  status?: "pending" | "approved";
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#eef2ff"/>
        <stop offset="1" stop-color="#ecfdf5"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" font-family="system-ui, -apple-system, Segoe UI" font-size="28" fill="#334155" text-anchor="middle">
      No image
    </text>
  </svg>
`);

function statusBadgeClasses(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const [src, setSrc] = useState(submission.imageData || FALLBACK_IMG);
  const submittedDate = submission.createdAt
    ? new Date(submission.createdAt).toLocaleDateString()
    : new Date(submission.timestamp).toLocaleDateString();

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={submission.plantName}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={() => setSrc(FALLBACK_IMG)}
        />
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClasses(
              submission.status || "pending"
            )}`}
          >
            {submission.status === "approved" ? "✓ Approved" : "⏳ Pending"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {submission.plantName}
            </h3>
            {submission.scientificName && (
              <p className="text-sm italic text-slate-600">
                {submission.scientificName}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Submitted: {submittedDate}
            </p>
          </div>

          <Link
            href={`/submit/edit/${submission._id}`}
            className="shrink-0 rounded-lg bg-[#136207] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f5006]"
            title="Edit submission"
          >
            Edit
          </Link>
        </div>

        {submission.notes && (
          <p className="mt-3 text-sm text-slate-600 line-clamp-2">
            {submission.notes}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span>📍 {submission.lat.toFixed(4)}, {submission.lng.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

export default function LogPage() {
  const { user, isLoaded } = useUser();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "approved" | "pending">("All");

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const response = await fetch("/api/submissions");
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchSubmissions();
    }
  }, [isLoaded]);

  const userSubmissions = useMemo(() => {
    if (!user) return [];

    const q = query.trim().toLowerCase();

    return submissions
      .filter((s) => s.userId === user.id)
      .filter((s) => {
        const matchesStatus = statusFilter === "All" ? true : s.status === statusFilter;
        const matchesQuery =
          !q ||
          s.plantName.toLowerCase().includes(q) ||
          s.scientificName?.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.timestamp).getTime();
        const bTime = new Date(b.createdAt || b.timestamp).getTime();
        return bTime - aTime; // Most recent first
      });
  }, [submissions, user, query, statusFilter]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-slate-600">Loading your submissions...</p>
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
            Please sign in to view your submission log.
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              My Submission Log
            </h1>
            <p className="mt-2 text-slate-600">
              View and manage all your plant submissions
            </p>
          </div>

          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px]">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your submissions..."
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-slate-600">
            Showing <b>{userSubmissions.length}</b> submission
            {userSubmissions.length !== 1 ? "s" : ""}
          </p>

          {userSubmissions.length === 0 ? (
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
                  <p className="font-semibold mb-2">No submissions yet</p>
                  <p className="text-sm text-slate-600 mb-4">
                    Start contributing by submitting your first plant sighting!
                  </p>
                  <Link
                    href="/submit"
                    className="inline-block px-4 py-2 bg-[#136207] text-white font-semibold rounded-lg hover:bg-[#0f5006] transition-colors"
                  >
                    Submit a Plant
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userSubmissions.map((s) => (
                <SubmissionCard key={s._id} submission={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
