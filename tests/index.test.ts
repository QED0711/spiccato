import { StateManager, EventPayload } from '../index'

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

testManager.addCustomGetters({
    getAddedNums: function (this: StateManager) {
        return this.state.num1 + this.state.num2;
    }
})

testManager.addCustomSetters({
    setBothNums(this: StateManager, num1: number, num2: number) {
        this.setState((prevState: { [key: string]: any }) => {
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

            expect(payload.path).toBe("myVal");
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

        test("Full State Update", async () => {
            const payload: EventPayload = await new Promise(resolve => {
                testManager.addEventListener("update", (payload: EventPayload) => {
                    resolve(payload);
                });
                testManager.setState({myVal: 84});
            })
            expect(payload.state).toStrictEqual(testManager.state);
            expect(payload.state?.myVal).toBe(84);
        })

        test("removeEventListener", async () => {
    
            const value: number = await new Promise(async resolve => {
                const callback = (payload: EventPayload) => {
                    if(payload.value > 2) resolve(payload.value) // if it makes it to the third call this will resolve to '3' and will fail the test
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