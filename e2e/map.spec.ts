import { expect, test, type Page } from "@playwright/test";

/** Approved sightings, the ones a signed-out visitor sees on the map */
async function approvedSightings(page: Page): Promise<{ plantName: string }[]> {
  const response = await page.request.get("/api/submissions");
  expect(response.ok()).toBe(true);
  const all: { plantName: string; status: string }[] = await response.json();
  return all.filter((s) => s.status === "approved");
}

/** The zoom level of the map tiles currently shown */
async function tileZoom(page: Page): Promise<string> {
  const src = await page.locator(".leaflet-tile-loaded").first().getAttribute("src");
  return src!.split("/").at(-3)!;
}

test("shows every approved sighting as a pin, without waiting for location", async ({ page }) => {
  const approved = await approvedSightings(page);

  // No location permission is granted, so this also checks the map doesn't wait for it
  await page.goto("/map");
  const map = page.getByTestId("map");
  await expect(map.locator(".leaflet-tile-loaded").first()).toBeVisible();
  await expect(map.locator(".leaflet-marker-icon")).toHaveCount(approved.length);
  await expect(page.getByText(`(${approved.length} shown)`)).toBeVisible();
});

test("filtering redraws the pins but keeps the map where it is", async ({ page }) => {
  const approved = await approvedSightings(page);
  test.skip(approved.length === 0, "needs at least one approved sighting");
  const plant = approved[0].plantName;
  const matching = approved.filter((s) => s.plantName === plant).length;

  await page.goto("/map");
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(() => tileZoom(page)).toBe("11");

  await page.getByRole("button", { name: /Filter Sightings/ }).click();
  await page.getByRole("checkbox", { name: plant }).check();

  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(matching);
  await expect(page.getByText(`Showing ${matching} of ${approved.length} sightings`)).toBeVisible();
  // Rebuilding the map would have reset the zoom to 10
  expect(await tileZoom(page)).toBe("11");
});

test("opens a sighting's details from its pin, and closes them with Escape", async ({ page }) => {
  const approved = await approvedSightings(page);
  test.skip(approved.length === 0, "needs at least one approved sighting");

  await page.goto("/map");
  // Pins can overlap at county zoom, so open one from the keyboard rather than
  // clicking a spot another pin may cover (this also checks keyboard access)
  await page.locator(".leaflet-marker-icon").first().press("Enter");
  await page.getByRole("button", { name: "More details" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Spotted:")).toBeVisible();
  // The photo loads from its own URL, or the dialog says there isn't one
  await expect
    .poll(
      async () =>
        (await dialog.getByText("No photo provided").isVisible()) ||
        (await dialog
          .locator("img")
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)
          .catch(() => false)),
      { timeout: 30_000 },
    )
    .toBe(true);
  // Signed-out visitors can't change anything
  await expect(dialog.getByRole("button", { name: /Edit|Delete|Approve/ })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("loads no marker images from other sites", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    const isTile = url.hostname.endsWith("tile.openstreetmap.org");
    if (request.resourceType() === "image" && url.hostname !== "localhost" && !isTile) {
      outside.push(request.url());
    }
  });

  await page.goto("/map");
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  expect(outside).toEqual([]);
});
