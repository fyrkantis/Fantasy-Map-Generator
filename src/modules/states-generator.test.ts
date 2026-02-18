// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import "./states-generator";

const TEST_PACK = {
  cells: {
    i: [0, 1, 2],
    h: [30, 30, 30],
    burg: [0, 0, 0],
    state: [1, 2, 2],
    c: [[1, 2], [0, 2], [0, 1]],
  },
  burgs: [{}],
  states: [{}, { lock: false }, { lock: false }],
}

beforeEach(() => {
  (globalThis as any).TIME = undefined;
  (globalThis as any).pack = undefined;
})

describe("normalize", () => {
	describe("when 3 neighboring cells have h >= 20 and the first has a different state", () => {
		it("should copy state from neighboring cell", () => {
      const pack = TEST_PACK;
      (globalThis as any).pack = pack
      window.States.normalize();
      expect(globalThis.pack).toStrictEqual({ ...pack, cells: { ...pack.cells, state: [2, 2, 2]}});
    });
	});
  describe("when 3 neighboring cells have h < 20 except the second, and the first has a different state", () => {
    it("should not change any cell states", () => {
      const pack = {
        ...TEST_PACK,
        cells: {
          ...TEST_PACK.cells,
          h: [20, 19, 20],
        }
      };
      (globalThis as any).pack = pack
      window.States.normalize();
      expect(globalThis.pack).toStrictEqual(pack);
    });
  });
  describe("when the first out of 3 neighboring cells has a different state but is a burg", () => {
    it("should not change any cell states", () => {
      const pack = {
        ...TEST_PACK,
        cells: {
          ...TEST_PACK.cells,
          burg: [1, 0, 0],
        },
        burgs: [{}, {}]
      };
      (globalThis as any).pack = pack
      window.States.normalize();
      expect(globalThis.pack).toStrictEqual(pack);
    });
  });
  describe("when the first out of 3 neighboring cells has a different state and but it's locked", () => {
    it("should not change any cell states", () => {
      const pack = {
        ...TEST_PACK,
        states: [{}, {locked: true}, {locked: false}],
      };
      (globalThis as any).pack = pack
      window.States.normalize();
      expect(globalThis.pack).toStrictEqual(pack);
    });
  });
});

afterEach(() => {
  (globalThis as any).TIME = undefined;
  (globalThis as any).pack = undefined;
})