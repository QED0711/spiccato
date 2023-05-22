import Spiccato, { WINDOW } from '../index'
import { EventPayload, StateObject, StateSchema } from '../types';
import { PathNode } from '../utils/helpers';

const testManager = new Spiccato(
    {
        isNull: null,
        isUndefined: undefined,
        nested: {isNull: null, isUndefined: undefined},
        user: {},
        myVal: 1,
        num1: 5,
        num2: 10,
        level1: {
            level2: {
                level3: 3
            },
            level2Val: "hello"
        },
        arr: [1, 2, 3]
    },
    {
        id: "TEST"
    },
);

testManager.init();

testManager.addCustomGetters({
    getAddedNums: function (this: Spiccato) {
        return this.state.num1 + this.state.num2;
    }
})

testManager.addCustomSetters({
    setBothNums(this: Spiccato, num1: number, num2: number) {
        this.setState((prevState: StateObject) => {
            return { num1, num2 };
        })
    }
})

testManager.addCustomMethods({
    deriveAdditionToNum1(this: Spiccato, num: number) {
        return this.getters.getNum1() + num;
    }
})

try {
    testManager.addNamespacedMethods({
        state: {
            test() { }
        }
    })
} catch (err: any) {
    if (err.name === "ProtectedNamespaceError") {
        testManager.addNamespacedMethods({
            api: {
                getUser(this: Spiccato, userID: number) {
                    const user = { name: "test", id: 1 };
                    this.setters.setUser(user);
                }
            },
        })

    }
}



describe("Initialization:", () => {
    test("Init", () => {
        expect(testManager).toBeInstanceOf(Spiccato);
    });

    test("Valid StateSchema", () => {
        try{
            const a: StateSchema = {a: 1};
            const b = a;
            a.b = b;
            new Spiccato(a, {id: "invalid"});
            expect(true).toBe(false);
        } catch(err){
            expect((err as Error).name).toBe("InvalidStateSchemaError")
        }

        try{
            const a: StateSchema = {a: function(){}};
            new Spiccato(a, {id: "invalid2"});
            expect(true).toBe(false);
        } catch(err){
            expect((err as Error).name).toBe("InvalidStateSchemaError")
        }

        try{
            const a: StateSchema = {a: 1};
            new Spiccato(a, {id: "valid"});
            expect(true).toBe(true);
        } catch(err){
            expect((err as Error).name).toBe("InvalidStateSchemaError")
        }
    })

    test("getManagerByID", () => {
        expect(testManager).toBe(Spiccato.getManagerById("TEST"));
    });

    test("Instance ID", () => {
        expect(testManager.id).toBe("TEST");
    });

    describe("Paths", () => {
        test("Path Access", () => {
            expect(testManager.paths).toBeInstanceOf(PathNode);
            expect(testManager.paths.isNull.__$path).toEqual(["isNull"]);
            expect(testManager.paths.isUndefined.__$path).toEqual(["isUndefined"]);
            expect(testManager.paths.myVal.__$path).toEqual(["myVal"]);
            expect(testManager.paths.num1.__$path).toEqual(["num1"]);
            expect(testManager.paths.level1.level2.__$path).toEqual(["level1", "level2"]);
            expect(testManager.paths.level1.level2.level3.__$path).toEqual(["level1", "level2", "level3"]);
        })
        test("Path Errors", () => {
            try{
                testManager.paths.level1.level2.notHere
            } catch(err){
                expect((err as Error).name).toBe("StatePathNotExistError")
            }
        }) 

    })
})





