"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import type { Submission } from "@/types/submission";

interface SubmissionDetailProps {
  open: boolean;
  /** The dialog's accessible name, known before the details arrive */
  title: string;
  /** Null while the details load, or if they couldn't be loaded */
  submission: Submission | null;
  error: string | null;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
}

/** Full details of one sighting, with edit/delete/approve when allowed */
export default function SubmissionDetail({
  open,
  title,
  submission,
  error,
  canEdit,
  canDelete,
  canApprove,
  onClose,
  onEdit,
  onDelete,
  onApprove,
}: SubmissionDetailProps) {
  // The photo URL answers 404 when a submission has no photo
  const [missingPhotoId, setMissingPhotoId] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      hideTitle
      className="max-w-4xl dark:bg-gray-900"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 text-2xl font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
        aria-label="Close details"
      >
        ✕
      </button>

      {!submission && (
        <div className="flex min-h-[240px] items-center justify-center p-10" role="status">
          {error ? (
            <p className="text-red-700 dark:text-red-400">{error}</p>
          ) : (
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#136207]" />
          )}
        </div>
      )}

      {submission && (
        <>
          <div className="grid md:grid-cols-2">
            <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              {submission.hasPhoto && missingPhotoId !== submission.id ? (
                // eslint-disable-next-line @next/next/no-img-element -- photos come from an API route
                <img
                  src={submission.photoUrl}
                  alt={submission.plantName}
                  onError={() => setMissingPhotoId(submission.id)}
                  className="h-full max-h-[420px] w-full object-cover"
                />
              ) : (
                <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                  No photo provided
                </div>
              )}
            </div>

            <div className="space-y-4 p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                  Plant
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {submission.plantName}
                </h3>
                {submission.scientificName && (
                  <p className="italic text-gray-600 dark:text-gray-300">
                    {submission.scientificName}
                  </p>
                )}
              </div>

              <dl className="space-y-2 text-gray-700 dark:text-gray-200">
                <div className="flex items-start gap-2">
                  <dt className="font-semibold">Spotted:</dt>
                  <dd>{new Date(submission.timestamp).toLocaleString()}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="font-semibold">Location:</dt>
                  <dd>
                    {submission.lat.toFixed(4)}, {submission.lng.toFixed(4)}
                  </dd>
                </div>
                {submission.notes && (
                  <div className="flex items-start gap-2">
                    <dt className="font-semibold">Notes:</dt>
                    <dd>{submission.notes}</dd>
                  </div>
                )}
                {submission.createdBy && (
                  <div className="flex items-start gap-2">
                    <dt className="font-semibold">Submitted by:</dt>
                    <dd>{submission.createdBy}</dd>
                  </div>
                )}
              </dl>

              {(canEdit || canDelete || canApprove) && (
                <div className="flex gap-3 pt-4">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="flex-1 rounded-md bg-[#136207] px-4 py-2 font-medium text-white transition-colors hover:bg-[#0d4705]"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                  {canApprove && (
                    <button
                      type="button"
                      onClick={onApprove}
                      className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Approve
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
