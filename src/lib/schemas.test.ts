import { describe, expect, it } from "vitest";
import { plants } from "@/data/plants";
import { MAX_IMAGE_DATA_LENGTH, MAX_NOTES_LENGTH, UNKNOWN_PLANT } from "./limits";
import {
  createSubmissionSchema,
  followSchema,
  identifyPlantSchema,
  resolvePlant,
  updateSubmissionSchema,
} from "./schemas";

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0].message;

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

describe("createSubmissionSchema", () => {
  const jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
  const valid = { plantName: "air potato", lat: 29.65, lng: -82.32 };

  it("accepts a minimal submission and fills in defaults", () => {
    expect(createSubmissionSchema.parse(valid)).toEqual({
      plantName: { plantName: "Air Potato", scientificName: "Dioscorea bulbifera" },
      lat: 29.65,
      lng: -82.32,
      locationAccuracyM: null,
      notes: null,
      imageData: null,
      anonymous: false,
    });
  });

  it("ignores fields it doesn't know, such as a client-chosen status or timestamp", () => {
    const parsed = createSubmissionSchema.parse({ ...valid, status: "approved", timestamp: 0 });
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("timestamp");
  });

  it("rejects unknown plant names", () => {
    const result = createSubmissionSchema.safeParse({ ...valid, plantName: "Kudzu?" });
    expect(firstError(result)).toBe("Plant name must be one of the listed species or Unknown");
  });

  it("requires a plant name and numeric coordinates", () => {
    expect(firstError(createSubmissionSchema.safeParse({ lat: 29.65, lng: -82.32 }))).toBe(
      "Plant name is required",
    );
    expect(firstError(createSubmissionSchema.safeParse({ ...valid, lat: "29.65" }))).toBe(
      "lat and lng must be numbers",
    );
  });

  it("rejects locations outside Alachua County", () => {
    const result = createSubmissionSchema.safeParse({ ...valid, lat: 25.76, lng: -80.19 });
    expect(firstError(result)).toBe("Location must be within Alachua County");
  });

  it("trims notes, stores blank notes as null and limits their length", () => {
    expect(createSubmissionSchema.parse({ ...valid, notes: "  by the trail  " }).notes).toBe(
      "by the trail",
    );
    expect(createSubmissionSchema.parse({ ...valid, notes: "   " }).notes).toBeNull();
    const atLimit = "a".repeat(MAX_NOTES_LENGTH);
    expect(createSubmissionSchema.parse({ ...valid, notes: ` ${atLimit} ` }).notes).toBe(atLimit);
    expect(
      firstError(createSubmissionSchema.safeParse({ ...valid, notes: atLimit + "a" })),
    ).toMatch(/characters or fewer/);
    expect(firstError(createSubmissionSchema.safeParse({ ...valid, notes: 5 }))).toBe(
      "Notes must be text",
    );
  });

  it("accepts inline JPEG, PNG and WebP photos and treats an empty one as none", () => {
    expect(createSubmissionSchema.parse({ ...valid, imageData: jpeg }).imageData).toBe(jpeg);
    for (const image of ["data:image/png;base64,iVBORw0KGgo=", "data:image/webp;base64,UklGRg=="]) {
      expect(createSubmissionSchema.safeParse({ ...valid, imageData: image }).success).toBe(true);
    }
    expect(createSubmissionSchema.parse({ ...valid, imageData: "" }).imageData).toBeNull();
  });

  it("rejects outside URLs, other types and trailing markup in photos", () => {
    for (const imageData of [
      "https://example.com/photo.jpg",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:text/html;base64,PGgxPg==",
      `${jpeg}"><script>`,
      42,
    ]) {
      expect(firstError(createSubmissionSchema.safeParse({ ...valid, imageData }))).toBe(
        "Photo must be a JPEG, PNG or WebP image",
      );
    }
  });

  it("rejects oversized photos before pattern-checking them", () => {
    const imageData = "data:image/jpeg;base64," + "A".repeat(MAX_IMAGE_DATA_LENGTH);
    const result = createSubmissionSchema.safeParse({ ...valid, imageData });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Photo is too large"]);
  });

  it("bounds the reported GPS accuracy", () => {
    expect(
      createSubmissionSchema.parse({ ...valid, locationAccuracyM: 12.5 }).locationAccuracyM,
    ).toBe(12.5);
    expect(createSubmissionSchema.safeParse({ ...valid, locationAccuracyM: -1 }).success).toBe(
      false,
    );
  });
});

describe("updateSubmissionSchema", () => {
  it("leaves out fields that weren't sent", () => {
    expect(updateSubmissionSchema.parse({ notes: "new note" })).toEqual({ notes: "new note" });
  });

  it("clears notes when sent null or blank", () => {
    expect(updateSubmissionSchema.parse({ notes: null })).toEqual({ notes: null });
    expect(updateSubmissionSchema.parse({ notes: "  " })).toEqual({ notes: null });
  });

  it("resolves the plant from the list", () => {
    expect(updateSubmissionSchema.parse({ plantName: "Unknown" })).toEqual({
      plantName: { plantName: UNKNOWN_PLANT, scientificName: null },
    });
  });

  it("requires something to update", () => {
    expect(firstError(updateSubmissionSchema.safeParse({}))).toBe(
      "Nothing to update: send plantName and/or notes",
    );
  });
});

describe("followSchema", () => {
  it("accepts Clerk user IDs only", () => {
    expect(followSchema.safeParse({ targetUserId: "user_2abcDEF123" }).success).toBe(true);
    for (const targetUserId of ["", "user_1,status.eq.pending", { $ne: null }, "a".repeat(65)]) {
      expect(followSchema.safeParse({ targetUserId }).success).toBe(false);
    }
  });
});

describe("identifyPlantSchema", () => {
  it("requires an image", () => {
    expect(firstError(identifyPlantSchema.safeParse({}))).toBe("No image provided");
  });

  it("accepts an inline image", () => {
    const image = "data:image/jpeg;base64,/9j/4AAQ";
    expect(identifyPlantSchema.parse({ image })).toEqual({ image });
  });
});
