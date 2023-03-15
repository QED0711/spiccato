import { sanitizeState, restoreState, getUpdatedPaths, createStateProxy } from "../utils/helpers";
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
        };
        const [sanitized, removed] = sanitizeState(state, [["e"], ["a", "b", "c"]]);
        expect(sanitized.a.b.c).toBe(undefined);
        expect(sanitized.e).toBe(undefined);
        const restored = restoreState(state, removed);
        expect(restored.a.b.c).toBe(1);
        expect(restored.e).toBe(3);
    });
    test("Traverse Updated Paths", () => {
        expect(getUpdatedPaths({}, {}, {})).toEqual([]);
        expect(getUpdatedPaths({ a: 1 }, { a: 1 }, { a: 1 })).toEqual([]);
        expect(getUpdatedPaths({ a: 1 }, { a: 2 }, { a: 0 })).toEqual([["a"]]);
        expect(getUpdatedPaths({ a: { b: 1 } }, { a: { b: 1 } }, { a: { b: 0 } })).toEqual([]);
        expect(getUpdatedPaths({ a: { b: 1 } }, { a: { b: 2 } }, { a: { b: 0 } })).toEqual([["a", "b"]]);
        expect(getUpdatedPaths({ a: { b: 1 } }, { a: { c: 2 } }, { a: { c: 0 } })).toEqual([["a", "c"]]);
        expect(getUpdatedPaths({ a: { b: { c: 1 } } }, { a: { c: 2 } }, { a: { b: { c: 0 } } })).toEqual([["a", "b", "c"]]);
        expect(getUpdatedPaths({ a: { x: 1 }, b: { y: 1 } }, { a: { x: 2 }, b: { y: 2 } }, { a: { x: 0 }, b: { y: 0 } })).toEqual([["a", "x"], ["b", "y"]]);
        expect(getUpdatedPaths({ a: { b: { c: 1, d: 1 } } }, { a: { b: { c: 1 } } }, { a: { b: { c: 0 } } })).toEqual([]);
    });
    test("createStateProxy", () => {
        const schema = { a: 0, b: { c: 0 } };
        const state = { a: 1, b: { c: 2 } };
        const proxied = createStateProxy(state, schema);
        function shouldFail() {
            try {
                proxied.a = 100;
                return 1;
            }
            catch (err) {
                return 0;
            }
        }
        expect(state === proxied).toBe(false);
        expect(proxied.a).toEqual(1);
        expect(proxied.b.c).toEqual(2);
        expect(shouldFail()).toEqual(0);
    });
});
