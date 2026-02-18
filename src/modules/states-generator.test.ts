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

describe("expandStates", () => {

    describe("when expansionalism is arbitrarily small", () => {
        /* 
        As additional cost of reaching a cell is given by 10 + cellCost / state.expansionalism,
        if expansionalism is arbitrarily small, then the additional cost would be close to +infinity.
        Expansion would be impossible given finite growthrate, resulting in all states owning their original land (capital) only.
        */
        it("neutral cells should remain neutral", () => {
            (globalThis as any).TIME = false;

            class MockQueue {
                queue: any[] = [];
                get length() { return this.queue.length; }
                push(item: any, priority: number) { this.queue.push(item); this.queue.sort((a, b) => a.p - b.p); }
                pop() { return this.queue.shift(); }
            }
            (globalThis as any).FlatQueue = MockQueue;

            (globalThis as any).pack = {
                cells: {
                    i: [0, 1, 2, 3, 4, 5], // Cell indices
                    c: [[1], [0, 2], [1, 3], [2, 4], [3, 5], [4]], // Adjacency (neighbor) list
                    state: new Uint16Array([0, 0, 0, 0, 0, 0]),
                    culture: new Uint16Array([0, 0, 0, 0, 0, 0]),
                    h: new Uint8Array([25, 25, 25, 25, 25, 25]), // Height (25 = land)
                    s: new Uint16Array([10, 10, 10, 10, 10, 10]), // Suitability
                    f: new Uint16Array([0, 0, 0, 0, 0, 0]), // Features
                    r: new Uint16Array([0, 0, 0, 0, 0, 0]), // Rivers
                    t: new Uint8Array([1, 1, 1, 1, 1, 1]), // Type
                    biome: new Uint8Array([1, 1, 1, 1, 1, 1]),
                },
                states: [
                    { i: 0, name: "Neutrals" },
                    { i: 1, name: "Test State", expansionism: 1e-10, capital: 0, center: 1, culture: 0 },
                    { i: 2, name: "Test State", expansionism: 1e-10, capital: 1, center: 3, culture: 0 },
                    { i: 3, name: "Test State", expansionism: 1e-10, capital: 2, center: 5, culture: 0 }
                ],
                cultures: [{ i: 0, center: 0 }],
                burgs: [{ i: 1, cell: 1 }, { i: 2, cell: 3 }, { i: 3, cell: 5 }],
                features: [{ i: 0, type: "island" }]
            };

            document.body.innerHTML = `
                <input id="growthRate" type="number" value="1000">
                <input id="statesGrowthRate" type="number" value="1000">
            `;

            window.States.expandStates();

            expect(pack.cells.state[0]).toBe(0)
            expect(pack.cells.state[1]).toBe(1)
            expect(pack.cells.state[2]).toBe(0)
            expect(pack.cells.state[3]).toBe(2)
            expect(pack.cells.state[4]).toBe(0)
            expect(pack.cells.state[5]).toBe(3)

        });

    });
    
    describe("when states are locked", () => {
        /*
        When the state is locked, other states couldn't take over its land, no matter their expansionalism.
        Given a state A with very low expansionalism, but locked, and another state B with very high expansionalism,
        and is neighboring state A, even if state B could theoretically take over state A, it should not happen if state A is locked.
        */
        it("they should not be taken over", () => {
            (globalThis as any).TIME = false;

            class MockQueue {
                queue: any[] = [];
                get length() { return this.queue.length; }
                push(item: any, priority: number) { this.queue.push(item); this.queue.sort((a, b) => a.p - b.p); }
                pop() { return this.queue.shift(); }
            }
            (globalThis as any).FlatQueue = MockQueue;

            (globalThis as any).pack = {
                cells: {
                    i: [0, 1, 2, 3, 4, 5], // Cell indices
                    c: [[1], [0, 2], [1, 3], [2, 4], [3, 5], [4]], // Adjacency (neighbor) list
                    state: new Uint16Array([1, 1, 1, 1, 1, 2]),
                    culture: new Uint16Array([0, 0, 0, 0, 0, 0]),
                    h: new Uint8Array([25, 25, 25, 25, 25, 25]), // Height (25 = land)
                    s: new Uint16Array([10, 10, 10, 10, 10, 10]), // Suitability
                    f: new Uint16Array([0, 0, 0, 0, 0, 0]), // Features
                    r: new Uint16Array([0, 0, 0, 0, 0, 0]), // Rivers
                    t: new Uint8Array([1, 1, 1, 1, 1, 1]), // Type
                    biome: new Uint8Array([1, 1, 1, 1, 1, 1]),
                },
                states: [
                    { i: 0, name: "Neutrals" },
                    { i: 1, name: "Test State", expansionism: 1e-10, capital: 0, center: 0, culture: 0, lock: true },
                    { i: 2, name: "Test State", expansionism: 1e+10, capital: 1, center: 5, culture: 0, lock: false },
                ],
                cultures: [{ i: 0, center: 0 }],
                burgs: [{ i: 1, cell: 0 }, { i: 2, cell: 5 }],
                features: [{ i: 0, type: "island" }]
            };

            document.body.innerHTML = `
                <input id="growthRate" type="number" value="1000">
                <input id="statesGrowthRate" type="number" value="1000">
            `;

            window.States.expandStates();

            expect(pack.cells.state[0]).toBe(1)
            expect(pack.cells.state[1]).toBe(1)
            expect(pack.cells.state[2]).toBe(1)
            expect(pack.cells.state[3]).toBe(1)
            expect(pack.cells.state[4]).toBe(1)
            expect(pack.cells.state[5]).toBe(2)

        });

    });
        
    describe("all cells are capitals", () => {
        /*
        Capitals could not be taken over.
        Given a set of neighboring capitals owned by states with various expansionalism,
        the ownership of those capital states should remain unchanged.
        */
        it("they should not be taken over", () => {
            (globalThis as any).TIME = false;

            class MockQueue {
                queue: any[] = [];
                get length() { return this.queue.length; }
                push(item: any, priority: number) { this.queue.push(item); this.queue.sort((a, b) => a.p - b.p); }
                pop() { return this.queue.shift(); }
            }
            (globalThis as any).FlatQueue = MockQueue;

            (globalThis as any).pack = {
                cells: {
                    i: [0, 1, 2, 3, 4, 5], // Cell indices
                    c: [[1, 2, 3, 4, 5], [0, 2, 3, 4, 5], [0, 1, 3, 4, 5], [0, 1, 2, 4, 5], [0, 1, 2, 3, 5], [0, 1, 2, 3, 4]], // Adjacency (neighbor) list
                    state: new Uint16Array([1, 0, 2, 0, 3, 0]),
                    culture: new Uint16Array([0, 0, 0, 0, 0, 0]),
                    h: new Uint8Array([25, 25, 25, 25, 25, 25]), // Height (25 = land)
                    s: new Uint16Array([10, 10, 10, 10, 10, 10]), // Suitability
                    f: new Uint16Array([0, 0, 0, 0, 0, 0]), // Features
                    r: new Uint16Array([0, 0, 0, 0, 0, 0]), // Rivers
                    t: new Uint8Array([1, 1, 1, 1, 1, 1]), // Type
                    biome: new Uint8Array([1, 1, 1, 1, 1, 1]),
                },
                states: [
                    { i: 0, name: "Neutrals" },
                    { i: 1, name: "Test State", expansionism: 1e-10, capital: 0, center: 0, culture: 0},
                    { i: 2, name: "Test State", expansionism: 1, capital: 2, center: 2, culture: 0},
                    { i: 3, name: "Test State", expansionism: 1e+10, capital: 4, center: 4, culture: 0},
                ],
                cultures: [{ i: 0, center: 0 }],
                burgs: [{ i: 1, cell: 0 }, { i: 2, cell: 1 }, { i: 3, cell: 2 }, { i: 4, cell: 3 }, { i: 5, cell: 4 }, { i: 6, cell: 5 }],
                features: [{ i: 0, type: "island" }]
            };

            document.body.innerHTML = `
                <input id="growthRate" type="number" value="1000">
                <input id="statesGrowthRate" type="number" value="1000">
            `;

            window.States.expandStates();

            expect(pack.cells.state[0]).toBe(1)
            expect(pack.cells.state[2]).toBe(2)
            expect(pack.cells.state[4]).toBe(3)

        });

    });
    
    describe("Nomadic and Naval compete for sea crossing", () => {
        /*
        Naval states incur a much lower cost than Nomadic states when crossing oceans (h < 20).
        When they are equidistant to a neutral island (neutral cells surrounded by cells with h < 20),
        the island should be captured by the Naval state, even if the nomadic state has a relatively higher expansionalism.
        */
        it("Naval wins", () => {
            (globalThis as any).TIME = false;

            class MockQueue {
                queue: any[] = [];
                get length() { return this.queue.length; }
                push(item: any, priority: number) { this.queue.push(item); this.queue.sort((a, b) => a.p - b.p); }
                pop() { return this.queue.shift(); }
            }
            (globalThis as any).FlatQueue = MockQueue;

            (globalThis as any).pack = {
                cells: {
                    i: [0, 1, 2, 3, 4, 5], // Cell indices
                    c: [[1], [0, 2], [1, 3], [2, 4], [3, 5], [4]], // Adjacency (neighbor) list
                    state: new Uint16Array([1, 0, 0, 0, 0, 2]),
                    culture: new Uint16Array([0, 0, 0, 0, 0, 0]),
                    h: new Uint8Array([25, 10, 25, 25, 10, 25]), // Height (25 = land, 10 = sea)
                    s: new Uint16Array([10, 10, 10, 10, 10, 10]), // Suitability
                    f: new Uint16Array([0, 0, 0, 0, 0, 0]), // Features
                    r: new Uint16Array([0, 0, 0, 0, 0, 0]), // Rivers
                    t: new Uint8Array([1, 1, 1, 1, 1, 1]), // Type
                    biome: new Uint8Array([1, 1, 1, 1, 1, 1]),
                },
                states: [
                    { i: 0, name: "Neutrals" },
                    { i: 1, name: "Test State", expansionism: 100, capital: 0, center: 0, culture: 0, type: "Nomadic"},
                    { i: 2, name: "Test State", expansionism: 10, capital: 1, center: 5, culture: 0, type: "Naval" },
                ],
                cultures: [{ i: 0, center: 0 }],
                burgs: [{ i: 1, cell: 0 }, { i: 2, cell: 5 }],
                features: [{ i: 0, type: "island" }]
            };

            document.body.innerHTML = `
                <input id="growthRate" type="number" value="100">
                <input id="statesGrowthRate" type="number" value="10">
            `;

            window.States.expandStates();

            expect(pack.cells.state[0]).toBe(1);
            expect(pack.cells.state[1]).toBe(0); // Naval state expands to sea
            expect(pack.cells.state[2]).toBe(2);
            expect(pack.cells.state[3]).toBe(2);
            expect(pack.cells.state[4]).toBe(0);
            expect(pack.cells.state[5]).toBe(2);
        });

    });
});
