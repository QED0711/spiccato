import { StateSchema } from "../types";
import { 
    sanitizeState, 
    restoreState, 
    getUpdatedPaths, 
    createStateProxy, 
    hasCircularReference, 
    stateSchemaHasFunctions,
    PathTree
} from "../utils/helpers";

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
        expect((sanitized as any).a.b.c).toBe(undefined);
        expect((sanitized as any).e).toBe(undefined);

        const restored = restoreState(state, removed)
        expect(restored.a.b.c).toBe(1);
        expect(restored.e).toBe(3)
    })

    test("Traverse Updated Paths", () => {
        expect(getUpdatedPaths({}, {}, {})).toEqual([]);
        expect(getUpdatedPaths({ a: 1 }, { a: 1 }, { a: 1 })).toEqual([]);
        expect(getUpdatedPaths({ a: 1 }, { a: 2 }, { a: 0 })).toEqual([["a"]]);
        expect(getUpdatedPaths({ a: { b: 1 } }, { a: { b: 1 } }, { a: { b: 0 } })).toEqual([]);
        expect(getUpdatedPaths({ a: { b: 1 } }, { a: { b: 2 } }, { a: { b: 0 } })).toEqual([["a", "b"]]);
        expect(getUpdatedPaths({ a: { b: 1 } }, { a: { c: 2 } }, { a: { c: 0 } })).toEqual([["a", "c"]]);
        expect(getUpdatedPaths({ a: undefined }, { a: null }, { a: null })).toEqual([["a"]]);
        expect(getUpdatedPaths({ a: { b: { c: 1 } } }, { a: { c: 2 } }, { a: { b: { c: 0 } } })).toEqual([["a", "b", "c"]]);
        expect(getUpdatedPaths({ a: { x: 1 }, b: { y: 1 } }, { a: { x: 2 }, b: { y: 2 } }, { a: { x: 0 }, b: { y: 0 } })).toEqual([["a", "x"], ["b", "y"]]);
        expect(getUpdatedPaths({ a: { b: { c: 1, d: 1 } } }, { a: { b: { c: 1 } } }, { a: { b: { c: 0 } } })).toEqual([]);
        
        const arr = new Array({length: 0});
        expect(getUpdatedPaths({ a: arr }, { a: arr }, { a: [] })).toEqual([]);

    })

    test("createStateProxy", () => {
        const schema = { a: 0, b: { c: 0 } };
        const state = { a: 1, b: { c: 2 } };
        const proxied = createStateProxy(state, schema);

        function shouldFail() {
            try {
                proxied.a = 100;
                return 1
            } catch (err) {
                return 0
            }
        }
        expect(state === proxied).toBe(false);
        expect(proxied.a).toEqual(1);
        expect(proxied.b.c).toEqual(2);
        expect(shouldFail()).toEqual(0);
    })

    test("hasCircularReference", () => {
        const a: StateSchema = {a: 1};
        const b = a;
        a.b = b;
        
        expect(hasCircularReference(a)).toBe(true);
        expect(hasCircularReference({})).toBe(false);
        expect(hasCircularReference({a: 1, b: 2})).toBe(false);
    })

    test("stateSchemaHasFunctions", () => {
        expect(stateSchemaHasFunctions({})).toBe(false);
        expect(stateSchemaHasFunctions({a: null, b: true, c: 1, d: "hello", e: [], f: {x: 1}})).toBe(false);
        expect(stateSchemaHasFunctions({a: null, b: true, c: 1, d: "hello", e: [], f: {x: () => {}}})).toBe(true);
        expect(stateSchemaHasFunctions({myFunc(){}})).toBe(true);
        expect(stateSchemaHasFunctions({a: [function(){}]})).toBe(false);
        
    })

    test("PathTree", () => {
        const path = new PathTree({
            a: {b: null, c: 1},
            d: [1,2,3],
            f: undefined
        }).root;

        expect(path.a.__$path).toEqual(["a"]);
        expect(path.a.b.__$path).toEqual(["a", "b"]);
        expect(path.a.c.__$path).toEqual(["a", "c"]);
        expect(path.d.__$path).toEqual(["d"]);
        expect(path.f.__$path).toEqual(["f"]);
    })
})