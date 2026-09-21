import { describe, expect, it } from "vitest";
import { getMapAdapter, OPENFREEMAP_STYLE_URL } from "@/lib/maps";

describe("map adapter style", () => {
  it("uses the official OpenFreeMap Liberty style without an API key", () => {
    const adapter = getMapAdapter();
    expect(OPENFREEMAP_STYLE_URL).toBe("https://tiles.openfreemap.org/styles/liberty");
    expect(adapter.style.styleUrl).toBe(OPENFREEMAP_STYLE_URL);
    expect(adapter.style.styleUrl).not.toContain("positron");
    expect(adapter.style.attribution).toContain("© OpenStreetMap contributors");
    expect(adapter.style.attribution).toContain("OpenFreeMap");
    expect(adapter.providerName).toBe("maplibre-openfreemap");
  });

  it("keeps an empty last-resort style only for total style-load failure", () => {
    const adapter = getMapAdapter();
    expect(adapter.fallbackStyle).toMatchObject({
      version: 8,
      sources: {},
    });
  });
});
