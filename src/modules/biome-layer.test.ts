// @vitest-environment jsdom
import {describe, it, expect} from "vitest";
import "./biomes";

describe("When the height is less than 20", () => {
    it("returns 0 for all water cells: marine biome", () => {
        expect((globalThis as any).Biomes.getId(0, 0, 10, false)).toBe(0);
    })
})



