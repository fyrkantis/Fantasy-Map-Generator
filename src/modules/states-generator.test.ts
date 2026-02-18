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

describe("defineStateForms" , () => {

    //If funciton exits early, then selectForm is never reached where a form is set. An undefined value is thus expected.
    describe("when there are no eligible states", () => {

        it("returns early", () => {
            (globalThis as any).TIME = false;

            const states = [{i: 1, name: "test", removed: false, lock: true}];

            (globalThis as any).pack = { states: states };

            window.States.defineStateForms();

            expect(pack.states[0].form).toBeUndefined();
        });

    });
    //If list is empty, it will continue to the next iteration. Since there is only 1 element in states it will skip the for loop.
    //Thus, no fullName or formName is set.
    describe("when list is empty", () => {
        it("continues",() => {
            (globalThis as any).TIME = false

            const states = [{i:1, name: "test", removed: false, lock: false}];

            (globalThis as any).pack = {states: states}

            window.States.defineStateForms([]);

            expect(pack.states[0].formName).toBeUndefined()
            expect(pack.states[0].fullName).toBeUndefined()
        })
    })
   //If Theocracy is true then the form is expected to be "Theocracy"
    describe("If isTheocracy is true",() => {
        it("it sets form to Theocracy", () => {
            (globalThis as any ).TIME = false

            const states = [{ i: 1, center: 1, culture: 0, name: "test", removed: false, lock: false }];

            (globalThis as any).pack = {
                states,
                cells: {religion: [0, 1]},
                cultures: [{ base: 0}],
                religions: [{}, { expansion: "state"}],
            };

            window.States.defineStateForms()

            expect(pack.states[0].form).toBe("Theocracy")
        })
    })
    //If the specified id is in the list, it will only use the specified id. the other states will be left undefined
    describe("When specified id is in the list", ()=>{
        it("uses only the specified id", () => {
            (globalThis as any).TIME = false

            const states = [
                { i: 0, center: 1, culture: 0, name: "test0", removed: false, lock: false },
                { i: 1, center: 1, culture: 0, name: "test1", removed: false, lock: false }];

            (globalThis as any).pack = {
                states,
                cells: {religion: [0, 1]},
                cultures: [{ base: 0}],
                religions: [{}, { expansion: "state"}],
            };

            window.States.defineStateForms([1])

            expect(pack.states[1].form).toBe("Theocracy");
            expect(pack.states[0].form).toBeUndefined();

        })
    })



});

afterEach(() => {
    (globalThis as any).TIME = undefined;
    (globalThis as any).pack = undefined;
})
