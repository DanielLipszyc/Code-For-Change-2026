import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({
    t: (key: string, values?: Record<string, string>) =>
      Object.entries(values ?? {}).reduce(
        (message, [name, value]) => message.replaceAll(`{${name}}`, value),
        key,
      ),
  }),
}));

import PlantIdSuggestion, { type PlantIdResult } from "./PlantIdSuggestion";

beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

function render(result: PlantIdResult) {
  return renderToStaticMarkup(
    React.createElement(PlantIdSuggestion, {
      online: true,
      signedIn: true,
      identifying: false,
      result,
      chosen: "",
      compare: false,
      onUseSuggestion: () => {},
    }),
  );
}

describe("plant identification guidance", () => {
  it("shows both candidates for ambiguous results", () => {
    const html = render({
      status: "ambiguous",
      prediction: "Unknown Plant",
      scientificName: null,
      isKnownPlant: false,
      candidates: [
        { name: "Air Potato", scientificName: "Dioscorea bulbifera" },
        { name: "Cogon Grass", scientificName: "Imperata cylindrica" },
      ],
    });
    expect(html).toContain("Air Potato");
    expect(html).toContain("Cogon Grass");
  });

  it("offers the guide when identification is uncertain", () => {
    const html = render({
      status: "uncertain",
      prediction: "Unknown Plant",
      scientificName: null,
      isKnownPlant: false,
      candidates: [],
    });
    expect(html).toContain("choose Unknown / Other below");
    expect(html).toContain('href="/guide"');
  });
});
