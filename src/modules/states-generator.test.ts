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
});