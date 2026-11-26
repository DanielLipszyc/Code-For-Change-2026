import { expect, test } from "@playwright/test";

test.skip(process.env.E2E_DEMO !== "1", "Requires the development-only dashboard demo.");

test("the dashboard shows the community feed and more observers", async ({ page }) => {
  await page.goto("/dashboard?demo=1");
  await expect(page.getByText("Iris North logged Wild Taro")).toBeVisible();
  await expect(page.getByText("Jordan Marsh")).toHaveCount(0);
  await page.getByRole("button", { name: "Show more observers" }).click();
  await expect(page.getByText("Jordan Marsh")).toBeVisible();
  await page.getByRole("button", { name: "Following", exact: true }).click();
  await expect(page.getByText("Mara Rivers logged Water Hyacinth")).toBeVisible();
  await expect(page.getByText("Iris North logged Wild Taro")).toHaveCount(0);
});

test("activity links open the map list and the matching guide entry", async ({ page }) => {
  await page.goto("/dashboard?demo=1");
  await expect(page.getByRole("link", { name: "View Log", exact: true })).toHaveAttribute(
    "href",
    "/log",
  );
  const species = page.getByRole("link", { name: "View Cogon Grass in the plant guide" });
  await expect(species).toHaveAttribute("href", "/guide?plant=Cogon%20Grass");
  await species.click();
  await expect(page).toHaveURL(/\/guide\?plant=Cogon%20Grass/);
  await expect(
    page.getByRole("heading", { name: "Alachua County Invasive Plant ID Guide" }),
  ).toBeVisible();
  await page.goBack();

  await page.getByRole("link", { name: "View log →", exact: true }).click();
  await expect(page).toHaveURL(/\/map\?view=list/);
  await expect(page.getByRole("tab", { name: "List" })).toHaveAttribute("aria-selected", "true");
});
