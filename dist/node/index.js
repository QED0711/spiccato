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
exports.WINDOW = void 0;
/************************************* IMPORTS **************************************/
const helpers_1 = require("./utils/helpers");
const errors_1 = require("./errors");
/************************************* DEFAULTS **************************************/
const DEFAULT_INIT_OPTIONS = {
    id: "",
    dynamicGetters: true,
    dynamicSetters: true,
    allowDynamicAccessorOverride: true,
    nestedGetters: true,
    nestedSetters: true,
    debug: false,
    enableWriteProtection: true,
};
const DEFAULT_STORAGE_OPTIONS = {
    persistKey: "",
    initializeFromLocalStorage: false,
    subscriberIDs: [],
    clearStorageOnUnload: true,
    removeChildrenOnUnload: true,
    privateState: [],
    deepSanitizeState: true
};
const DEFAULT_DYNAMIC_SETTER_OPTIONS = {
    explicitUpdatePath: true
};
let IS_BROWSER;
try {
    exports.WINDOW = window;
    IS_BROWSER = true;
}
catch (err) {
    exports.WINDOW = global;
    IS_BROWSER = false;
}
if (!("localStorage" in exports.WINDOW))
    exports.WINDOW.localStorage = new helpers_1._localStorage;
const PROTECTED_NAMESPACES = {
    state: true,
    setters: true,
    getters: true,
    methods: true,
    initOptions: true,
    paths: true,
    _schema: true,
    _state: true,
    _bindToLocalStorage: true,
    windowManager: true,
    eventListeners: true
};
const RESERVED_STATE_KEYS = [
    "*"
];
/* SPICCATO */
class Spiccato {
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
    constructor(stateSchema = {}, options) {
        this.initOptions = Object.assign(Object.assign({}, DEFAULT_INIT_OPTIONS), options);
        if ((0, helpers_1.hasCircularReference)(stateSchema)) {
            throw new errors_1.InvalidStateSchemaError("State Schema has a circular reference. Spiccato does not allow circular references");
        }
        else if ((0, helpers_1.stateSchemaHasFunctions)(stateSchema)) {
            throw new errors_1.InvalidStateSchemaError("State Schema has `functions` for some of its values. Spiccato does not allow function values in the state schema. Consider using the `addCustomMethods` or `addNamespacedMethods` functionality instead.");
        }
        this._schema = Object.freeze(Object.assign({}, stateSchema));
        this._state = stateSchema;
        this.paths = new helpers_1.PathTree(this._schema).root;
        const stateKeyViolations = RESERVED_STATE_KEYS.filter(k => Object.keys(this._state).includes(k));
        if (stateKeyViolations.length) {
            throw new errors_1.ReservedStateKeyError(`The key: '${stateKeyViolations[0]}' is reserved at this level. Please select a different key for this state resource.`);
        }
        this.getters = {};
        this.setters = {};
        this.methods = {};
        this._initialized = false;
        this._bindToLocalStorage = false;
        this._role = "provider";
        this.windowManager = IS_BROWSER ? new helpers_1.WindowManager(exports.WINDOW) : null;
        this._eventListeners = {};
        if (IS_BROWSER) {
            exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.addEventListener("beforeunload", this.handleUnload.bind(this));
            exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.addEventListener("onunload", this.handleUnload.bind(this));
        }
        this.constructor.registerManager(this);
    }
    get state() {
        return this.initOptions.enableWriteProtection ? (0, helpers_1.createStateProxy)(this._state, this._schema) : this._state;
    }
    get id() {
        return this.initOptions.id;
    }
    init() {
        this._applyState();
        this._initialized = true;
    }
    _applyState() {
        var _a;
        if (this._bindToLocalStorage) {
            this._persistToLocalStorage(this._state);
        }
        if (((_a = this.storageOptions) === null || _a === void 0 ? void 0 : _a.deepSanitizeState) && this._role !== "provider") {
            this._schema = (0, helpers_1.sanitizeState)(this._state, this.storageOptions.privateState)[0];
            this._state = this._schema;
            Object.freeze(this._schema);
        }
        for (let k in this._state) {
            if (this.initOptions.dynamicGetters) {
                this.getters[(0, helpers_1.formatAccessor)(k, "get")] = () => {
                    // this accesses `this.state` and NOT `this._state`. If the getter returns a higher level object, that object should be immutable
                    return this.state[k];
                };
            }
            if (this.initOptions.dynamicSetters) {
                this.setters[(0, helpers_1.formatAccessor)(k, "set")] = (v, callback, options) => {
                    options = Object.assign(Object.assign({}, DEFAULT_DYNAMIC_SETTER_OPTIONS), options);
                    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        resolve(yield this.setState({ [k]: v }, callback, (options === null || options === void 0 ? void 0 : options.explicitUpdatePath) ? [[k]] : null));
                    }));
                };
            }
        }
        // nested interactions
        const createNestedGetters = this.initOptions.dynamicGetters && this.initOptions.nestedGetters;
        const createNestedSetters = this.initOptions.dynamicSetters && this.initOptions.nestedSetters;
        if (createNestedGetters || createNestedSetters) {
            const nestedPaths = (0, helpers_1.getNestedRoutes)(this._state);
            for (let path of nestedPaths) {
                if (createNestedGetters) {
                    this.getters[(0, helpers_1.formatAccessor)(path, "get")] = () => {
                        let value = this._state[path[0]];
                        for (let i = 1; i < path.length; i++) {
                            value = value === null || value === void 0 ? void 0 : value[path[i]];
                        }
                        return value;
                    };
                }
                if (createNestedSetters) {
                    this.setters[(0, helpers_1.formatAccessor)(path, "set")] = (v, callback, options) => {
                        options = Object.assign(Object.assign({}, DEFAULT_DYNAMIC_SETTER_OPTIONS), options);
                        const updatedState = (0, helpers_1.nestedSetterFactory)(this._state, path)(v);
                        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                            resolve(yield this.setState(updatedState, callback, (options === null || options === void 0 ? void 0 : options.explicitUpdatePath) ? [path] : null));
                        }));
                    };
                }
            }
        }
    }
    _persistToLocalStorage(state) {
        var _a;
        if (this._bindToLocalStorage && !!this.storageOptions.persistKey) {
            const [sanitized, removed] = (0, helpers_1.sanitizeState)(state, this.storageOptions.privateState || []);
            (_a = exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.localStorage) === null || _a === void 0 ? void 0 : _a.setItem(this.storageOptions.persistKey, JSON.stringify(sanitized));
            this._state = (0, helpers_1.restoreState)(state, removed);
        }
    }
    getStateFromPath(path) {
        if (typeof path === "string") {
            return this.state[path];
        }
        else if (Array.isArray(path)) {
            let val = this.state;
            for (let p of path) {
                val = val[p];
                if (val === undefined)
                    return undefined;
            }
            return val;
        }
    }
    setState(updater, callback = null, updatedPaths = null) {
        return new Promise(resolve => {
            if (typeof updater === 'object') {
                updatedPaths !== null && updatedPaths !== void 0 ? updatedPaths : (updatedPaths = (0, helpers_1.getUpdatedPaths)(updater, this._state, this._schema));
                if (Array.isArray(updater)) {
                    throw new errors_1.InvalidStateUpdateError("Update value passed to `setState` is an array - must be an object or a function that returns an object, not an array");
                }
                this._state = Object.assign(Object.assign({}, this._state), updater);
            }
            else if (typeof updater === 'function') {
                const result = updater(this.state);
                if (typeof result !== "object")
                    throw new errors_1.InvalidStateUpdateError("Functional update did not return an object. The function passed to `setState` must return an object");
                let updaterValue;
                if (Array.isArray(result)) {
                    updaterValue = result[0];
                    updatedPaths = result[1];
                }
                else {
                    updaterValue = result;
                }
                updatedPaths !== null && updatedPaths !== void 0 ? updatedPaths : (updatedPaths = (0, helpers_1.getUpdatedPaths)(updaterValue, this._state, this._schema));
                this._state = Object.assign(Object.assign({}, this._state), updaterValue);
            }
            else {
                // if state update could not be performed, reset updatedPaths to an empty array
                updatedPaths = [];
            }
            const updated = this.initOptions.enableWriteProtection ? (0, helpers_1.createStateProxy)(this._state, this._schema) : this._state;
            resolve(updated);
            callback === null || callback === void 0 ? void 0 : callback(updated);
            this.emitEvent("update", { state: updated });
            for (let path of updatedPaths) {
                this.emitUpdateEventFromPath(path);
            }
            if (this._bindToLocalStorage && this.storageOptions.persistKey) {
                this._persistToLocalStorage(this._state);
            }
        });
    }
    addCustomGetters(getters) {
        if (!this._initialized) {
            throw new errors_1.InitializationError("`addCustomGetters` called before init(). This may lead to unexpected behavior with dynamic getter overrides");
        }
        for (let [key, callback] of Object.entries(getters)) {
            if (!(key in this.getters) || (key in this.getters && this.initOptions.allowDynamicAccessorOverride)) {
                getters[key] = callback.bind(this);
            }
        }
        this.getters = Object.assign(Object.assign({}, this.getters), getters);
    }
    addCustomSetters(setters) {
        if (!this._initialized) {
            throw new errors_1.InitializationError("`addCustomSetters` called before init(). This may lead to unexpected behavior with dynamic setter overrides");
        }
        for (let [key, callback] of Object.entries(setters)) {
            if (!(key in this.setters) || (key in this.setters && this.initOptions.allowDynamicAccessorOverride)) {
                setters[key] = callback.bind(this);
            }
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
            if (PROTECTED_NAMESPACES[ns]) {
                throw new errors_1.ProtectedNamespaceError(`The namespace '${ns}' is protected. Please choose a different namespace for you methods.`);
            }
            this[ns] = {};
            for (let [key, callback] of Object.entries(namespaces[ns])) {
                this[ns][key] = callback.bind(this);
            }
        }
    }
    /********** EVENTS **********/
    addEventListener(eventType, callback) {
        if (Array.isArray(eventType)) {
            eventType = "on_" + eventType.join("_") + "_update";
        }
        if (eventType instanceof helpers_1.PathNode) {
            eventType = "on_" + eventType.__$path.join("_") + "_update";
        }
        if (eventType in this._eventListeners) {
            this._eventListeners[eventType].push(callback);
        }
        else {
            this._eventListeners[eventType] = [callback];
        }
    }
    removeEventListener(eventType, callback) {
        var _a;
        if (Array.isArray(eventType)) {
            eventType = "on_" + eventType.join("_") + "_update";
        }
        if (eventType instanceof helpers_1.PathNode) {
            eventType = "on_" + eventType.__$path.join("_") + "_update";
        }
        this._eventListeners[eventType] = (_a = this._eventListeners[eventType]) === null || _a === void 0 ? void 0 : _a.filter(cb => cb !== callback);
    }
    emitEvent(eventType, payload) {
        var _a;
        (_a = this._eventListeners[eventType]) === null || _a === void 0 ? void 0 : _a.forEach(callback => {
            callback(payload);
        });
    }
    emitUpdateEventFromPath(path) {
        if (path instanceof helpers_1.PathNode)
            path = path.__$path;
        let p, v;
        for (let i = 0; i < path.length; i++) {
            p = path.slice(0, i + 1);
            v = this._state;
            for (let key of p) {
                v = v[key];
            }
            this.emitEvent("on_" + p.join("_") + "_update", { path: p, value: v });
        }
    }
    /********** LOCAL STORAGE **********/
    connectToLocalStorage(storageOptions) {
        var _a;
        if (this._initialized) {
            throw new errors_1.InitializationError("`init()` method called before `connectToLocalStorage()`.");
        }
        this.storageOptions = Object.assign(Object.assign({}, DEFAULT_STORAGE_OPTIONS), storageOptions);
        this.storageOptions.privateState = this.storageOptions.privateState.map((ps) => ps instanceof helpers_1.PathNode ? ps.__$path : typeof ps === "string" ? [ps] : ps);
        // if window does not have a "name" property, default to the provider window id
        if (!exports.WINDOW.name && this.storageOptions.providerID) {
            exports.WINDOW.name = this.storageOptions.providerID;
        }
        if (!exports.WINDOW.name) {
            console.error("If connecting to localStorage, providerID must be defined in storageOptions passed to 'connectToToLocalStorage'");
            return;
        }
        this.initOptions.debug && console.log("DEBUG: window.name", exports.WINDOW.name);
        this.initOptions.debug && console.assert(!!exports.WINDOW.name);
        const isProviderWindow = exports.WINDOW.name === this.storageOptions.providerID;
        const isSubscriberWindow = ((_a = this.storageOptions.subscriberIDs) !== null && _a !== void 0 ? _a : []).includes(exports.WINDOW.name);
        this._role = isProviderWindow ? "provider" : isSubscriberWindow ? "subscriber" : "";
        this._bindToLocalStorage = true;
        if (this.storageOptions.initializeFromLocalStorage || isSubscriberWindow) {
            if (!!exports.WINDOW.localStorage.getItem(this.storageOptions.persistKey)) {
                if (isProviderWindow && !isSubscriberWindow) {
                    this._state = Object.assign(Object.assign({}, this._state), JSON.parse(exports.WINDOW.localStorage.getItem(this.storageOptions.persistKey)));
                }
                else if (isSubscriberWindow) {
                    this._state = JSON.parse(exports.WINDOW.localStorage.getItem(this.storageOptions.persistKey));
                }
                else {
                    IS_BROWSER && console.warn("window is not a provider and has not been identified as a subscriber. State will not be loaded. See docs on provider and subscriber roles");
                    this._bindToLocalStorage = false;
                }
            }
        }
        if ("addEventListener" in exports.WINDOW && this._bindToLocalStorage) {
            exports.WINDOW.addEventListener("storage", () => {
                this._updateFromLocalStorage();
            });
        }
    }
    _updateFromLocalStorage() {
        this.setState(Object.assign(Object.assign({}, this._state), JSON.parse(exports.WINDOW.localStorage.getItem(this.storageOptions.persistKey))));
    }
    handleUnload(event) {
        var _a;
        // clear local storage only if specified by user AND the window being closed is the provider window
        if (this.storageOptions.clearStorageOnUnload && this.storageOptions.providerID === (exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.name)) {
            exports.WINDOW === null || exports.WINDOW === void 0 ? void 0 : exports.WINDOW.localStorage.removeItem(this.storageOptions.persistKey);
        }
        // close all children (and grand children) windows if this functionality has been specified by the user   
        if (this.storageOptions.removeChildrenOnUnload) {
            (_a = this.windowManager) === null || _a === void 0 ? void 0 : _a.removeSubscribers();
        }
    }
}
exports.default = Spiccato;
/* Class Properties */
Spiccato.managers = {};
