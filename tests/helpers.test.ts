import { getNestedRoutes, sanitizeState } from "../utils/helpers";

describe("Helpers", () => {
    test("getNestedRoutes", () => {
        // console.log(getNestedRoutes({
        //     a: 1,
        //     b: {
        //         c: 2,
        //         d: {
        //             e: 3,
        //             f: []
        //         }
        //     }
        // }))
    })

    describe("sanitizeState", () => {
        const state = {
            a: {
                b: {
                    c: 1,
                    d: 2
                },
            },
            e: 3
        }

        test("Sanitization removes private state", () => {
            const sanitized = sanitizeState(state, [["e"], ["a", "b", "c"]]);
            expect(sanitized.a.b.c).toBe(undefined);
            expect(sanitized.e).toBe(undefined);
        })

        test("Sanitization doesn't change original state", () => {
            expect(state).toHaveProperty(["a", "b", "c"], 1);
            expect(state).toHaveProperty("e", 3);
        })

    })
})