// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { Culture } from "./cultures-generator";
import { createTypedArray, rand } from "../utils";
import { PackedGraphFeature } from "./features";
import { CulturesModule } from "./cultures-generator";

class MockQueue {
    queue: any[] = [];
    get length() { return this.queue.length; }
    push(item: any, _priority: number) { this.queue.push(item); this.queue.sort((a, b) => a.p - b.p); }
    pop() { return this.queue.shift(); }
}

const dummyCulture: Culture = 
    { // Culture that unocuppied cells have
        name: "dummy",
        i: 0,
        base: 0,
        shield: "",
        lock: true,
        expansionism: 1e-10
    }

const testCulture: Culture = 
    { // Culture of test cell
        name: "test",
        i: 1,
        base: 0,
        shield: "",
        lock: false,
        type: "",
        expansionism: 1,
        center: 0
    }

const feat: PackedGraphFeature = 
    {
        i:0,
        type: "island",
        land: true,
        border: true,
        cells:0,
        firstCell:-1,
        vertices: [],
        area: 0,
        shoreline:[],
        height:0,
        group:"",
        temp:0,
        flux:0,
        evaporation:0,
        name:"testFeat"
    }

beforeEach(() => {
    (globalThis as any).pack = {};
    (globalThis as any).Cultures = new CulturesModule();
    (globalThis as any).TIME = false;

    const culture = [];
    for (let j=0; j < 100; j++) {culture.push(0);} // Initialize with dummy cultures
    const i = [];
    for (let j = 0; j< 100; j++) {i.push(j);} // sets maxExpansionCost to 60
    const biome = [];
    for (let j = 0; j< 100; j++) {biome.push(0);} // All cells have the same biome
    const pop = [];
    for (let j = 0; j < 100; j++) {pop.push(1);} // All cells are populated (so that cultures can expand to them).
    const h = []; // Initialization of heights.
    for (let j = 0; j < 100; j++) {h.push(0);}
    // The test and control cells are not each other neighbors, but are neighbors with the other cells
    const neighbors = [];
    for (let j = 3; j < 100; j++) {neighbors.push(j);}
    const c = []
    for (let j = 0; j<3; j++) { c.push(Object.assign([], neighbors) as number[])}
    for (let j = 3; j<100; j++) { c.push([] as number[])}
    const fl = [];
    for (let j = 0; j< 100; j++) {fl.push(0);} // All cells have the same (default) flux
    const r = [];
    for (let j = 0; j< 100; j++) {r.push(0);} // No cell has a river.
    const t = [];
    for (let j = 0; j< 100; j++) {t.push(255);} // All cells have terrain to 255 (no getTypeCost() penalty if culture is neither "Lake" nor "Naval").
    const f = [];
    for (let j = 0; j < 100; j++) {f.push(0)} // All cells will have the same feature.
    // Set the pack.cells global variable
    pack.cells = {
        i: i,
        c: c,
        v: [] as number[][],
        p: [] as [number, number][],
        b: [] as boolean[],
        h: createTypedArray({maxValue: 100, length: 100, from: h}),
        t: createTypedArray({maxValue: 255, length: 100, from: t}),
        r: createTypedArray({maxValue: 100, length: 100, from: r}),
        f: createTypedArray({maxValue: 100, length: 100, from: f}),
        fl: createTypedArray({maxValue: 100, length: 100, from: fl}),
        s: createTypedArray({maxValue: 100, length: 100, from: fl}),
        pop: createTypedArray({maxValue: 100, length: 100, from: pop}),
        conf: createTypedArray({maxValue: 100, length: 100, from: fl}),
        haven: createTypedArray({maxValue: 100, length: 100, from: fl}),
        g: [] as number[],
        culture: culture,
        biome: createTypedArray({maxValue: 100, length: 100, from: biome}),
        harbor: createTypedArray({maxValue: 100, length: 100, from: fl}),
        burg: createTypedArray({maxValue: 100, length: 100, from: fl}),
        religion: createTypedArray({maxValue: 100, length: 100, from: fl}),
        state: [] as number[],
        area: createTypedArray({maxValue: 100, length: 100, from: fl}),
        province: createTypedArray({maxValue: 100, length: 100, from: fl}),
        routes: {} as Record<number, Record<number, number>>,
    };
});

