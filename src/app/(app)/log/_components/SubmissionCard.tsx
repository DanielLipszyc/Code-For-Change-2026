"use client";

import Link from "next/link";
import { useState } from "react";
import type { Submission } from "@/types/submission";

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

function statusBadgeClasses(status: Submission["status"]) {
  return status === "approved"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-amber-50 text-amber-800 ring-amber-200";
}

interface SubmissionCardProps {
  submission: Submission;
  onDelete: (submission: Submission) => void;
}

export default function SubmissionCard({ submission, onDelete }: SubmissionCardProps) {
  // The photo URL answers 404 when a submission has no photo
  const [src, setSrc] = useState(submission.photoUrl);

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- photos come from an API route */}
        <img
          src={src}
          alt={submission.plantName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          onError={() => setSrc(FALLBACK_IMG)}
        />
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClasses(submission.status)}`}
          >
            {submission.status === "approved" ? "✓ Approved" : "⏳ Pending"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-snug text-slate-900">
              {submission.plantName}
            </h3>
            {submission.scientificName && (
              <p className="text-sm italic text-slate-600">{submission.scientificName}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Submitted: {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>

          <Link
            href={`/submit/edit/${submission.id}`}
            className="flex-grow rounded-lg bg-[#136207] px-1.5 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#0f5006]"
            title="Edit submission"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => onDelete(submission)}
            className="flex-grow rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
            title="Delete submission"
          >
            Delete
          </button>
        </div>

        {submission.notes && (
          <p className="mt-3 line-clamp-2 text-sm text-slate-600">{submission.notes}</p>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span>
            📍 {submission.lat.toFixed(4)}, {submission.lng.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
