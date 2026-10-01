import { describe, expect, it } from "vitest";
import { plants } from "@/data/plants";
import {
  MAX_IMAGE_DATA_LENGTH,
  MAX_NOTES_LENGTH,
  UNKNOWN_PLANT,
  parseImageData,
  parseNotes,
  resolvePlant,
} from "./submissionInput";

describe("resolvePlant", () => {
  const plant = plants[0];

  it("matches a listed species case-insensitively, ignoring surrounding spaces", () => {
    expect(resolvePlant(`  ${plant.name.toUpperCase()} `)).toEqual({
      plantName: plant.name,
      scientificName: plant.scientificName,
    });
  });

  it("maps the unknown aliases to Unknown Plant with no scientific name", () => {
    for (const name of ["unknown", "Unknown Plant", "UNKNOWN"]) {
      expect(resolvePlant(name)).toEqual({ plantName: UNKNOWN_PLANT, scientificName: null });
    }
  });

  it("maps misspellings from earlier versions of the list to the current name", () => {
    expect(resolvePlant("Coral Adicea")).toEqual({
      plantName: "Coral Ardisia",
      scientificName: "Ardisia crenata",
    });
    expect(resolvePlant("Caeser's Weed")).toEqual({
      plantName: "Caesar's Weed",
      scientificName: "Urena lobata",
    });
  });

  it("rejects names that aren't on the list", () => {
    expect(resolvePlant("Definitely Not A Plant")).toBeNull();
    expect(resolvePlant("<script>alert(1)</script>")).toBeNull();
  });

  it("rejects non-string input", () => {
    for (const value of [undefined, null, 42, {}, [plant.name]]) {
      expect(resolvePlant(value)).toBeNull();
    }
  });
});

describe("parseNotes", () => {
  it("treats missing or blank notes as none", () => {
    expect(parseNotes(undefined)).toEqual({ value: null });
    expect(parseNotes(null)).toEqual({ value: null });
    expect(parseNotes("   ")).toEqual({ value: null });
  });

  it("trims notes", () => {
    expect(parseNotes("  near the trailhead  ")).toEqual({ value: "near the trailhead" });
  });

  it("accepts notes at the length limit and rejects longer ones", () => {
    const atLimit = "a".repeat(MAX_NOTES_LENGTH);
    expect(parseNotes(atLimit)).toEqual({ value: atLimit });
    expect(parseNotes(atLimit + "a")).toHaveProperty("error");
  });

  it("rejects non-string notes", () => {
    expect(parseNotes(123)).toHaveProperty("error");
    expect(parseNotes({ text: "hi" })).toHaveProperty("error");
  });
});

describe("parseImageData", () => {
  const jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

  it("treats a missing photo as none", () => {
    for (const value of [undefined, null, ""]) {
      expect(parseImageData(value)).toEqual({ value: null });
    }
  });

  it("accepts inline JPEG, PNG and WebP data", () => {
    expect(parseImageData(jpeg)).toEqual({ value: jpeg });
    expect(parseImageData("data:image/png;base64,iVBORw0KGgo=")).toHaveProperty("value");
    expect(parseImageData("data:image/webp;base64,UklGRg==")).toHaveProperty("value");
  });

  it("rejects outside URLs, other types and trailing markup", () => {
    for (const value of [
      "https://example.com/photo.jpg",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:text/html;base64,PGgxPg==",
      `${jpeg}"><script>`,
    ]) {
      expect(parseImageData(value)).toHaveProperty("error");
    }
  });

  it("rejects oversized photos before pattern-checking them", () => {
    const tooBig = "data:image/jpeg;base64," + "A".repeat(MAX_IMAGE_DATA_LENGTH);
    expect(parseImageData(tooBig)).toEqual({ error: "Photo is too large" });
  });

  it("rejects non-string input", () => {
    expect(parseImageData(42)).toHaveProperty("error");
  });
});
