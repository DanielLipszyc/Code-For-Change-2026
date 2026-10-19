import { describe, expect, it } from "vitest";
import { distanceKm, formatDistance } from "./geo";

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 29.65, lng: -82.32 }, { lat: 29.65, lng: -82.32 })).toBe(0);
  });

  it("measures a known distance (Gainesville to Ocala, about 54 km)", () => {
    const gainesville = { lat: 29.6516, lng: -82.3248 };
    const ocala = { lat: 29.1872, lng: -82.1401 };
    expect(distanceKm(gainesville, ocala)).toBeCloseTo(54.6, 0);
  });
});

describe("formatDistance", () => {
  it("uses meters under a kilometer and km above", () => {
    expect(formatDistance(0.85)).toBe("850 m");
    expect(formatDistance(3.24)).toBe("3.2 km");
    expect(formatDistance(140.4)).toBe("140 km");
  });
});
