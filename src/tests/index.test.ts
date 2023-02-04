import { StateManager, WINDOW } from '../index'
import { EventPayload, StateObject } from '../types';

const testManager = new StateManager(
    {
        user: {},
        myVal: 1,
        num1: 5,
        num2: 10,
        level1: {
            level2: {
                level3: 3
            },
            level2Val: "hello"
        }
    },
    {
        id: "TEST"
    }
);

testManager.init();

testManager.addCustomGetters({
    getAddedNums: function (this: StateManager) {
        return this.state.num1 + this.state.num2;
    }
})

testManager.addCustomSetters({
    setBothNums(this: StateManager, num1: number, num2: number) {
        this.setState((prevState: StateObject) => {
            return { num1, num2 };
        })
    }
})

testManager.addCustomMethods({
    deriveAdditionToNum1(this: StateManager, num: number) {
        return this.getters.getNum1() + num;
    }
})

testManager.addNamespacedMethods({
    api: {
        getUser(this: StateManager, userID: number) {
            const user = { name: "test", id: 1 };
            this.setters.setUser(user);
        }
    }
})



describe("Initialization:", () => {
    test("Init", () => {
        expect(testManager).toBeInstanceOf(StateManager);
    });

    test("getManagerByID", () => {
        expect(testManager).toBe(StateManager.getManagerById("TEST"));
    });
})





describe("State Interactions", () => {
    describe("State Access", () => {
        test("State is accessible", () => {
            expect(testManager.state.myVal).toBeDefined();
        })

        test("Accessed state is immutable", () => {
            function shouldFail(path: string[], update: any): number {
                let val = testManager.state
                try {
                    for (let i = 0; i < path.length; i++) {
                       if(i  === path.length - 1){
                           val[path[i]] = update;
                           return 1
                       } 
                       val = val[path[i]]
                    }
                    return 1
                } catch (err) {
                    return 0
                }
            }

            expect(shouldFail(["myVal"], 14)).toBe(0)
            // expect(shouldFail(["level1", "level2", "level3"], "TEST")).toBe(0);

            // console.log(testManager.state)
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
    })

    describe("Setters", () => {
        test("setState", () => {
            testManager.setState({ myVal: 2 });
            expect(testManager.getters.getMyVal()).toBe(2);
        });

        test("setState with functional argument", () => {
            testManager.setState((prevState: { [key: string]: any }) => {
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
                testManager.addEventListener("on_myVal_update", (payload: EventPayload) => {
                    resolve(payload)
                })
                testManager.setters.setMyVal(42);
            })
            expect(payload.path).toEqual(["myVal"]);
            expect(payload.value).toBe(42);

        });

        test("Nested Payload", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener("on_level1_level2Val_update", (payload: EventPayload) => {
                    resolve(payload);
                })
                testManager.setters.setLevel1_level2Val("Goodbye")
            })

            expect(payload.path).toEqual(["level1", "level2Val"]);
            expect(payload.value).toBe("Goodbye");
        });

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
            expect(payload.state).toStrictEqual(testManager.state);
            expect(payload.state?.myVal).toBe(84);
        })


        test("removeEventListener", async () => {

            const value: number = await new Promise(async resolve => {
                const callback = (payload: EventPayload) => {
                    if (payload.value > 2) resolve(payload.value) // if it makes it to the third call this will resolve to '3' and will fail the test
                }
                testManager.addEventListener("on_my_val_update", callback)
                await testManager.setters.setMyVal(1);
                await testManager.setters.setMyVal(2);
                testManager.removeEventListener("on_myVal_update", callback)
                await testManager.setters.setMyVal(3);
                resolve(0)
            })

            expect(value).toBe(0);

        })
    });

})

describe("Local Storage Peristance", () => {

    test("Provider window name is set correctly", () => {
        const manager = new StateManager({}, {
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
        StateManager.clear()
        const manager = new StateManager({
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
        StateManager.clear()
        WINDOW.name = "provider"
        WINDOW.localStorage.setItem("init", JSON.stringify({ a: 100 }))
        const manager = new StateManager({ a: 1, b: 2 }, { id: "localStorageInit" })
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
        StateManager.clear()
        WINDOW.name = "someSubscriber"
        WINDOW.localStorage.setItem("init", JSON.stringify({ a: 100 }))
        const manager = new StateManager({ a: 1, b: 2 }, { id: "localStorageInit" })
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