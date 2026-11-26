import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { plants as seedPlants } from "@/data/plants";
import type { Plant } from "@/types/plant";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en", t: (key: string) => key }),
}));

import GuideClient from "./GuideClient";

beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

const plants: Plant[] = seedPlants.slice(0, 2).map((plant, index) => ({
  ...plant,
  id: String(index),
  slug: plant.name.toLowerCase().replaceAll(" ", "-"),
  leaf: {},
  flower: {},
  reproductive_structure: {},
  form: {},
  images: [],
}));

describe("guide plant links", () => {
  it("opens the requested plant's details", () => {
    const html = renderToStaticMarkup(
      React.createElement(GuideClient, { plants, requestedPlant: plants[1].name }),
    );
    const dialog = html.slice(html.indexOf('role="dialog"'));
    expect(dialog).toContain(plants[1].scientificName);
    expect(dialog).not.toContain(plants[0].scientificName);
  });

  it("explains when a requested plant is no longer in the guide", () => {
    const html = renderToStaticMarkup(
      React.createElement(GuideClient, { plants, requestedPlant: "Missing Plant" }),
    );
    expect(html).toContain("This plant is not currently in the guide.");
    expect(html).not.toContain('role="dialog"');
  });

  it("keeps the normal guide closed when no plant is requested", () => {
    const html = renderToStaticMarkup(React.createElement(GuideClient, { plants }));
    expect(html).not.toContain('role="dialog"');
  });
});
