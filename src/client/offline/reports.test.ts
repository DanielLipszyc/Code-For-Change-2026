import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  canSendAs,
  deleteSavedReport,
  getSavedReport,
  isVisibleTo,
  listSavedReports,
  onSavedReportsChange,
  resetForTests,
  saveReport,
  type SavedReport,
} from "./reports";

const report = (overrides: Partial<SavedReport> = {}): SavedReport => ({
  id: crypto.randomUUID(),
  status: "queued",
  ownerId: "user_ana",
  savedAt: 1,
  observedAt: 1,
  photo: "data:image/jpeg;base64,/9j/",
  lat: 29.65,
  lng: -82.32,
  locationAccuracyM: 8,
  plantName: "Air Potato",
  notes: "",
  anonymous: false,
  lastError: null,
  ...overrides,
});

afterEach(async () => {
  resetForTests();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase("swamp-spotter-offline");
    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });
});

describe("saved reports", () => {
  it("saves, lists oldest first, reads and deletes", async () => {
    const newer = report({ savedAt: 2 });
    const older = report({ savedAt: 1 });
    await saveReport(newer);
    await saveReport(older);

    expect((await listSavedReports()).map((r) => r.id)).toEqual([older.id, newer.id]);
    expect(await getSavedReport(newer.id)).toEqual(newer);

    await deleteSavedReport(newer.id);
    expect(await getSavedReport(newer.id)).toBeNull();
  });

  it("tells listeners about changes", async () => {
    let changes = 0;
    const stop = onSavedReportsChange(() => changes++);
    await saveReport(report());
    stop();
    await saveReport(report());
    expect(changes).toBe(1);
  });

  it("carries over drafts saved by the earlier offline mode", async () => {
    // What the earlier offline mode left behind: version 1 with a "drafts" store
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("swamp-spotter-offline", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("drafts", { keyPath: "id" });
      open.onsuccess = () => {
        const tx = open.result.transaction("drafts", "readwrite");
        tx.objectStore("drafts").put({
          id: "old-draft",
          lat: 29.7,
          lng: -82.4,
          locationAccuracyM: 12,
          imageData: "data:image/png;base64,iVBORw==",
          timestamp: 1000,
          userId: "user_ana",
          createdAt: 2000,
        });
        tx.oncomplete = () => {
          open.result.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });

    expect(await listSavedReports()).toEqual([
      {
        id: "old-draft",
        status: "draft",
        ownerId: "user_ana",
        savedAt: 2000,
        observedAt: 1000,
        photo: "data:image/png;base64,iVBORw==",
        lat: 29.7,
        lng: -82.4,
        locationAccuracyM: 12,
        plantName: null,
        notes: "",
        anonymous: false,
        lastError: null,
      },
    ]);
  });
});

describe("who sees and sends a saved report", () => {
  it("shows people their own and unowned reports, and everything before sign-in loads", () => {
    const viewer = { loaded: true, userId: "user_ana" };
    expect(isVisibleTo(report({ ownerId: "user_ana" }), viewer)).toBe(true);
    expect(isVisibleTo(report({ ownerId: null }), viewer)).toBe(true);
    expect(isVisibleTo(report({ ownerId: "user_bo" }), viewer)).toBe(false);
    expect(isVisibleTo(report({ ownerId: "user_bo" }), { loaded: false, userId: null })).toBe(true);
  });

  it("sends a report only as its owner, unless it's anonymous", () => {
    expect(canSendAs(report({ ownerId: "user_ana" }), "user_ana")).toBe(true);
    expect(canSendAs(report({ ownerId: "user_ana" }), "user_bo")).toBe(false);
    expect(canSendAs(report({ ownerId: "user_ana" }), null)).toBe(false);
    expect(canSendAs(report({ ownerId: "user_ana", anonymous: true }), null)).toBe(true);
    // Saved before sign-in loaded: sent as whoever signs in
    expect(canSendAs(report({ ownerId: null }), "user_bo")).toBe(true);
    expect(canSendAs(report({ ownerId: null }), null)).toBe(false);
  });
});
