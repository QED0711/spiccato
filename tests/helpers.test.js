"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../utils/helpers");
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
        const [sanitized, removed] = (0, helpers_1.sanitizeState)(state, [["e"], ["a", "b", "c"]]);
        expect(sanitized.a.b.c).toBe(undefined);
        expect(sanitized.e).toBe(undefined);
        const restored = (0, helpers_1.restoreState)(state, removed);
        expect(restored.a.b.c).toBe(1);
        expect(restored.e).toBe(3);
    });
});
