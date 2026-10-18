/**
 * Where a submission's photo is served (app/api/submissions/[id]/photo).
 * The URL answers 404 when the submission has no photo.
 */
export function photoUrl(submissionId: string): string {
  return `/api/submissions/${submissionId}/photo`;
}
