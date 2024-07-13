import Spiccato, { WINDOW } from '../index'
import { EventPayload, SpiccatoInstance, StateObject, StateSchema } from '../types';
import { PathNode } from '../utils/helpers';

const initState = {
    isNull: null,
    isUndefined: undefined,
    nested: { isNull: null, isUndefined: undefined },
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
    arr: [1, 2, 3],
    override: "override this setter",
    overrideGetter: "override this getter",
}


type Getters = {
    getUser: (this: InstanceSignature) => {[key: string]: any}
}
type Setters = {
    setA: (this: InstanceSignature, n: number) => void, 
    setUser: ( user: {[key: string]: any}) => void,
}
type Methods = {}

type InstanceSignature = SpiccatoInstance<typeof initState, Getters, Setters, Methods>

const testManager = new Spiccato<typeof initState, Getters, Setters, Methods>(
    initState,
    {
        id: "TEST"
    },
);


testManager.init();

testManager.addCustomGetters({
    getAddedNums: function (this: InstanceSignature) {
        return this.state.num1 + this.state.num2;
    },

    getOverrideGetter() {
        return "this is not the string you're looking for"
    }
})

testManager.addCustomSetters({
    setBothNums(num1: number, num2: number) {
        this.setState((prevState: StateObject) => {
            return { num1, num2 };
        })
    },

    setOverride(text: string) {
        this.setState((prevState: StateObject) => {
            return [{ override: "constant string" }, []]; // does nothing, nothing is set
        })
    }

})

testManager.addCustomMethods({
    deriveAdditionToNum1(this: Spiccato, num: number) {
        return this._getters.getNum1() + num;
    }
})


