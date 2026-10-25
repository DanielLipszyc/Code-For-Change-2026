import { describe, expect, it } from "vitest";
import type { Submission } from "@/types/submission";
import { NO_FILTERS, applyFilters, hasFilters, localDay } from "./mapFilters";

// Local-time dates, so the tests pass in any time zone
const at = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour).getTime();

const sighting = (id: string, plantName: string, timestamp: number) =>
  ({ id, plantName, timestamp }) as Submission;

const submissions = [
  sighting("a", "Air Potato", at(2026, 3, 1)),
  sighting("b", "Cogon Grass", at(2026, 3, 15, 23)),
  sighting("c", "Air Potato", at(2026, 4, 2, 0)),
];

const ids = (list: Submission[]) => list.map((s) => s.id);

describe("applyFilters", () => {
  it("shows everything with no filters", () => {
    expect(ids(applyFilters(submissions, NO_FILTERS))).toEqual(["a", "b", "c"]);
  });

  it("filters by plant", () => {
    expect(ids(applyFilters(submissions, { ...NO_FILTERS, plants: ["Air Potato"] }))).toEqual([
      "a",
      "c",
    ]);
  });

  it("includes both ends of the date range, by local day", () => {
    const filters = { ...NO_FILTERS, dateFrom: "2026-03-15", dateTo: "2026-04-02" };
    // b is late on the 15th and c is just after midnight on the 2nd, local time
    expect(ids(applyFilters(submissions, filters))).toEqual(["b", "c"]);
  });
});

describe("localDay", () => {
  it("uses the local calendar day", () => {
    expect(localDay(at(2026, 12, 31, 23))).toBe("2026-12-31");
  });
});

describe("hasFilters", () => {
  it("is false only when nothing is filtered", () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(hasFilters({ ...NO_FILTERS, dateTo: "2026-01-01" })).toBe(true);
  });
});