describe("State Interactions", () => {
    describe("State Access", () => {
        test("State is accessible", () => {
            expect(testManager.state.myVal).toBeDefined();
        })

        test("State can access null/undefined", () => {
            expect(testManager.state.isNull).toEqual(null);
            expect(testManager.state.isUndefined).toEqual(undefined);
        })

        test("State is not directly mutable", () => {
            function shouldFail(path: string[], update: any, action: string = "set"): number {
                let val = testManager.state
                try {
                    for (let i = 0; i < path.length; i++) {
                        if (i === path.length - 1) {
                            switch (action) {
                                case "set":
                                    val[path[i]] = update;
                                    return 1
                                case "delete":
                                    delete val[path[i]];
                                    return 1
                            }
                        }
                        val = val[path[i]]
                    }
                    return 1
                } catch (err: any) {
                    if (err.name === "ImmutableStateError") {
                        return 0
                    } else {
                        return 1
                    }
                }
            }
            expect(shouldFail(["myVal"], 14)).toBe(0);
            expect(shouldFail(["myVal"], 14, "delete")).toBe(0);
            expect(shouldFail(["level1", "level2", "level3"], "TEST")).toBe(0);
            expect(shouldFail(["someNewVal"], "I'm New!!!")).toBe(0);
            expect(shouldFail(["arr", "0"], "This should work")).toBe(1); // only object properties are protected from mutation. Arrays within a schema are mutatable
        })

        describe("Disabled write protection", () => {
            const performanceManager = new Spiccato({ myVal: 1 }, { id: "performanceManager", enableWriteProtection: false });
            performanceManager.init();

            test("allows normal state operations", () => {
                performanceManager.setters.setMyVal(100);
                expect(performanceManager.getters.getMyVal()).toBe(100);
                performanceManager.setState({ myVal: 1 });
                expect(performanceManager.getters.getMyVal()).toBe(1);

            })

            test("allows unsafe mutation", () => {
                performanceManager.state.myVal = 2;
                expect(performanceManager.state.myVal).toBe(2);
            })
        })
    })

    describe("Getters", () => {
        test("Dynamic getters", () => {
            expect(testManager.getters.getMyVal()).toBe(1);
        });

        test("Custom getters", () => {
            expect(testManager.getters.getAddedNums()).toBe(15);
        });

        test("Nested Getters", () => {
            expect(testManager.getters.getLevel1()).toStrictEqual({ level2: { level3: 3 }, level2Val: "hello" });
            expect(testManager.getters.getLevel1_level2()).toStrictEqual({ level3: 3 });
            expect(testManager.getters.getLevel1_level2_level3()).toBe(3);
        })

        test("Getters return null/undefined", () => {
            const shouldBeNull = testManager.getters.getIsNull();
            const shouldBeUndefined = testManager.getters.getIsUndefined();
            expect(shouldBeNull).toEqual(null);
            expect(shouldBeUndefined).toEqual(undefined);
            expect(testManager.getters.getNested_isNull()).toEqual(null);
            expect(testManager.getters.getNested_isUndefined()).toEqual(undefined);
        })

        test("Getters return immutable state", () => {
            function shouldFail() {
                try {
                    const level1Obj = testManager.getters.getLevel1();
                    level1Obj.level2 = "This shouldn't be allowed";
                    return 0
                } catch (err: any) {
                    if (err.name === "ImmutableStateError") {
                        return 1
                    } else {
                        return 0
                    }
                }
            }
            expect(shouldFail()).toEqual(1)
        })

        test("getStateFromPath", () => {
            const val1 = testManager.getStateFromPath("myVal");
            const val2 = testManager.getStateFromPath(["level1", "level2", "level3"])
            const stillNested = testManager.getStateFromPath(["level1", "level2"])

            function shouldFail(val: { [key: string]: any }) {
                try {
                    val.test = "this should not work"
                    return 0
                } catch (err: any) {
                    if (err.name === "ImmutableStateError") {
                        return 1
                    } else {
                        return 0
                    }
                }
            }

            expect(val1).toEqual(1);
            expect(val2).toEqual(3);
            expect(stillNested.level3).toBe(3);
            expect(shouldFail(stillNested)).toBe(1)
        })
    })

    describe("Setters", () => {
        test("setState", () => {
            testManager.setState({ myVal: 2 });
            expect(testManager.getters.getMyVal()).toBe(2);
        });

        test("setState with functional argument", () => {
            testManager.setState(function (prevState: { [key: string]: any }) {
                const myVal = prevState.myVal;
                return { myVal: myVal + 1 }
            })
            expect(testManager.getters.getMyVal()).toBe(3)
        })

        test("Dynamic Setters", () => {
            testManager.setters.setMyVal(3);
            expect(testManager.getters.getMyVal()).toBe(3);
        });

        test("Custom Setters", () => {
            testManager.setters.setBothNums(50, 100);
            expect(testManager.getters.getAddedNums()).toBe(150);
        });

        test("Nested Setters", () => {
            testManager.setters.setLevel1_level2_level3(300);
            testManager.setters.setLevel1_level2Val("world");
            expect(testManager.getters.getLevel1_level2_level3()).toBe(300);
            expect(testManager.getters.getLevel1_level2Val()).toBe("world");
        })

        test("Setters Can Change null/undefined", () => {
            testManager.setters.setIsNull("not null");
            testManager.setters.setIsUndefined("not undefined");
            testManager.setters.setNested_isNull("not null")
            testManager.setters.setNested_isUndefined("not undefined")
            expect(testManager.state.isNull).toBe("not null");
            expect(testManager.state.isUndefined).toBe("not undefined");
            expect(testManager.state.nested.isNull).toBe("not null");
            expect(testManager.state.nested.isUndefined).toBe("not undefined");
            // return to null/undefined
            testManager.setters.setIsNull(null);
            testManager.setters.setIsUndefined(undefined);
            testManager.setters.setNested_isNull(null);
            testManager.setters.setNested_isUndefined(undefined);
            expect(testManager.state.isNull).toBe(null);
            expect(testManager.state.isUndefined).toBe(undefined);
            expect(testManager.state.nested.isNull).toBe(null);
            expect(testManager.state.nested.isUndefined).toBe(undefined);

        })

    })

    describe("Methods", () => {
        test("Custom Methods", () => {
            expect(testManager.methods.deriveAdditionToNum1(10)).toBe(60);
        });

        test("Namespaced Methods", () => {
            testManager.api.getUser(1);
            const user = testManager.getters.getUser();
            expect(user.name).toBe("test");
            expect(user.id).toBe(1);
        });
    })

})



