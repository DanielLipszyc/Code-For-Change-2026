import { expect, test } from "@playwright/test";

test("home page loads its images through the image optimizer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();

  const stepImages = page.getByRole("img", {
    name: /Phone taking a picture|Magnifying glass|Mouse clicking/,
  });
  const visible = stepImages.filter({ visible: true });
  await expect(visible).toHaveCount(3);
  for (const image of await visible.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("src", /\/_next\/image/);
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  }
});

test.describe("guide", () => {
  test("lists every plant and searches them", async ({ page }) => {
    await page.goto("/guide", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Showing 17 of 17")).toBeVisible();

    await page.getByRole("textbox", { name: "Search plants" }).fill("cogon");
    await expect(page.getByText("Showing 1 of 17")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cogon Grass" })).toBeVisible();
  });

  test("shows the corrected plant names", async ({ page }) => {
    await page.goto("/guide", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Coral Ardisia" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Caesar's Weed" })).toBeVisible();
  });

  test("the report link sends the stored English name, even in Spanish", async ({
    page,
  }, testInfo) => {
    await page.goto("/guide", { waitUntil: "domcontentloaded" });
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "Open main menu" }).click();
    }
    await page.getByRole("combobox", { name: "Language" }).selectOption("es");
    await page.getByRole("textbox", { name: "Buscar plantas" }).fill("cogon");

    await page.getByRole("button", { name: /Hierba Cogon/ }).click();
    const report = page.getByRole("dialog").getByRole("link", { name: "Reportar esta planta" });
    await expect(report).toHaveAttribute("href", "/submit?plant=Cogon%20Grass");
  });

  test("switches guide content and plant tips to Portuguese", async ({ page }, testInfo) => {
    await page.goto("/guide", { waitUntil: "domcontentloaded" });
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "Open main menu" }).click();
    }
    await page.getByRole("combobox", { name: "Language" }).selectOption("pt");

    await expect(page.locator("html")).toHaveAttribute("lang", "pt");
    await expect(
      page.getByRole("heading", {
        name: "Guia de identificação de plantas invasoras do condado de Alachua",
      }),
    ).toBeVisible();
    await page.getByRole("heading", { name: "Cará-do-ar" }).click();
    await expect(page.getByRole("dialog").getByText("Identificação rápida")).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByText("Folhas pontudas em formato de coração e tubérculos que crescem na trepadeira."),
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Relatar esta planta" }),
    ).toHaveAttribute("href", "/submit?plant=Air%20Potato");

    await page.goto("/map", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Mapa de plantas invasoras do condado de Alachua" }),
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

test.describe("signed-out visitors", () => {
  for (const path of ["/log", "/dashboard", "/submit"]) {
    test(`are sent to sign in from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/sign-in/);
    });
  }

  test("only see approved submissions, without their owners", async ({ request }) => {
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

  test("can't change submissions through the API", async ({ request }) => {
    const id = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";
    for (const response of [
      await request.delete(`/api/submissions/${id}`),
      await request.put(`/api/submissions/${id}`, { data: { notes: "x" } }),
      await request.post(`/api/submissions/${id}/approve`),
    ]) {
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized - Please sign in" });
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
