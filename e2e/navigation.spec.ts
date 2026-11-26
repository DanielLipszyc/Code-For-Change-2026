import { expect, test } from "@playwright/test";

test("desktop navigation has space between controls without overflowing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("swamp-spotter-offline", 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction("reports", "readwrite");
          transaction.objectStore("reports").put({ id: "test-draft", savedAt: 1, ownerId: null });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
  await page.reload();

  const nav = page.locator("nav").first();
  const dashboard = nav.locator('a[href="/dashboard"]').filter({ visible: true });
  const signIn = nav.locator('a[href="/sign-in"]').filter({ visible: true });
  const language = nav.getByTestId("language-selector").filter({ visible: true });
  await expect(nav.locator('a[href="/drafts"]').filter({ visible: true })).toBeVisible();
  await expect(signIn).toBeVisible();

  for (const locale of ["en", "es", "pt"]) {
    await language.selectOption(locale);
    await expect
      .poll(async () => {
        const boxes = await Promise.all([
          dashboard.boundingBox(),
          signIn.boundingBox(),
          language.boundingBox(),
        ]);
        if (boxes.some((box) => !box)) return false;
        const [lastLink, account, selector] = boxes;
        return (
          account!.x - (lastLink!.x + lastLink!.width) >= 15 &&
          selector!.x - (account!.x + account!.width) >= 15 &&
          selector!.x + selector!.width <= 1280
        );
      })
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      1280,
    );
  }
});

test("narrower screens keep the navigation in the menu", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open main menu" }).click();
  await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
});
