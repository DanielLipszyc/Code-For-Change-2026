/**
 * Where a submission's photo is served (app/api/submissions/[id]/photo):
 * full size for the details view, or a 320 px thumbnail for lists. The URL
 * answers 404 when the submission has no photo.
 */
export function photoUrl(submissionId: string, size: "full" | "thumb" = "full"): string {
  const url = `/api/submissions/${submissionId}/photo`;
  return size === "thumb" ? `${url}?size=thumb` : url;
}