describe("expand", () => {
    describe("getHeightCost", () => {
        /**Design idea: The getHeightCost function is internal and its results are aggregated with results
         * of getBiomeCost(), getTypeCost(), getRiverCost(), and values biomeChangeCost, expansionism, priority.
         * The cases crafts cells which will be expanding, called test cell (one) and control cells (two),
         * and one culture for each of them. In addition to these, some neighboring cells and cultures will be 
         * created such that such that: cells.r[i] = 0, cells.t[i] = 255, cells.biomes[i] === cells.biomes[j], the 
         * culture of test cell has expansionism 1. This should yield a total expansion cost of getHeightCost() + 10
         * if the culture neither "Naval" nor "Lake", if the culture is to be either of those, then cells.t[i] is changed to 1 
         * for the test cell, from which we may infer if the correct value of getHeightCost() was attained by 
         * comparing to the control cells. One control cell, called upper, will have a total cost of expansion 
         * between getHeightCost() + 10 and getHeightCost() + 11 (exclusive), then the test cell should expand 
         * its culture over upper. The other control cell is named lower, and it will have expansion cost between 
         * getHeightCost() + 9 and getHeightCost() + 10 (exclusive), thus it should always expand in place of test 
         * cell. Both give an upper and lower bound that will precisely determine if the value returned by 
         * getHeightCost() on the test cell is the expectation. To adjust these expansion costs for upper and 
         * lower they will have culture expansion values different to 1.
         */
        describe("When the height lies between 20 and 43 (inclusive)", () => {
            it("should not lead to height penalties for non-highlanders", () => {
                /**Expected total expansion cost given setup: 10 */
                /**Create mock cultures */
                testCulture.type = "Nomadic"
                const lower = Object.assign({}, testCulture); // The culture of lower
                lower.expansionism = 1.05 // Ensures total cost 9.52 in this case 
                lower.lock = true; // Initially lock the lower to allow testing against upper.
                const upper = Object.assign({}, testCulture); // The culture of upper
                upper.expansionism = 0.95 // Ensures total cost 10.52 in this case
                const cultures = [dummyCulture, testCulture, lower, upper];
                pack.cells.culture[0] = testCulture.i;
                pack.cells.culture[1] = lower.i;
                // Heights of expanding cells do not matter.
                // Push the maximum and minimum heights, ensuring existence of boundary cases.
                pack.cells.h[2]=20;
                pack.cells.h[3]=43;
                // Fill the rest with heights in the inclusive interval
                for (let j = 4; j < 100; j++) {pack.cells.h[j]=rand(20,43);}
                pack.cultures = cultures
                pack.features = [feat];
                // Perform expansion
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                
                // Assert the changes against upper
                // All the cells with indices 2 and up have the test culture's culture id assigned
                expect(pack.cells.culture.slice(3).every(item => item === testCulture.i)).toBe(true)

                // Reset the neighboring cells
                for(let j=3; j<100; j++) { pack.cells.culture[j] = 0; }
                // Lock upper and unlock lower, allowing testing aginst lower.
                upper.lock = true;
                lower.lock = false;
                // Redo with lower
                pack.cells.culture[1] = lower.i;
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                // All the cells with indices 2 and up have the lower culture's culture id assigned.
                expect(pack.cells.culture.slice(3).every(item => item === lower.i)).toBe(true)
            });
        });
        describe("When the height is at least 62", () => {
            it("should not lead to height penalties for highlanders", () => {
                /**Expected total expansion cost given setup: 10 */
                /**Create mock cultures */
                testCulture.type = "Highland";  
                const lower = Object.assign({}, testCulture); // The culture of lower
                lower.expansionism = 1.05 // Ensures total cost 9.52 in this case 
                lower.i = 2;
                lower.center = 1;
                lower.lock = true; // Initially lock the lower to allow testing against upper.
                const upper = Object.assign({}, testCulture); // The culture of upper
                upper.expansionism = 0.95 // Ensures total cost 10.52 in this case
                upper.i = 3;
                upper.center = 2;
                const cultures = [dummyCulture, testCulture, lower, upper];
                pack.cells.culture[0] = testCulture.i;
                pack.cells.culture[1] = lower.i;
                // Heights of expanding cells do not matter.
                // Push the minimum height, ensuring existence of boundary case.
                pack.cells.h[2]=62;
                // Fill the rest with heights in the inclusive interval
                for (let j = 3; j < 100; j++) {pack.cells.h[j]=rand(62,100);}
                pack.cultures = cultures
                pack.features = [feat];
                // Perform expansion
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                
                // Assert the changes against upper
                // All the cells with indices 2 and up have the test culture's culture id assigned
                expect(pack.cells.culture.slice(3).every(item => item === testCulture.i)).toBe(true)

                // Reset the neighboring cells
                for(let j=3; j<100; j++) { pack.cells.culture[j] = 0; }
                // Lock upper and unlock lower, allowing testing aginst lower.
                upper.lock = true;
                lower.lock = false;
                // Redo with lower
                pack.cells.culture[1] = lower.i;
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                // All the cells with indices 2 and up have the lower culture's culture id assigned.
                expect(pack.cells.culture.slice(3).every(item => item === lower.i)).toBe(true)
                
            });
        });
        describe("When the height is less than 20", () => {
            it("The penalty should be 6*area for Lake cultures if cell has no lake", () => {
                /**Expected total expansion cost given setup: 6*a + 10 = 16 (a=1) */
                // Set cells.t[i] to 1, so that getTypeCost() returns 0
                for (let j = 0; j<100; j++) {pack.cells.t[j]=1;}
                /**Create mock cultures */
                testCulture.type = "Lake";
                testCulture.area = 1;
                const lower = Object.assign({}, testCulture); // The culture of lower
                lower.expansionism = 1.05 // Ensures total cost 15.23 in this case 
                lower.i = 2;
                lower.center = 1;
                lower.lock = true; // Initially lock the lower to allow testing against upper.
                const upper = Object.assign({}, testCulture); // The culture of upper
                upper.expansionism = 0.95 // Ensures total cost 16.84 in this case
                upper.i = 3;
                upper.center = 2;

                const cultures = [dummyCulture, testCulture, lower, upper];
                pack.cells.culture[0] = testCulture.i;
                pack.cells.culture[1] = lower.i;
                // Heights of expanding cells do not matter.
                // Push the maximum height, ensuring existence of boundary case.
                pack.cells.h[2]=19;
                // Fill the rest with heights in the inclusive interval
                for (let j = 3; j < 100; j++) {pack.cells.h[j]=rand(0,19);}
                pack.cultures = cultures
                pack.features = [feat];
                // Perform expansion
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                
                // Assert the changes against upper
                // All the cells with indices 2 and up have the test culture's culture id assigned
                expect(pack.cells.culture.slice(3).every(item => item === testCulture.i)).toBe(true)

                // Reset the neighboring cells
                for(let j=3; j<100; j++) { pack.cells.culture[j] = 0; }
                // Lock upper and unlock lower, allowing testing aginst lower.
                upper.lock = true;
                lower.lock = false;
                // Redo with lower
                pack.cells.culture[1] = lower.i;
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                // All the cells with indices 2 and up have the lower culture's culture id assigned.
                expect(pack.cells.culture.slice(3).every(item => item === lower.i)).toBe(true)
            });
        });
        describe("When the height is less than 20", () => {
            it("The penalty should always be 6*area for all non-Lake cultures.", () => {
                /**Expected total expansion cost given setup: 6*a + 10 = 16 (a=1) */
                /**Create mock cultures */
                testCulture.type = "Highland";
                testCulture.area = 1;
                const lower = Object.assign({}, testCulture); // The culture of lower
                lower.expansionism = 1.05 // Ensures total cost 15.23 in this case 
                lower.i = 2;
                lower.center = 1;
                lower.lock = true; // Initially lock the lower to allow testing against upper.
                const upper = Object.assign({}, testCulture); // The culture of upper
                upper.expansionism = 0.95 // Ensures total cost 16.84 in this case
                upper.i = 3;
                upper.center = 2;

                const cultures = [dummyCulture, testCulture, lower, upper];
                pack.cells.culture[0] = testCulture.i;
                pack.cells.culture[1] = lower.i;
                // Heights of expanding cells do not matter.
                // Push the maximum height, ensuring existence of boundary case.
                pack.cells.h[2]=19;
                // Fill the rest with heights in the inclusive interval
                for (let j = 3; j < 100; j++) {pack.cells.h[j]=rand(0,19);}
                pack.cultures = cultures
                pack.features = [feat];
                // Perform expansion
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                
                // Assert the changes against upper
                // All the cells with indices 2 and up have the test culture's culture id assigned
                expect(pack.cells.culture.slice(3).every(item => item === testCulture.i)).toBe(true)

                // Reset the neighboring cells
                for(let j=3; j<100; j++) { pack.cells.culture[j] = 0; }
                // Lock upper and unlock lower, allowing testing aginst lower.
                upper.lock = true;
                lower.lock = false;
                // Redo with lower
                pack.cells.culture[1] = lower.i;
                (globalThis as any).FlatQueue = MockQueue;
                (globalThis as any).Cultures.expand()
                // All the cells with indices 2 and up have the lower culture's culture id assigned.
                expect(pack.cells.culture.slice(3).every(item => item === lower.i)).toBe(true)
            });
        });
    });
});
        
afterEach(() => {
    (globalThis as any).TIME = undefined;
    (globalThis as any).pack = undefined;
});