describe("Events", () => {
    describe("Payload", () => {
        test("Standard Payload", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(testManager.paths.myVal, (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setters.setMyVal(42);
            })
            expect(payload.path).toEqual(["myVal"]);
            expect(payload.value).toBe(42);

        });

        test("Nested Payload", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(testManager.paths.level1.level2Val, (payload: EventPayload) => {
                    resolve(payload);
                })
                testManager.setters.setLevel1_level2Val("Goodbye")
            })

            expect(payload.path).toEqual(["level1", "level2Val"]);
            expect(payload.value).toBe("Goodbye");
        });

        test("null/undefined Values", async () => {
            testManager.setters.setIsNull("not null");
            testManager.setters.setIsUndefined("not undefined");
            testManager.setters.setNested_isNull("not null");
            testManager.setters.setNested_isUndefined("not undefined");
            
            // top level isNull
            let payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["isNull"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setters.setIsNull(null);
            })
            expect(payload.path).toEqual(["isNull"]);
            expect(payload.value).toEqual(null);
            
            // top level isUndefined
            const payload2: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["isUndefined"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setters.setIsUndefined(undefined);
            })
            expect(payload2.path).toEqual(["isUndefined"]);
            expect(payload2.value).toEqual(undefined);
        
            // nested isNull
            const payload3: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["nested", "isNull"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setState((prevState: StateObject) => {
                    return {nested: {...prevState.nested, isNull: null}}
                })
            })
            expect(payload3.path).toEqual(["nested", "isNull"]);
            expect(payload3.value).toEqual(null);
            
            // nested level isUndefined
            const payload4: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["nested", "isUndefined"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setters.setNested_isUndefined(undefined);
            })
            expect(payload4.path).toEqual(["nested", "isUndefined"]);
            expect(payload4.value).toEqual(undefined);
        })

        test("Events Bubble", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener("on_level1_update", (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setters.setLevel1_level2Val("Hi there again!")
            })

            expect(payload.path).toEqual(["level1"]);
            expect(payload.value.level2Val).toBe("Hi there again!");
            expect(payload.value.level2.level3).toBeDefined()
        })

        test("setState emits appropriate events", async () => {
            const resolved = await Promise.allSettled([
                new Promise(resolve => {
                    testManager.addEventListener("on_level1_update", (payload: EventPayload) => {
                        resolve(payload)
                    })
                }),
                new Promise(resolve => {
                    testManager.addEventListener("on_level1_level2_update", (payload: EventPayload) => {
                        resolve(payload)
                    })
                }),
                new Promise(resolve => {
                    testManager.addEventListener("on_level1_level2_level3_update", (payload: EventPayload) => {
                        resolve(payload)
                    })

                    testManager.setState({ level1: { level2Val: "UPDATED!!!", level2: { level3: -1 } } })
                }),
            ])
            const results: (EventPayload | null)[] = resolved.map((prom) => {
                return prom.status === 'fulfilled' ? (prom.value as EventPayload) : null;
            })

            expect(results[0]?.path).toEqual(["level1"])
            expect(results[0]?.value).toEqual({ level2: { level3: -1 }, level2Val: "UPDATED!!!" })
            expect(results[1]?.path).toEqual(["level1", "level2"])
            expect(results[1]?.value).toEqual({ level3: -1 })
            expect(results[2]?.path).toEqual(["level1", "level2", "level3"])
            expect(results[2]?.value).toEqual(-1)

        })

        test("Full State Update", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener("update", (payload: EventPayload) => {
                    resolve(payload);
                });
                testManager.setState({ myVal: 84 });
            })
            expect(payload.state?.myVal).toBe(84);
        })


        test("removeEventListener", async () => {

            const value: number = await new Promise(async resolve => {
                const callback = (payload: EventPayload) => {
                    if (payload.value > 2) resolve(payload.value) // if it makes it to the third call this will resolve to '3' and will fail the test
                }
                testManager.addEventListener("on_myVal_update", callback)
                await testManager.setters.setMyVal(1);
                await testManager.setters.setMyVal(2);
                testManager.removeEventListener(testManager.paths.myVal, callback)
                await testManager.setters.setMyVal(3);
                resolve(0)
            })

            expect(value).toBe(0);

        })
    });

})

