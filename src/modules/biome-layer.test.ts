// @vitest-environment jsdom
import {describe, it, expect} from "vitest";
import "./biomes";

describe("When the height is less than 20", () => {
    it("returns 0 for all water cells: marine biome", () => {
        expect((globalThis as any).Biomes.getId(0, 0, 10, false)).toBe(0);
    })
})

describe("When the temperature is less than -5", () =>{
    it("returns 11 for too cold: permafrost biome", ()=> {
        expect((globalThis as any).Biomes.getId(21, -6, 21, false)).toBe(11);
    })
})

describe("When the temperature is more than or equal to 25 and has no river and moisture is less than 8", () => {
    it("returns 1 for too hot and dry: hot desert biome", () => {
        expect((globalThis as any).Biomes.getId(7, 25, 21, false)).toBe(1);
    })
})


