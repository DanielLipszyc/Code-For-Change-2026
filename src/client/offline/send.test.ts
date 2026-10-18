import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSavedReport, resetForTests, saveReport, type SavedReport } from "./reports";
import { sendQueuedReports, sendSavedReport } from "./send";

const report = (overrides: Partial<SavedReport> = {}): SavedReport => ({
  id: crypto.randomUUID(),
  status: "queued",
  ownerId: "user_ana",
  savedAt: 1,
  observedAt: 1_700_000_000_000,
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

const fetchMock = vi.fn<typeof fetch>();
const reply = (status: number, body: unknown = {}) =>
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  resetForTests();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase("swamp-spotter-offline");
    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });
});

describe("sendSavedReport", () => {
  it("sends the report with its ID and spotted-at time, then forgets it", async () => {
    const saved = report({ notes: "by the boardwalk" });
    await saveReport(saved);
    reply(200, { success: true, id: saved.id });

    await expect(sendSavedReport(saved)).resolves.toEqual({ status: "sent" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/submissions");
    expect(JSON.parse(init!.body as string)).toEqual({
      id: saved.id,
      observedAt: saved.observedAt,
      plantName: "Air Potato",
      lat: 29.65,
      lng: -82.32,
      locationAccuracyM: 8,
      notes: "by the boardwalk",
      imageData: saved.photo,
      anonymous: false,
    });
    expect(await getSavedReport(saved.id)).toBeNull();
  });

  it("treats 'already submitted' as sent", async () => {
    const saved = report();
    await saveReport(saved);
    reply(409, { error: "This report was already submitted" });
    await expect(sendSavedReport(saved)).resolves.toEqual({ status: "sent" });
    expect(await getSavedReport(saved.id)).toBeNull();
  });

  it("keeps the report when there's no connection", async () => {
    const saved = report();
    await saveReport(saved);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(sendSavedReport(saved)).resolves.toEqual({ status: "offline" });
    expect(await getSavedReport(saved.id)).toEqual(saved);
  });

  it("records refusals, and whether sending again could help", async () => {
    const refused = report();
    const busy = report();
    await saveReport(refused);
    await saveReport(busy);
    reply(400, { error: "Location must be within Alachua County" });
    reply(503);

    await sendSavedReport(refused);
    await sendSavedReport(busy);
    expect((await getSavedReport(refused.id))?.lastError).toEqual({
      message: "Location must be within Alachua County",
      retry: false,
    });
    expect((await getSavedReport(busy.id))?.lastError).toEqual({
      message: "Couldn't send the report (error 503)",
      retry: true,
    });
  });

  it("never sends the same report twice at once", async () => {
    const saved = report();
    await saveReport(saved);
    reply(200);
    await Promise.all([sendSavedReport(saved), sendSavedReport(saved)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("sendQueuedReports", () => {
  it("sends queued reports this sign-in may send, skipping drafts and ones needing edits", async () => {
    const mine = report({ savedAt: 1 });
    const anonymous = report({ savedAt: 2, ownerId: "user_bo", anonymous: true });
    const someoneElses = report({ savedAt: 3, ownerId: "user_bo" });
    const draft = report({ savedAt: 4, status: "draft" });
    const refused = report({ savedAt: 5, lastError: { message: "Too old", retry: false } });
    for (const r of [mine, anonymous, someoneElses, draft, refused]) await saveReport(r);
    reply(200);
    reply(200);

    await expect(sendQueuedReports("user_ana")).resolves.toEqual({ sent: 2, failed: 0 });
    const sentIds = fetchMock.mock.calls.map(([, init]) => JSON.parse(init!.body as string).id);
    expect(sentIds).toEqual([mine.id, anonymous.id]);
  });

  it("stops at the first sign of no connection", async () => {
    await saveReport(report({ savedAt: 1 }));
    await saveReport(report({ savedAt: 2 }));
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sendQueuedReports("user_ana")).resolves.toEqual({ sent: 0, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
