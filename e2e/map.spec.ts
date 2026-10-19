import { expect, test, type Page } from "@playwright/test";

/** Approved sightings, the ones a signed-out visitor sees on the map */
async function approvedSightings(page: Page): Promise<{ id: string; plantName: string }[]> {
  const response = await page.request.get("/api/submissions?status=approved");
  expect(response.ok()).toBe(true);
  return response.json();
}

/** Sighting markers (the county outline isn't interactive, so it isn't counted) */
const markers = (page: Page) => page.getByTestId("map").locator("path.leaflet-interactive");

/** The zoom level of the map tiles currently shown */
async function tileZoom(page: Page): Promise<string> {
  const src = await page.locator(".leaflet-tile-loaded").first().getAttribute("src");
  return src!.split("/").at(-3)!;
}

test("draws every approved sighting from the page itself, without waiting for location", async ({
  page,
}) => {
  const approved = await approvedSightings(page);

  // The sightings are built into the page: loading it asks the API for nothing
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url());
  });

  // No location permission is granted, so this also checks the map doesn't wait for it
  await page.goto("/map");
  await expect(markers(page)).toHaveCount(approved.length);
  await expect(page.getByText(`(${approved.length} shown)`)).toBeVisible();
  await expect(page.getByTestId("map").locator(".leaflet-tile-loaded").first()).toBeVisible();
  expect(apiCalls).toEqual([]);
});

// Tagged @perf: runs alone with npm run test:perf, since parallel tests slow
// each other down
test("the map and its sightings appear quickly @perf", async ({ page }) => {
  const approved = await approvedSightings(page);
  test.skip(approved.length === 0, "needs at least one approved sighting");

  await page.goto("/map");
  await expect(markers(page).first()).toBeVisible();
  const msToMarkers = await page.evaluate(() => performance.now());
  // Measured against a local production build (about 0.5 s on a laptop).
  // Tiles come from the internet, so they aren't part of this budget.
  expect(msToMarkers).toBeLessThan(2500);
});

test("filtering redraws the markers without moving the map or reloading tiles", async ({
  page,
}) => {
  const approved = await approvedSightings(page);
  test.skip(approved.length === 0, "needs at least one approved sighting");
  const plant = approved[0].plantName;
  const matching = approved.filter((s) => s.plantName === plant).length;

  await page.goto("/map");
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(() => tileZoom(page)).toBe("11");
  await page.waitForLoadState("networkidle");

  const tileRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname === "tile.openstreetmap.org") {
      tileRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: /Filter Sightings/ }).click();
  await page.getByRole("checkbox", { name: plant }).check();

  await expect(markers(page)).toHaveCount(matching);
  await expect(page.getByText(`Showing ${matching} of ${approved.length} sightings`)).toBeVisible();
  // Rebuilding the map would have reset the zoom to 10 and fetched tiles again
  expect(await tileZoom(page)).toBe("11");
  expect(tileRequests).toEqual([]);
});

test("opens a sighting's details from its marker, and closes them with Escape", async ({
  page,
}) => {
  const approved = await approvedSightings(page);
  test.skip(approved.length === 0, "needs at least one approved sighting");

  await page.goto("/map");
  // Markers can overlap at county zoom; force clicks the first one wherever it is
  await markers(page).first().click({ force: true });
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

test("the list view shows the same sightings and opens them from the keyboard", async ({
  page,
}) => {
  const approved = await approvedSightings(page);

  await page.goto("/map");
  await page.getByRole("tab", { name: "List" }).click();
  await expect(page).toHaveURL(/view=list/);

  const rows = page.getByRole("listitem").getByRole("button");
  await expect(rows).toHaveCount(Math.min(approved.length, 30));
  test.skip(approved.length === 0, "needs at least one approved sighting");

  await rows.first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByText("Spotted:")).toBeVisible();
});

test("the old sightings page opens the list view", async ({ page }) => {
  await page.goto("/sightings");
  await expect(page).toHaveURL(/\/map\?view=list/);
  await expect(page.getByRole("tab", { name: "List" })).toHaveAttribute("aria-selected", "true");
});

test("loads no marker images from other sites", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    const isTile = url.hostname === "tile.openstreetmap.org";
    if (request.resourceType() === "image" && url.hostname !== "localhost" && !isTile) {
      outside.push(request.url());
    }
  });

  await page.goto("/map");
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  expect(outside).toEqual([]);
});