describe("Local Storage Peristance", () => {

    test("Provider window name is set correctly", () => {
        const manager = new Spiccato({}, {
            id: "main",
        })
        manager.connectToLocalStorage({
            persistKey: "main",
            initializeFromLocalStorage: false,
            providerID: "windowTest",
        })

        manager.init()

        expect(WINDOW.name).toEqual("windowTest")
    })

    test("Persistance doesn't mutate local state", () => {
        Spiccato.clear()
        const manager = new Spiccato({
            a: {
                b: {
                    c: 3
                },
                d: 4
            },
            e: 5
        }, {
            id: "Persist",
        })

        manager.connectToLocalStorage({
            persistKey: "persist",
            initializeFromLocalStorage: false,
            providerID: "Persist",
            privateState: ["e", ["a", "b", "c"]]
        })

        manager.init()

        manager.setters.setA_d(10);
        expect(manager.state.a.b.c).toBe(3);
        expect(manager.state.e).toBe(5);
    })


    test("Initialize provider from local storage", () => {
        Spiccato.clear()
        WINDOW.name = "provider"
        WINDOW.localStorage.setItem("init", JSON.stringify({ a: 100 }))
        const manager = new Spiccato({ a: 1, b: 2 }, { id: "localStorageInit" })
        manager.connectToLocalStorage({
            persistKey: "init",
            initializeFromLocalStorage: true,
            providerID: "provider",
            privateState: ["b"]
        })

        manager.init()
        expect(manager.state.a).toEqual(100);
        expect(manager.state.b).toEqual(2)
    })

    test("Initialize subscriber from local storage", () => {
        Spiccato.clear()
        WINDOW.name = "someSubscriber"
        WINDOW.localStorage.setItem("init", JSON.stringify({ a: 100 }))
        const manager = new Spiccato({ a: 1, b: 2 }, { id: "localStorageInit" })
        manager.connectToLocalStorage({
            persistKey: "init",
            subscriberIDs: ["someSubscriber"],
            initializeFromLocalStorage: true,
            privateState: ["b"]
        })

        manager.init()
        expect(manager.state.a).toEqual(100);
        expect(manager.state.b).toBeUndefined()
    })

})