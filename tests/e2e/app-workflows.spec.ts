import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", content: "Community-powered invasive plant observations" },
  { path: "/about", content: "Our Mission" },
  { path: "/guide", content: "Alachua County Invasive Plant ID Guide" },
  { path: "/map", content: "Alachua County Invasive Plant Map" },
  { path: "/submit?plant=Air%20Potato", content: "Prefilled from guide" },
  // { path: "/dashboard?demo=1", content: "Citizen Scientist Dashboard" },
  { path: "/sign-in", content: "Sign in to submit and manage plant sightings" },
  { path: "/sign-up", content: "Create an account to start contributing plant sightings" },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/submissions", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/users/me", (route) =>
    route.fulfill({ json: { id: "test-user", role: "user" } })
  );
});

for (const route of publicRoutes) {
  test(`renders ${route.path}`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByText(route.content, { exact: false }).first()).toBeVisible();
  });
}

test("filters the plant guide and changes language", async ({ page }) => {
  await page.route("https://**/*", (route) => route.abort());
  await page.goto("/guide");

  await page.getByPlaceholder(/Search plants/).fill("Dioscorea bulbifera");
  await expect(page.getByRole("heading", { name: "Alachua County Invasive Plant ID Guide" })).toBeVisible();
  await expect(page.getByText("Showing 1 of 17")).toBeVisible();
  await expect(page.getByText("Air Potato", { exact: true }).first()).toBeVisible();

  await page.locator("select").first().selectOption("es");
  await expect(page.getByRole("heading", { name: /Guía de Identificación/ })).toBeVisible();
});

/*
test("demo dashboard completes an onboarding step", async ({ page }) => {
  await page.goto("/dashboard?demo=1");

  await expect(page.getByText("0% complete")).toBeVisible();
  await page.getByRole("button", { name: /Review the guide/ }).click();
  await expect(page.getByText("33% complete")).toBeVisible();
  await expect(page.getByText("Demo onboarding step completed.")).toBeVisible();
});

test("demo sign-in opens the dashboard without an account", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue as Demo User" }).click();
  await expect(page).toHaveURL(/\/dashboard\?demo=1/);
  await expect(page.getByRole("heading", { name: /Welcome back, Demo/ })).toBeVisible();
});
*/

test("redirects protected log access to sign-in", async ({ page }) => {
  await page.goto("/log", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/sign-in/);
});

test("map filters visible reports and exports only the filtered results", async ({ page }) => {
  await page.route("**/api/submissions", (route) => route.fulfill({ json: [
    { _id: "air-potato", plantName: "Air Potato", scientificName: "Dioscorea bulbifera", lat: 29.65, lng: -82.32, timestamp: 1_700_000_000_000, status: "approved" },
    { _id: "wild-taro", plantName: "Wild Taro", scientificName: "Colocasia esculenta", lat: 29.66, lng: -82.31, timestamp: 1_700_000_000_100, status: "approved" },
    { _id: "pending", plantName: "Camphor", lat: 29.67, lng: -82.30, timestamp: 1_700_000_000_200, status: "pending" },
  ] }));

  await page.goto("/map", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /Export CSV \(2 shown\)/ })).toBeEnabled();
  await page.getByRole("button", { name: /Filter Sightings/ }).click();
  await page.getByLabel("Air Potato").check();
  await expect(page.getByRole("button", { name: /Export CSV \(1 shown\)/ })).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export CSV/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^swamp-spotter-map-export-.*\.csv$/);
});

test("submits an anonymous plant report with a photo and browser location", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"], { origin: "http://localhost:3100" });
  await context.setGeolocation({ latitude: 29.6516, longitude: -82.3248 });

  await page.route("**/api/identify-plant", (route) =>
    route.fulfill({
      json: {
        prediction: "Air Potato",
        scientificName: "Dioscorea bulbifera",
        isKnownPlant: true,
      },
    })
  );

  let submittedPayload: Record<string, unknown> | undefined;
  await page.route("**/api/submissions", async (route) => {
    if (route.request().method() === "POST") {
      submittedPayload = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, id: "submission-e2e" } });
      return;
    }
    await route.fulfill({ json: [] });
  });

  await page.goto("/submit?plant=Air%20Potato");
  await expect(page.getByLabel("Submit anonymously")).toBeChecked();
  await expect(page.getByLabel("Select Plant Species *")).toHaveValue("Air Potato");
  await page.getByLabel("Additional Notes").fill("Observed near the boardwalk.");
  await page.locator('input[type="file"]').setInputFiles({
    name: "plant.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "base64"),
  });

  await expect(page.getByText("Air Potato", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: /Submit Plant/ }).click();
  await expect(page.getByText("Plant submitted successfully")).toBeVisible();
  expect(submittedPayload).toMatchObject({
    plantName: "Air Potato",
    lat: 29.6516,
    lng: -82.3248,
    notes: "Observed near the boardwalk.",
    anonymous: true,
  });
});