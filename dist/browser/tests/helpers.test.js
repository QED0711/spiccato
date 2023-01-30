import { sanitizeState, restoreState } from "../utils/helpers";
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
});
