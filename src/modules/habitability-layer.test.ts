// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import "./biomes";

describe("habitability range", () => {
  const habitability = (globalThis as any).Biomes.getDefault().habitability;
  it("all habitability values are numbers within [0, 100]", () => {
    for (let i = 0; i < habitability.length; i++) {
      const v = habitability[i];
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("habitability mapping", () => {
  const Biomes = (globalThis as any).Biomes;
  const habitability = Biomes.getDefault().habitability;

  it("returns habitability of 0 for all water cells: marine biome", () => {
    const id = (globalThis as any).Biomes.getId(0, 0, 10, false);
    expect(habitability[id]).toBe(0);
  });

  it("returns habitability of 0 for too cold: permafrost biome", () => {
    const id = (globalThis as any).Biomes.getId(21, -6, 21, false);
    expect(habitability[id]).toBe(0);
  });

  it("returns habitability of 4 for too hot and dry: hot desert biome", () => {
    const id = (globalThis as any).Biomes.getId(7, 25, 21, false);
    expect(habitability[id]).toBe(4);
  });

  it("returns habitability of 12 for too wet: wetland biome", () => {
    const id = (globalThis as any).Biomes.getId(41, 20, 24, false);
    expect(habitability[id]).toBe(12);
  });

  it("returns habitability of 12 for too wet: wetland biome", () => {
    const id = (globalThis as any).Biomes.getId(25, 20, 25, false);
    expect(habitability[id]).toBe(12);
  });
});
