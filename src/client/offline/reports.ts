import "client-only";

/**
 * Reports kept on this device until they can be sent: drafts someone means
 * to finish later, and finished reports waiting for a connection. Stored in
 * IndexedDB, which holds photos comfortably (localStorage doesn't).
 */

export interface SavedReport {
  /** Becomes the submission's ID, so a report sent twice is stored once */
  id: string;
  /**
   * "queued": finished, sent automatically when there's a connection.
   * "draft": waiting for someone to finish it on /submit.
   */
  status: "queued" | "draft";
  /** Clerk user who saved it; null if nobody was signed in, or sign-in hadn't loaded (offline) */
  ownerId: string | null;
  savedAt: number;
  /** When the plant was spotted: the photo and location were taken then */
  observedAt: number;
  /** JPEG data URL */
  photo: string;
  lat: number;
  lng: number;
  locationAccuracyM: number | null;
  /** A plant from the list, "Unknown", or null in a draft that has none yet */
  plantName: string | null;
  notes: string;
  anonymous: boolean;
  /** Why the last send failed. `retry` is false when sending again can't help until it's edited. */
  lastError: { message: string; retry: boolean } | null;
}

const DB_NAME = "swamp-spotter-offline";
// Version 1 was the earlier offline mode's "drafts" store
const DB_VERSION = 2;
const STORE = "reports";
const CHANGED = "saved-reports-changed";

/** A draft saved by the earlier offline mode (database version 1) */
interface LegacyDraft {
  id: string;
  lat: number;
  lng: number;
  locationAccuracyM?: number;
  imageData: string;
  timestamp: number;
  userId?: string;
  createdAt: number;
}

function fromLegacyDraft(draft: LegacyDraft): SavedReport {
  return {
    id: draft.id,
    status: "draft",
    ownerId: draft.userId ?? null,
    savedAt: draft.createdAt,
    observedAt: draft.timestamp,
    photo: draft.imageData,
    lat: draft.lat,
    lng: draft.lng,
    locationAccuracyM: draft.locationAccuracyM ?? null,
    plantName: null,
    notes: "",
    anonymous: false,
    lastError: null,
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      const reports = db.createObjectStore(STORE, { keyPath: "id" });

      // Carry drafts from the earlier offline mode over, then drop its store
      if (db.objectStoreNames.contains("drafts")) {
        const drafts = request.transaction!.objectStore("drafts");
        const all = drafts.getAll();
        all.onsuccess = () => {
          for (const draft of all.result as LegacyDraft[]) reports.put(fromLegacyDraft(draft));
          db.deleteObjectStore("drafts");
        };
      }
    };
  });
  // A failed open (private browsing, blocked storage) may work next time
  dbPromise.catch(() => (dbPromise = null));
  return dbPromise;
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// Changes made in this tab, and in other tabs of the same site
const events = new EventTarget();
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANGED);

function announceChange() {
  events.dispatchEvent(new Event(CHANGED));
  channel?.postMessage(null);
}

/** Calls `listener` whenever saved reports change, in this tab or another. Returns an unsubscribe function. */
export function onSavedReportsChange(listener: () => void): () => void {
  events.addEventListener(CHANGED, listener);
  channel?.addEventListener("message", listener);
  return () => {
    events.removeEventListener(CHANGED, listener);
    channel?.removeEventListener("message", listener);
  };
}

/** Every report saved on this device, oldest first */
export async function listSavedReports(): Promise<SavedReport[]> {
  const reports = await run("readonly", (store) => store.getAll() as IDBRequest<SavedReport[]>);
  return reports.sort((a, b) => a.savedAt - b.savedAt);
}

export async function getSavedReport(id: string): Promise<SavedReport | null> {
  return (await run("readonly", (store) => store.get(id) as IDBRequest<SavedReport>)) ?? null;
}

export async function saveReport(report: SavedReport): Promise<void> {
  await run("readwrite", (store) => store.put(report));
  announceChange();
}

export async function deleteSavedReport(id: string): Promise<void> {
  await run("readwrite", (store) => store.delete(id));
  announceChange();
}

/**
 * Whether the person signed in now may see a saved report on a shared
 * device: their own, and ones saved while nobody was signed in. When sign-in
 * hasn't loaded (offline), everyone's are shown.
 */
export function isVisibleTo(
  report: SavedReport,
  viewer: { loaded: boolean; userId: string | null },
) {
  return !viewer.loaded || report.ownerId === null || report.ownerId === viewer.userId;
}

/**
 * Whether a queued report may be sent under the current sign-in. A report is
 * sent as whoever is signed in, so someone else's waits for them, unless it's
 * anonymous.
 */
export function canSendAs(report: SavedReport, userId: string | null): boolean {
  if (report.anonymous) return true;
  if (report.ownerId === null) return userId !== null;
  return report.ownerId === userId;
}

/** For tests: forget the open database so the next call opens it again */
export function resetForTests() {
  dbPromise?.then((db) => db.close()).catch(() => {});
  dbPromise = null;
}
