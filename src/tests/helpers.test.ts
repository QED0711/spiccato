import { getNestedRoutes, sanitizeState, restoreState, getUpdatedPaths } from "../utils/helpers";

describe("Helpers", () => {
    test("Sanitization and Restoration", () => {

        const state = {
            a: {
                b: {
                    c: 1,
                    d: 2
                },
            },
            e: 3
        }

        const [sanitized, removed] = sanitizeState(state, [["e"], ["a", "b", "c"]]);
        expect(sanitized.a.b.c).toBe(undefined);
        expect(sanitized.e).toBe(undefined);

        const restored = restoreState(state, removed)
        expect(restored.a.b.c).toBe(1);
        expect(restored.e).toBe(3)
    })

    test("Traverse Updated Paths", () => {
        expect(getUpdatedPaths({}, {})).toEqual([]);
        expect(getUpdatedPaths({a: 1}, {a: 1})).toEqual([]);
        expect(getUpdatedPaths({a: 1}, {a: 2})).toEqual([["a"]]);
        expect(getUpdatedPaths({a: {b: 1}}, {a: {b: 2}})).toEqual([["a"], ["a", "b"]]);
        expect(getUpdatedPaths({a: {b: 1}}, {a: {c: 2}})).toEqual([["a"], ["a", "b"]]);
        expect(getUpdatedPaths({a: {b: {c: 1}}}, {a: {c: 2}})).toEqual([["a"], ["a", "b"], ["a", "b", "c"]]);
        expect(getUpdatedPaths({a: {x: 1}, b: {y: 1}}, {a: {x: 2}, b: {y: 2}})).toEqual([["a"], ["a", "x"], ["b"], ["b", "y"]]);
        expect(getUpdatedPaths({a: {b: {c: 1, d: 1}}}, {a: {b: {c: 1}}})).toEqual([["a"], ["a", "b"], ["a", "b", "d"]]);
        
        
    })
})