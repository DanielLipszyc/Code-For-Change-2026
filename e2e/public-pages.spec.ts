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

test("home page uses a muted background video with the forest image as fallback", async ({
  page,
}) => {
  await page.goto("/");
  const video = page.locator(".hero-background-video");
  await expect(video).toHaveAttribute("autoplay", "");
  await expect(video).toHaveAttribute("muted", "");
  await expect(video).toHaveAttribute("loop", "");
  await expect(video).toHaveAttribute("playsinline", "");
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect(video).toHaveAttribute("poster", "/forest.jpg");
  await expect(video.locator("source")).toHaveAttribute("src", "/depot-background.mp4");
  const videoResponse = await page.request.get("/depot-background.mp4", {
    headers: { Range: "bytes=0-1023" },
  });
  expect(videoResponse.status()).toBe(206);
  const totalBytes = Number(videoResponse.headers()["content-range"]?.split("/").at(-1));
  expect(Number.isFinite(totalBytes)).toBe(true);
  expect(totalBytes).toBeLessThanOrEqual(20 * 1024 * 1024);
});

test("home page stays responsive while the background video is delayed @perf", async ({ page }) => {
  let releaseVideoResponse = () => {};
  const videoResponseBlocked = new Promise<void>((resolve) => {
    releaseVideoResponse = resolve;
  });
  let videoRequestStarted = false;
  let videoRequestFinished = false;
  await page.route("**/depot-background.mp4", async (route) => {
    videoRequestStarted = true;
    await videoResponseBlocked;
    await route.continue();
    videoRequestFinished = true;
  });

  try {
    const startedAt = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 5_000 });
    await expect(page.getByRole("heading", { name: /Swamp Spotter/ })).toBeVisible({
      timeout: 2_500,
    });
    expect(Date.now() - startedAt).toBeLessThan(2_500);
    await expect.poll(() => videoRequestStarted).toBe(true);

    await page.getByRole("button", { name: "Next slide" }).click({ timeout: 2_500 });
    await expect(page.getByText("Capture what you find")).toBeVisible();
    expect(videoRequestFinished).toBe(false);
  } finally {
    releaseVideoResponse();
    if (videoRequestStarted) {
      await expect.poll(() => videoRequestFinished).toBe(true);
    }
  }
});

test("home page keeps its background video visible with reduced motion enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator(".hero-background-video")).toBeVisible();
});

test("home slideshow controls change slides and toggle pause", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Spot plants in Alachua County parks")).toBeVisible();
  const supportsHover = await page.evaluate(() => window.matchMedia("(hover: hover)").matches);

  await page.getByRole("button", { name: "Next slide" }).click();
  await expect(page.getByText("Capture what you find")).toBeVisible();
  await expect(
    page.getByRole("button", { name: supportsHover ? "Resume slideshow" : "Pause slideshow" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Go to slide 3" }).click();
  await expect(page.getByText("Power a community map")).toBeVisible();

  if (!supportsHover) {
    await page.getByRole("button", { name: "Pause slideshow" }).click();
    await expect(page.getByRole("button", { name: "Resume slideshow" })).toBeVisible();
  }
  await page.getByRole("button", { name: "Resume slideshow" }).click();
  await expect(page.getByRole("button", { name: "Pause slideshow" })).toBeVisible();
});

test("home slideshow is compact on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 384, height: 512 });
  await page.goto("/");

  const slideshow = await page.getByTestId("home-slideshow").boundingBox();
  const image = await page.getByTestId("home-slideshow-image").boundingBox();
  expect(slideshow?.width).toBeLessThanOrEqual(340);
  expect(slideshow?.height).toBeLessThan(370);
  expect(image?.height).toBe(190);
  await expect(page.getByText("Tip: hover to pause the slideshow.")).toBeHidden();
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
  test("navigation does not show sign-in warnings", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav").getByText("Sign in required", { exact: true })).toHaveCount(0);
  });

  for (const path of ["/log", "/dashboard"]) {
    test(`are sent to sign in from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/sign-in/);
    });
  }

  test("can open the anonymous submission form", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.getByLabel("Submit anonymously", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Submit anonymously", { exact: true })).toBeDisabled();
    await expect(page.getByText("Add a photo to save or submit a report.")).toBeVisible();
  });

  test("submits anonymously and explains the review process", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 29.65, longitude: -82.32 });
    let identificationRequests = 0;
    await page.route("**/api/identify-plant", async (route) => {
      identificationRequests++;
      await route.fulfill({ status: 401 });
    });
    await page.route("**/api/submissions", async (route) => {
      await route.fulfill({ json: { success: true } });
    });
    await page.goto("/submit");
    await page.locator("#photo").setInputFiles("public/logo.png");
    await expect(
      page.getByText(
        "Sign in for an AI suggestion, or use the guide and choose a plant or Unknown / Other below.",
      ),
    ).toBeVisible();
    expect(identificationRequests).toBe(0);
    await expect(page.getByText("Choose a plant or Unknown / Other to submit.")).toBeVisible();
    await page.locator("#plantName").selectOption("Unknown");
    const request = page.waitForRequest(
      (request) => request.url().endsWith("/api/submissions") && request.method() === "POST",
    );
    await page.getByRole("button", { name: "Submit Plant" }).click();
    expect((await request).postDataJSON()).toMatchObject({ anonymous: true, plantName: "Unknown" });
    await expect(
      page.getByText("Your report may need review before it appears on the public map."),
    ).toBeVisible();
  });

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
