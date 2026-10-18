import { expect, test } from "@playwright/test";

test("home page shows its calls to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /submit a sighting/i }).first()).toHaveAttribute(
    "href",
    "/submit",
  );
  await expect(page.getByRole("link", { name: /browse the id guide/i }).first()).toHaveAttribute(
    "href",
    "/guide",
  );
});

test("about page loads", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: /About/ }).first()).toBeVisible();
});

test.describe("guide", () => {
  test("lists every plant and searches them", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.getByText("Showing 17 of 17")).toBeVisible();

    await page.getByPlaceholder(/Search plants/).fill("cogon");
    await expect(page.getByText("Showing 1 of 17")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cogon Grass" })).toBeVisible();
  });

  test("switches to Spanish", async ({ page }) => {
    await page.goto("/guide");
    await page.locator("select").first().selectOption("es");
    await expect(
      page.getByRole("heading", { name: /Guía de Identificación de Plantas Invasoras/ }),
    ).toBeVisible();
  });
});

test.describe("sign-in pages", () => {
  test("sign-in shows Clerk's form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/Welcome back to/)).toBeVisible();
    await expect(page.locator(".cl-rootBox, .cl-signIn-root").first()).toBeVisible();
  });

  test("sign-up shows Clerk's form", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByText(/Create an account/)).toBeVisible();
    await expect(page.locator(".cl-rootBox, .cl-signUp-root").first()).toBeVisible();
  });
});

test("map page shows the map, the CSV export and the filters", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("heading", { name: "Alachua County Invasive Plant Map" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Export CSV/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Filter Sightings/ })).toBeVisible();
});

test.describe("signed-out visitors", () => {
  for (const path of ["/log", "/dashboard"]) {
    test(`are sent to sign in from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/sign-in/);
    });
  }

  test("only see approved submissions", async ({ request }) => {
    for (const url of ["/api/submissions", "/api/submissions?all=true"]) {
      const response = await request.get(url);
      expect(response.ok()).toBe(true);
      const submissions: { status: string; userId: string | null }[] = await response.json();
      for (const submission of submissions) {
        expect(submission.status).toBe("approved");
        expect(submission.userId).toBeNull();
      }
    }
  });
});

test("pages are sent with the security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
});
