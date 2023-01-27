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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = exports.WINDOW = void 0;
const helpers_js_1 = require("./utils/helpers.js");
const DEFAULT_INIT_OPTIONS = {
    id: "",
    dynamicGetters: true,
    dynamicSetters: true,
    nestedGetters: true,
    nestedSetters: true,
    connectToLocalStorage: false,
    persistKey: "",
    initializeFromLocalStorage: false,
    providerID: "",
    subscriberIDs: [],
    clearStorageOnUnload: true,
    removeChildrenOnUnload: true,
    privateState: [],
};
const IS_BROWSER = "window" in (this !== null && this !== void 0 ? this : {});
exports.WINDOW = (_a = (IS_BROWSER ? (Object.assign({}, (this !== null && this !== void 0 ? this : { window: null }))).window : (Object.assign({}, (this !== null && this !== void 0 ? this : { global: null }))).global)) !== null && _a !== void 0 ? _a : {};
exports.WINDOW = exports.WINDOW !== null && exports.WINDOW !== void 0 ? exports.WINDOW : {};
console.log(exports.WINDOW);
exports.WINDOW.localStorage = (_b = exports.WINDOW.localStorage) !== null && _b !== void 0 ? _b : {
    getItem(key) { },
    setItem(key, value) { },
    removeItem(key) { },
    clear() { }
};
class StateManager {
    static registerManager(instance) {
        if (instance.initOptions.id in this.managers) {
            console.warn(`State Manager with id: '${instance.initOptions.id}' already exists. It has been overwritten`);
        }
        this.managers[instance.initOptions.id] = instance;
    }
    static getManagerById(id) {
        return this.managers[id];
    }
    static clear() {
        this.managers = {};
    }
    constructor(state = {}, options) {
        this.initOptions = Object.assign(Object.assign({}, DEFAULT_INIT_OPTIONS), options);
        this.state = state;
        this.getters = {};
        this.setters = {};
        this.methods = {};
        this.windowManager = IS_BROWSER ? new helpers_js_1.WindowManager(exports.WINDOW) : null;
        if (this.initOptions.connectToLocalStorage) {
            this.establishLocalStorageConnection();
        }
        this._applyState();
        this._eventListeners = {};
        if (IS_BROWSER) {
            exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.addEventListener("beforeunload", this.handleUnload.bind(this));
            exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.addEventListener("onunload", this.handleUnload.bind(this));
        }
        this.constructor.registerManager(this);
    }
    _applyState() {
        for (let k in this.state) {
            if (this.initOptions.dynamicGetters) {
                this.getters[(0, helpers_js_1.formatAccessor)(k, "get")] = () => {
                    return this.state[k];
                };
            }
            if (this.initOptions.dynamicSetters) {
                this.setters[(0, helpers_js_1.formatAccessor)(k, "set")] = (v, callback) => {
                    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        resolve(yield this.setState({ [k]: v }, callback));
                        this.emitEvent("on_" + k + "_update", { path: k, value: v });
                    }));
                };
            }
        }
        // nested interactions
        const createNestedGetters = this.initOptions.dynamicGetters && this.initOptions.nestedGetters;
        const createNestedSetters = this.initOptions.dynamicSetters && this.initOptions.nestedSetters;
        if (createNestedGetters || createNestedSetters) {
            const nestedPaths = (0, helpers_js_1.getNestedRoutes)(this.state);
            for (let path of nestedPaths) {
                if (createNestedGetters) {
                    this.getters[(0, helpers_js_1.formatAccessor)(path, "get")] = () => {
                        let value = this.state[path[0]];
                        for (let i = 1; i < path.length; i++) {
                            value = value[path[i]];
                        }
                        return value;
                    };
                }
                if (createNestedSetters) {
                    this.setters[(0, helpers_js_1.formatAccessor)(path, "set")] = (v, callback) => {
                        const updatedState = (0, helpers_js_1.nestedSetterFactory)(this.state, path)(v);
                        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                            resolve(yield this.setState(updatedState, callback));
                            this.emitEvent("on_" + path.join("_") + "_update", { path, value: v });
                        }));
                    };
                }
            }
        }
    }
    _persistToLocalStorage(state) {
        var _a;
        if (this.initOptions.connectToLocalStorage && !!this.initOptions.windowID) {
            const [sanitized, removed] = (0, helpers_js_1.sanitizeState)(state, this.initOptions.privateState || []);
            (_a = exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.localStorage) === null || _a === void 0 ? void 0 : _a.setItem(this.initOptions.windowID, JSON.stringify(sanitized));
            this.state = (0, helpers_js_1.restoreState)(state, removed);
        }
    }
    setState(updater, callback = null) {
        return new Promise(resolve => {
            if (typeof updater === 'object') {
                this.state = Object.assign(Object.assign({}, this.state), updater);
            }
            else if (typeof updater === 'function') {
                this.state = Object.assign(Object.assign({}, this.state), updater(Object.assign({}, this.state)));
            }
            const updated = Object.assign({}, this.state);
            resolve(updated);
            callback === null || callback === void 0 ? void 0 : callback(updated);
            this.emitEvent("update", { state: updated });
            if (this.initOptions.connectToLocalStorage && this.initOptions.windowID) {
                this._persistToLocalStorage(this.state);
                // window.localStorage.setItem(this.initOptions.windowID, JSON.stringify(this.state))
            }
        });
    }
    addCustomGetters(getters) {
        for (let [key, callback] of Object.entries(getters)) {
            getters[key] = callback.bind(this);
        }
        this.getters = Object.assign(Object.assign({}, this.getters), getters);
    }
    addCustomSetters(setters) {
        for (let [key, callback] of Object.entries(setters)) {
            setters[key] = callback.bind(this);
        }
        this.setters = Object.assign(Object.assign({}, this.setters), setters);
    }
    addCustomMethods(methods) {
        for (let [key, callback] of Object.entries(methods)) {
            methods[key] = callback.bind(this);
        }
        this.methods = Object.assign(Object.assign({}, this.methods), methods);
    }
    addNamespacedMethods(namespaces) {
        for (let ns in namespaces) {
            this[ns] = {};
            for (let [key, callback] of Object.entries(namespaces[ns])) {
                this[ns][key] = callback.bind(this);
            }
        }
    }
    /********** EVENTS **********/
    addEventListener(eventType, callback) {
        if (eventType in this._eventListeners) {
            this._eventListeners[eventType].push(callback);
        }
        else {
            this._eventListeners[eventType] = [callback];
        }
    }
    removeEventListener(eventType, callback) {
        var _a;
        this._eventListeners[eventType] = (_a = this._eventListeners[eventType]) === null || _a === void 0 ? void 0 : _a.filter(cb => cb !== callback);
    }
    emitEvent(eventType, payload) {
        var _a;
        (_a = this._eventListeners[eventType]) === null || _a === void 0 ? void 0 : _a.forEach(callback => {
            callback(payload);
        });
    }
    establishLocalStorageConnection() {
        this.bindToLocalStorage = true;
        if (!exports.WINDOW.name && this.initOptions.providerID) {
            exports.WINDOW.name = this.initOptions.providerID;
        }
        if (this.initOptions.initializeFromLocalStorage) {
            if (!!exports.WINDOW.localStorage.getItem(this.initOptions.windowID)) {
                this.state = Object.assign(Object.assign({}, this.state), JSON.parse(exports.WINDOW.localStorage.getItem(this.initOptions.windowID)));
            }
        }
    }
    handleUnload(event) {
        var _a;
        // clear local storage only if specified by user AND the window being closed is the provider window
        if (this.initOptions.clearStorageOnUnload && this.initOptions.providerID === (exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.name)) {
            exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.localStorage.removeItem(this.initOptions.persistKey);
        }
        // close all children (and grand children) windows if this functionality has been specified by the user   
        if (this.initOptions.removeChildrenOnUnload) {
            (_a = this.windowManager) === null || _a === void 0 ? void 0 : _a.removeChildren();
        }
    }
}
exports.StateManager = StateManager;
/* Class Properties */
StateManager.managers = {};
