import "client-only";
import {
  canSendAs,
  deleteSavedReport,
  listSavedReports,
  saveReport,
  type SavedReport,
} from "./reports";

export type SendResult =
  | { status: "sent" }
  /** No connection: the report stays queued */
  | { status: "offline" }
  | { status: "failed"; error: string };

/** The request body POST /api/submissions expects */
function toSubmission(report: SavedReport) {
  return {
    id: report.id,
    observedAt: report.observedAt,
    plantName: report.plantName,
    lat: report.lat,
    lng: report.lng,
    locationAccuracyM: report.locationAccuracyM,
    notes: report.notes || undefined,
    imageData: report.photo,
    anonymous: report.anonymous,
  };
}

/** Sends in progress, so a report is never sent twice at once */
const inFlight = new Map<string, Promise<SendResult>>();

/**
 * Send a saved report. Sent (or already sent: the server answers 409 for an
 * ID it has): it's deleted from the device. Otherwise it stays, with the
 * reason recorded for the Drafts page.
 */
export function sendSavedReport(report: SavedReport): Promise<SendResult> {
  const running = inFlight.get(report.id);
  if (running) return running;

  const sending = send(report).finally(() => inFlight.delete(report.id));
  inFlight.set(report.id, sending);
  return sending;
}

async function send(report: SavedReport): Promise<SendResult> {
  let response: Response;
  try {
    response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSubmission(report)),
    });
  } catch {
    // fetch only throws when the request couldn't be made at all
    return { status: "offline" };
  }

  if (response.ok || response.status === 409) {
    await deleteSavedReport(report.id).catch(() => {});
    return { status: "sent" };
  }

  const body = await response.json().catch(() => ({}));
  const message: string = body.error || `Couldn't send the report (error ${response.status})`;
  // Busy or broken server, or signed out: sending again later can work.
  // Anything else (a refused location, a report too old) needs editing first.
  const retry = response.status >= 500 || response.status === 429 || response.status === 401;
  await saveReport({ ...report, lastError: { message, retry } }).catch(() => {});
  return { status: "failed", error: message };
}

let sendingAll: Promise<{ sent: number; failed: number }> | null = null;

/**
 * Send every queued report the current sign-in may send, oldest first.
 * Stops at the first sign of no connection. Only one run at a time.
 */
export function sendQueuedReports(
  userId: string | null,
): Promise<{ sent: number; failed: number }> {
  sendingAll ??= (async () => {
    let sent = 0;
    let failed = 0;
    const queued = (await listSavedReports()).filter(
      (report) =>
        report.status === "queued" &&
        (report.lastError?.retry ?? true) &&
        canSendAs(report, userId),
    );
    for (const report of queued) {
      const result = await sendSavedReport(report);
      if (result.status === "offline") break;
      if (result.status === "sent") sent++;
      else failed++;
    }
    return { sent, failed };
  })().finally(() => (sendingAll = null));
  return sendingAll;
}
