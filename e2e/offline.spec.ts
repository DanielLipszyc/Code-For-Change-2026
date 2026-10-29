import { expect, test, type Page } from "@playwright/test";

/** Wait until the service worker controls the page */
async function serviceWorkerReady(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
      );
    }
  });
}

// Both install a service worker and load pages several times, which is slow
// while the other tests run alongside
test.describe.configure({ timeout: 90_000 });

test("pages opened online still open offline", async ({ page, context }) => {
  await page.goto("/guide");
  await serviceWorkerReady(page);
  // Opened again now that the service worker is in charge, so it keeps a copy
  await page.reload();
  await expect(page.getByText("Showing 17 of 17")).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Showing 17 of 17")).toBeVisible();
  // The page works, not just its HTML: searching still filters
  await page.getByRole("textbox", { name: "Search plants" }).fill("cogon");
  await expect(page.getByText("Showing 1 of 17")).toBeVisible();
});

test("a page never opened shows the offline page", async ({ page, context }) => {
  await page.goto("/");
  await serviceWorkerReady(page);

  await context.setOffline(true);
  await page.goto("/contact");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Report a sighting" })).toHaveAttribute(
    "href",
    "/submit",
  );
});

test("the old offline mode's address goes to the submit page", async ({ request }) => {
  const response = await request.get("/offline-submit", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/submit");
});
