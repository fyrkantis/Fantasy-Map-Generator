// @vitest-environment jsdom
import {describe, it, expect,} from "vitest";
import "./states-generator";




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