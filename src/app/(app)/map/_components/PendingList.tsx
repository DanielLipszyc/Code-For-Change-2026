"use client";

import type { Submission } from "@/types/submission";

interface PendingListProps {
  submissions: Submission[];
  onSelect: (submission: Submission) => void;
}

/** Reports waiting for review, shown to admins under the map */
export default function PendingList({ submissions, onSelect }: PendingListProps) {
  if (submissions.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">⏳</span>
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
          Pending Submissions ({submissions.length})
        </h2>
      </div>
      <p className="mb-4 text-amber-800 dark:text-amber-200">
        Click on any submission below to view details and approve
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission) => (
          <button
            key={submission.id}
            type="button"
            onClick={() => onSelect(submission)}
            className="rounded-xl border-2 border-amber-200 bg-white p-4 text-left shadow-sm transition-shadow hover:border-amber-400 hover:shadow-md dark:border-amber-700 dark:bg-gray-800 dark:hover:border-amber-500"
          >
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- photos come from an API route */}
              <img
                src={submission.photoUrl}
                alt={submission.plantName}
                loading="lazy"
                className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-gray-900 dark:text-white">
                  {submission.plantName}
                </h3>
                {submission.scientificName && (
                  <p className="truncate text-xs italic text-gray-600 dark:text-gray-400">
                    {submission.scientificName}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(submission.timestamp).toLocaleDateString()}
                </p>
                {submission.createdBy && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    By: {submission.createdBy}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
