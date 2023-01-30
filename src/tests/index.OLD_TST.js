"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const testManager = new index_1.StateManager({
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
}, {
    id: "TEST"
});
testManager.init();
testManager.addCustomGetters({
    getAddedNums: function () {
        return this.state.num1 + this.state.num2;
    }
});
testManager.addCustomSetters({
    setBothNums(num1, num2) {
        this.setState((prevState) => {
            return { num1, num2 };
        });
    }
});
testManager.addCustomMethods({
    deriveAdditionToNum1(num) {
        return this.getters.getNum1() + num;
    }
});
testManager.addNamespacedMethods({
    api: {
        getUser(userID) {
            const user = { name: "test", id: 1 };
            this.setters.setUser(user);
        }
    }
});
describe("Initialization:", () => {
    test("Init", () => {
        expect(testManager).toBeInstanceOf(index_1.StateManager);
    });
    test("getManagerByID", () => {
        expect(testManager).toBe(index_1.StateManager.getManagerById("TEST"));
    });
});
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
        });
    });
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
        });
    });
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
    });
});
describe("Events", () => {
    describe("Payload", () => {
        test("Standard Payload", () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = yield new Promise(resolve => {
                testManager.addEventListener("on_myVal_update", (payload) => {
                    resolve(payload);
                });
                testManager.setters.setMyVal(42);
            });
            expect(payload.path).toBe("myVal");
            expect(payload.value).toBe(42);
        }));
        test("Nested Payload", () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = yield new Promise(resolve => {
                testManager.addEventListener("on_level1_level2Val_update", (payload) => {
                    resolve(payload);
                });
                testManager.setters.setLevel1_level2Val("Goodbye");
            });
            expect(payload.path).toEqual(["level1", "level2Val"]);
            expect(payload.value).toBe("Goodbye");
        }));
        test("Nested Payload Event Bubbles", () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = yield new Promise(resolve => {
                testManager.addEventListener("on_level1_update", (payload) => {
                    resolve(payload);
                });
                testManager.setters.setLevel1_level2Val("Hi there again!");
            });
            expect(payload.path).toEqual(["level1"]);
            expect(payload.value.level2Val).toBe("Hi there again!");
            expect(payload.value.level2.level3).toBeDefined();
        }));
        test("Full State Update", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const payload = yield new Promise(resolve => {
                testManager.addEventListener("update", (payload) => {
                    resolve(payload);
                });
                testManager.setState({ myVal: 84 });
            });
            expect(payload.state).toStrictEqual(testManager.state);
            expect((_a = payload.state) === null || _a === void 0 ? void 0 : _a.myVal).toBe(84);
        }));
        test("removeEventListener", () => __awaiter(void 0, void 0, void 0, function* () {
            const value = yield new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
                const callback = (payload) => {
                    if (payload.value > 2)
                        resolve(payload.value); // if it makes it to the third call this will resolve to '3' and will fail the test
                };
                testManager.addEventListener("on_my_val_update", callback);
                yield testManager.setters.setMyVal(1);
                yield testManager.setters.setMyVal(2);
                testManager.removeEventListener("on_myVal_update", callback);
                yield testManager.setters.setMyVal(3);
                resolve(0);
            }));
            expect(value).toBe(0);
        }));
    });
});
describe("Local Storage Peristance", () => {
    test("Provider window name is set correctly", () => {
        const manager = new index_1.StateManager({}, {
            id: "main",
        });
        manager.connectToLocalStorage({
            persistKey: "main",
            initializeFromLocalStorage: false,
            providerID: "windowTest",
        });
        manager.init();
        expect(index_1.WINDOW.name).toEqual("windowTest");
    });
    test("Persistance doesn't mutate local state", () => {
        index_1.StateManager.clear();
        const manager = new index_1.StateManager({
            a: {
                b: {
                    c: 3
                },
                d: 4
            },
            e: 5
        }, {
            id: "Persist",
        });
        manager.connectToLocalStorage({
            persistKey: "persist",
            initializeFromLocalStorage: false,
            providerID: "Persist",
            privateState: ["e", ["a", "b", "c"]]
        });
        manager.init();
        manager.setters.setA_d(10);
        expect(manager.state.a.b.c).toBe(3);
        expect(manager.state.e).toBe(5);
    });
    test("Initialize provider from local storage", () => {
        index_1.StateManager.clear();
        index_1.WINDOW.name = "provider";
        index_1.WINDOW.localStorage.setItem("init", JSON.stringify({ a: 100 }));
        const manager = new index_1.StateManager({ a: 1, b: 2 }, { id: "localStorageInit" });
        manager.connectToLocalStorage({
            persistKey: "init",
            initializeFromLocalStorage: true,
            providerID: "provider",
            privateState: ["b"]
        });
        manager.init();
        expect(manager.state.a).toEqual(100);
        expect(manager.state.b).toEqual(2);
    });
    test("Initialize subscriber from local storage", () => {
        index_1.StateManager.clear();
        index_1.WINDOW.name = "someSubscriber";
        index_1.WINDOW.localStorage.setItem("init", JSON.stringify({ a: 100 }));
        const manager = new index_1.StateManager({ a: 1, b: 2 }, { id: "localStorageInit" });
        manager.connectToLocalStorage({
            persistKey: "init",
            subscriberIDs: ["someSubscriber"],
            initializeFromLocalStorage: true,
            privateState: ["b"]
        });
        manager.init();
        expect(manager.state.a).toEqual(100);
        expect(manager.state.b).toBeUndefined();
    });
});
