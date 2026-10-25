import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** A stand-in for Supabase Storage that records uploads and answers with `storage.next` */
const storage = vi.hoisted(() => ({
  uploads: [] as { path: string; bytes: Buffer; options: unknown }[],
  uploadError: null as unknown,
  download: { data: null as Blob | null, error: null as unknown },
  removed: [] as string[][],
}));

vi.mock("./db", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: async (path: string, bytes: Buffer, options: unknown) => {
          storage.uploads.push({ path, bytes, options });
          return { data: null, error: storage.uploadError };
        },
        download: async () => storage.download,
        remove: async (paths: string[]) => {
          storage.removed.push(paths);
          return { data: [], error: null };
        },
      }),
    },
  },
}));

import {
  InvalidPhotoError,
  decodePhotoDataUrl,
  deleteStoredPhotos,
  preparePhoto,
  readStoredPhoto,
  storePhoto,
} from "./photos";

const ID = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";

/** A real image, with EXIF metadata including a GPS-like comment, as a data URL */
async function photoDataUrl(width: number, height: number, format: "png" | "jpeg" = "jpeg") {
  const bytes = await sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 120, b: 40 } },
  })
    .withExif({ IFD0: { ImageDescription: "GPS 29.65,-82.32" } })
    [format]()
    .toBuffer();
  return `data:image/${format};base64,${bytes.toString("base64")}`;
}

beforeEach(() => {
  storage.uploads = [];
  storage.uploadError = null;
  storage.download = { data: null, error: null };
  storage.removed = [];
});

describe("decodePhotoDataUrl", () => {
  it("accepts JPEG, PNG and WebP, and nothing that could run script", () => {
    expect(decodePhotoDataUrl("data:image/png;base64,iVBORw==")).toEqual(
      Buffer.from("iVBORw==", "base64"),
    );
    expect(decodePhotoDataUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(decodePhotoDataUrl("https://example.com/photo.jpg")).toBeNull();
  });
});

describe("preparePhoto", () => {
  it("makes a full-size JPEG and a 320 px thumbnail, without the photo's metadata", async () => {
    const bytes = decodePhotoDataUrl(await photoDataUrl(2400, 1800, "png"))!;
    const { full, thumb } = await preparePhoto(bytes);

    const fullInfo = await sharp(full).metadata();
    const thumbInfo = await sharp(thumb).metadata();
    expect(fullInfo).toMatchObject({ format: "jpeg", width: 1600, height: 1200 });
    expect(thumbInfo).toMatchObject({ format: "jpeg", width: 320, height: 240 });
    expect(fullInfo.exif).toBeUndefined();
    expect(thumbInfo.exif).toBeUndefined();
  });

  it("never enlarges a small photo", async () => {
    const { full, thumb } = await preparePhoto(decodePhotoDataUrl(await photoDataUrl(200, 100))!);
    expect((await sharp(full).metadata()).width).toBe(200);
    expect((await sharp(thumb).metadata()).width).toBe(200);
  });

  it("refuses data that isn't an image", async () => {
    await expect(preparePhoto(Buffer.from("not an image"))).rejects.toBeInstanceOf(
      InvalidPhotoError,
    );
  });
});

describe("storePhoto", () => {
  it("uploads the photo and thumbnail under the submission's ID, never replacing one", async () => {
    await expect(storePhoto(ID, await photoDataUrl(800, 600))).resolves.toBe(`${ID}/photo.jpg`);
    expect(storage.uploads.map((u) => u.path)).toEqual([`${ID}/photo.jpg`, `${ID}/thumb.jpg`]);
    expect(storage.uploads[0].options).toMatchObject({ contentType: "image/jpeg", upsert: false });
  });

  it("treats a photo that's already stored (a resent report) as done", async () => {
    storage.uploadError = { message: "The resource already exists", statusCode: "409" };
    await expect(storePhoto(ID, await photoDataUrl(100, 100))).resolves.toBe(`${ID}/photo.jpg`);
  });

  it("passes other storage errors on", async () => {
    storage.uploadError = { message: "Bucket not found", statusCode: "404" };
    await expect(storePhoto(ID, await photoDataUrl(100, 100))).rejects.toEqual(storage.uploadError);
  });

  it("refuses formats it doesn't store", async () => {
    await expect(storePhoto(ID, "data:image/svg+xml;base64,PHN2Zz4=")).rejects.toBeInstanceOf(
      InvalidPhotoError,
    );
    expect(storage.uploads).toEqual([]);
  });
});

describe("reading and deleting stored photos", () => {
  it("returns a stored photo's bytes, or null when the file isn't there", async () => {
    storage.download = { data: new Blob([Buffer.from("jpeg bytes")]), error: null };
    await expect(readStoredPhoto(ID, "thumb")).resolves.toEqual(Buffer.from("jpeg bytes"));

    storage.download = { data: null, error: { message: "Object not found", status: 404 } };
    await expect(readStoredPhoto(ID, "full")).resolves.toBeNull();
  });

  it("deletes both files", async () => {
    await deleteStoredPhotos(ID);
    expect(storage.removed).toEqual([[`${ID}/photo.jpg`, `${ID}/thumb.jpg`]]);
  });
});
