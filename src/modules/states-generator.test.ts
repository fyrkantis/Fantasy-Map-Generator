// @vitest-environment jsdom
import { describe, it, expect, } from "vitest";
import "./states-generator";


describe("expandStates", () => {

    describe("when expansionalism is arbitrarily small", () => {

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
        
    // TODO: Test 3 - Capital should not be taken over
    
    describe("all cells are capitals", () => {

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
                    state: new Uint16Array([1, 2, 3, 4, 5, 6]),
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
                    { i: 2, name: "Test State", expansionism: 1e+10, capital: 1, center: 1, culture: 0, lock: false },
                    { i: 3, name: "Test State", expansionism: 1e-10, capital: 2, center: 2, culture: 0, lock: true },
                    { i: 4, name: "Test State", expansionism: 1e+10, capital: 3, center: 3, culture: 0, lock: false },
                    { i: 5, name: "Test State", expansionism: 1e-10, capital: 4, center: 4, culture: 0, lock: true },
                    { i: 6, name: "Test State", expansionism: 1e+10, capital: 5, center: 5, culture: 0, lock: false },
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
            expect(pack.cells.state[1]).toBe(2)
            expect(pack.cells.state[2]).toBe(3)
            expect(pack.cells.state[3]).toBe(4)
            expect(pack.cells.state[4]).toBe(5)
            expect(pack.cells.state[5]).toBe(6)

        });

    });
    
    // TODO: Test 4 - Naval expand better Nomadic than highland for height
        
    describe("Nomadic and Naval compete for sea crossing", () => {

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
                    state: new Uint16Array([1, 1, 1, 1, 1, 2]),
                    culture: new Uint16Array([0, 0, 0, 0, 0, 0]),
                    h: new Uint8Array([25, 15, 15, 15, 15, 25]), // Height (25 = land)
                    s: new Uint16Array([10, 10, 10, 10, 10, 10]), // Suitability
                    f: new Uint16Array([0, 0, 0, 0, 0, 0]), // Features
                    r: new Uint16Array([0, 0, 0, 0, 0, 0]), // Rivers
                    t: new Uint8Array([1, 1, 1, 1, 1, 1]), // Type
                    biome: new Uint8Array([1, 1, 1, 1, 1, 1]),
                },
                states: [
                    { i: 0, name: "Neutrals" },
                    { i: 1, name: "Test State", expansionism: 1e+10, capital: 0, center: 0, culture: 0, type: "Nomadic"},
                    { i: 2, name: "Test State", expansionism: 1e+10, capital: 1, center: 5, culture: 0, type: "Naval" },
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
            expect(pack.cells.state[1]).toBe(2)
            expect(pack.cells.state[2]).toBe(2)
            expect(pack.cells.state[3]).toBe(2)
            expect(pack.cells.state[4]).toBe(2)
            expect(pack.cells.state[5]).toBe(2)

        });

    });
});