try {
    testManager.addNamespacedMethods({
        state: {
            test(this: InstanceSignature) {} 
        }
    })
} catch (err: any) {
    if (err.name === "ProtectedNamespaceError") {
        testManager.addNamespacedMethods({
            api: {
                getUser(userID: number) {
                    const user = { name: "test", id: userID };
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
        try {
            const a: StateSchema = { a: 1 };
            const b = a;
            a.b = b;
            new Spiccato(a, { id: "invalid" });
            expect(true).toBe(false);
        } catch (err) {
            expect((err as Error).name).toBe("InvalidStateSchemaError")
        }

        try {
            const a: StateSchema = { a: function () { } };
            new Spiccato(a, { id: "invalid2" });
            expect(true).toBe(false);
        } catch (err) {
            expect((err as Error).name).toBe("InvalidStateSchemaError")
        }

        try {
            const a: StateSchema = { a: 1 };
            new Spiccato(a, { id: "valid" });
            expect(true).toBe(true);
        } catch (err) {
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
            try {
                testManager.paths.level1.level2.notHere
            } catch (err) {
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
                                    (val as Record<string, any>)[path[i]] = update;
                                    return 1
                                case "delete":
                                    delete (val as Record<string, any>)[path[i]];
                                    return 1
                            }
                        }
                        val = (val as Record<string, any>)[path[i]]
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
                performanceManager._setters.setMyVal(100);
                expect(performanceManager._getters.getMyVal()).toBe(100);
                performanceManager.setState({ myVal: 1 });
                expect(performanceManager._getters.getMyVal()).toBe(1);

            })

            test("allows unsafe mutation", () => {
                performanceManager.state.myVal = 2;
                expect(performanceManager.state.myVal).toBe(2);
            })
        })
    })

    describe("Getters", () => {
        test("Dynamic getters", () => {
            expect(testManager._getters.getMyVal()).toBe(1);
        });

        test("Custom getters", () => {
            expect(testManager._getters.getAddedNums()).toBe(15);
        });

        test("Dynamic getters override", () => {
            expect(testManager._getters.getOverrideGetter()).toBe("this is not the string you're looking for");
        })

        test("Nested Getters", () => {
            expect(testManager._getters.getLevel1()).toStrictEqual({ level2: { level3: 3 }, level2Val: "hello" });
            expect(testManager._getters.getLevel1_level2()).toStrictEqual({ level3: 3 });
            expect(testManager._getters.getLevel1_level2_level3()).toBe(3);
        })

        test("Getters return null/undefined", () => {
            const shouldBeNull = testManager._getters.getIsNull();
            const shouldBeUndefined = testManager._getters.getIsUndefined();
            expect(shouldBeNull).toEqual(null);
            expect(shouldBeUndefined).toEqual(undefined);
            expect(testManager._getters.getNested_isNull()).toEqual(null);
            expect(testManager._getters.getNested_isUndefined()).toEqual(undefined);
        })

        test("Getters return immutable state", () => {
            function shouldFail() {
                try {
                    const level1Obj = testManager._getters.getLevel1();
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
            expect(testManager._getters.getMyVal()).toBe(2);
        });

        test("setState with functional argument", () => {
            testManager.setState(function (prevState: { [key: string]: any }) {
                const myVal = prevState.myVal;
                return { myVal: myVal + 1 }
            })
            expect(testManager._getters.getMyVal()).toBe(3)
        })

        test("setState function argument with returning updated path", () => {
            testManager.setState(function (prevState: StateObject) {
                return [{ myVal: 123 }, [testManager.paths.myVal]]
            })
            expect(testManager.state.myVal).toBe(123);
        });

        test("Dynamic Setters", () => {
            testManager._setters.setMyVal(4);
            expect(testManager._getters.getMyVal()).toBe(4);
        });

        test("Custom Setters", () => {
            testManager._setters.setBothNums(50, 100);
            expect(testManager._getters.getAddedNums()).toBe(150);
        });

        test("Dynamic Setter Override", () => {
            testManager._setters.setOverride("This is some new string");
            expect(testManager._getters.getOverride()).toBe("constant string");
        })

        test("Nested Setters", () => {
            testManager._setters.setLevel1_level2_level3(300);
            testManager._setters.setLevel1_level2Val("world");
            expect(testManager._getters.getLevel1_level2_level3()).toBe(300);
            expect(testManager._getters.getLevel1_level2Val()).toBe("world");
        })

        test("Setters Can Change null/undefined", () => {
            testManager._setters.setIsNull("not null");
            testManager._setters.setIsUndefined("not undefined");
            testManager._setters.setNested_isNull("not null")
            testManager._setters.setNested_isUndefined("not undefined")
            expect(testManager.state.isNull).toBe("not null");
            expect(testManager.state.isUndefined).toBe("not undefined");
            expect(testManager.state.nested.isNull).toBe("not null");
            expect(testManager.state.nested.isUndefined).toBe("not undefined");
            // return to null/undefined
            testManager._setters.setIsNull(null);
            testManager._setters.setIsUndefined(undefined);
            testManager._setters.setNested_isNull(null);
            testManager._setters.setNested_isUndefined(undefined);
            expect(testManager.state.isNull).toBe(null);
            expect(testManager.state.isUndefined).toBe(undefined);
            expect(testManager.state.nested.isNull).toBe(null);
            expect(testManager.state.nested.isUndefined).toBe(undefined);

        })

    })

    describe("Methods", () => {
        test("Custom Methods", () => {
            expect(testManager._methods.deriveAdditionToNum1(10)).toBe(60);
        });

        test("Namespaced Methods", () => {
            testManager.api.getUser(1);
            const user = testManager._getters.getUser();
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
                testManager._setters.setMyVal(42);
            })
            expect(payload.path).toEqual(["myVal"]);
            expect(payload.value).toBe(42);

        });

        test("Nested Payload", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(testManager.paths.level1.level2Val, (payload: EventPayload) => {
                    resolve(payload);
                })
                testManager._setters.setLevel1_level2Val("Goodbye")
            })

            expect(payload.path).toEqual(["level1", "level2Val"]);
            expect(payload.value).toBe("Goodbye");
        });

        test("null/undefined Values", async () => {
            testManager._setters.setIsNull("not null");
            testManager._setters.setIsUndefined("not undefined");
            testManager._setters.setNested_isNull("not null");
            testManager._setters.setNested_isUndefined("not undefined");

            // top level isNull
            let payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["isNull"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager._setters.setIsNull(null);
            })
            expect(payload.path).toEqual(["isNull"]);
            expect(payload.value).toEqual(null);

            // top level isUndefined
            const payload2: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["isUndefined"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager._setters.setIsUndefined(undefined);
            })
            expect(payload2.path).toEqual(["isUndefined"]);
            expect(payload2.value).toEqual(undefined);

            // nested isNull
            const payload3: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["nested", "isNull"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setState((prevState: StateObject) => {
                    return { nested: { ...prevState.nested, isNull: null } }
                })
            })
            expect(payload3.path).toEqual(["nested", "isNull"]);
            expect(payload3.value).toEqual(null);

            // nested level isUndefined
            const payload4: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(["nested", "isUndefined"], (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager._setters.setNested_isUndefined(undefined);
            })
            expect(payload4.path).toEqual(["nested", "isUndefined"]);
            expect(payload4.value).toEqual(undefined);
        })

        test("Events Bubble", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener("on_level1_update", (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager._setters.setLevel1_level2Val("Hi there again!")
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

        test("setState With Explicit Paths", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener(testManager.paths.level1.level2Val, (payload: EventPayload) => {
                    resolve(payload)
                });
                testManager.setState((prevState: StateObject) => ({ level1: { ...prevState.level1, level2Val: "Hi Again!!!" } }), null, [testManager.paths.level1.level2Val])
            })
            expect(payload.path).toEqual(testManager.paths.level1.level2Val.__$path);
            expect(payload.value).toBe("Hi Again!!!");
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
                await testManager._setters.setMyVal(1);
                await testManager._setters.setMyVal(2);
                testManager.removeEventListener(testManager.paths.myVal, callback)
                await testManager._setters.setMyVal(3);
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
        delete WINDOW.name;
        const initPersistState = {
            a: {
                b: {
                    c: 3
                },
                d: 4
            },
            e: 5
        }
        const manager = new Spiccato<typeof initPersistState>(initPersistState, {
            id: "Persist",
        })

        manager.connectToLocalStorage({
            persistKey: "persist",
            initializeFromLocalStorage: false,
            providerID: "Persist",
            privateState: [manager.paths.e, manager.paths.a.b.c]
        })

        manager.init()

        manager._setters.setA_d(10);
        expect(manager.state.a.b.c).toBe(3);
        expect(manager.state.e).toBe(5);
        expect(manager.state.a.d).toBe(10);
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
            privateState: [manager.paths.b]
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
            privateState: [manager.paths.b],
            deepSanitizeState: false
        })

        manager.init()
        expect(manager.state.a).toEqual(100);
        expect(manager.state.b).toBeUndefined();
        expect("b" in manager.state).toBe(true);
        expect(manager._setters.setB).toBeDefined();
        manager._setters.setA(100);
        expect(manager.state.a).toBe(100);
        expect(manager.state.b).toBeUndefined();
        expect("b" in manager.state).toBe(true)
    })

    test("Subscriber deep sanitization", () => {
        Spiccato.clear()
        WINDOW.name = "sanitizedSubscriber"
        WINDOW.localStorage.setItem("init", JSON.stringify({ a: 100 }))

        const initState = {a: 1, b: 2};
        type Getters = {

        }
        type Setters = {
            setA: (n: number) => Promise<StateObject>,
            setB: () => void,
        }
        type Methods = {

        }
        type InstanceSignature = SpiccatoInstance<typeof initState, Getters, Setters, Methods>


        const manager = new Spiccato<typeof initState, Getters, Setters, Methods>(initState, { id: "localStorageInit" })
        manager.connectToLocalStorage({
            persistKey: "init",
            subscriberIDs: ["sanitizedSubscriber"],
            initializeFromLocalStorage: true,
            privateState: [manager.paths.b],
            deepSanitizeState: true
        })

        manager.init()
        expect(manager.state.a).toEqual(100);
        expect(manager.state.b).toBeUndefined();
        expect("b" in manager.state).toBe(false);
        expect(manager.setters.setB).toBeUndefined();
        manager.setters.setA(100);
        expect(manager.state.a).toBe(100);
        expect(manager.state.b).toBeUndefined();
        expect("b" in manager.state).toBe(false)
    })

})