var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/************************************* IMPORTS **************************************/
import { formatAccessor, getNestedRoutes, nestedSetterFactory, sanitizeState, restoreState, WindowManager, _localStorage, getUpdatedPaths, createStateProxy, } from './utils/helpers';
import { ProtectedNamespaceError, ReservedStateKeyError } from './errors';
/************************************* DEFAULTS **************************************/
const DEFAULT_INIT_OPTIONS = {
    id: "",
    dynamicGetters: true,
    dynamicSetters: true,
    nestedGetters: true,
    nestedSetters: true,
    debug: false,
    performanceMode: false,
};
const DEFAULT_STORAGE_OPTIONS = {
    persistKey: "",
    initializeFromLocalStorage: false,
    subscriberIDs: [],
    clearStorageOnUnload: true,
    removeChildrenOnUnload: true,
    privateState: [],
};
let IS_BROWSER;
export let WINDOW;
try {
    WINDOW = window;
    IS_BROWSER = true;
}
catch (err) {
    WINDOW = global;
    IS_BROWSER = false;
}
if (!("localStorage" in WINDOW))
    WINDOW.localStorage = new _localStorage;
const PROTECTED_NAMESPACES = {
    state: true,
    setters: true,
    getters: true,
    methods: true,
    initOptions: true,
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
export default class Spiccato {
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
        this._schema = Object.freeze(Object.assign({}, stateSchema));
        this._state = stateSchema;
        const stateKeyViolations = RESERVED_STATE_KEYS.filter(k => Object.keys(this._state).includes(k));
        if (stateKeyViolations.length) {
            throw new ReservedStateKeyError(`The key: '${stateKeyViolations[0]}' is reserved at this level. Please select a different key for this state resource.`);
        }
        this.getters = {};
        this.setters = {};
        this.methods = {};
        this._bindToLocalStorage = false;
        this.windowManager = IS_BROWSER ? new WindowManager(WINDOW) : null;
        this._eventListeners = {};
        if (IS_BROWSER) {
            WINDOW === null || WINDOW === void 0 ? void 0 : WINDOW.addEventListener("beforeunload", this.handleUnload.bind(this));
            WINDOW === null || WINDOW === void 0 ? void 0 : WINDOW.addEventListener("onunload", this.handleUnload.bind(this));
        }
        this.constructor.registerManager(this);
    }
    get state() {
        return this.initOptions.performanceMode ? this._state : createStateProxy(this._state, this._schema);
    }
    get id() {
        return this.initOptions.id;
    }
    init() {
        this._applyState();
    }
    _applyState() {
        if (this._bindToLocalStorage) {
            this._persistToLocalStorage(this._state);
        }
        for (let k in this._state) {
            if (this.initOptions.dynamicGetters) {
                this.getters[formatAccessor(k, "get")] = () => {
                    // this accesses `this.state` and NOT `this._state`. If the getter returns a higher level object, that object should be immutable
                    return this.state[k];
                };
            }
            if (this.initOptions.dynamicSetters) {
                this.setters[formatAccessor(k, "set")] = (v, callback) => {
                    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        resolve(yield this.setState({ [k]: v }, callback));
                    }));
                };
            }
        }
        // nested interactions
        const createNestedGetters = this.initOptions.dynamicGetters && this.initOptions.nestedGetters;
        const createNestedSetters = this.initOptions.dynamicSetters && this.initOptions.nestedSetters;
        if (createNestedGetters || createNestedSetters) {
            const nestedPaths = getNestedRoutes(this._state);
            for (let path of nestedPaths) {
                if (createNestedGetters) {
                    this.getters[formatAccessor(path, "get")] = () => {
                        let value = this._state[path[0]];
                        for (let i = 1; i < path.length; i++) {
                            value = value[path[i]];
                        }
                        return value;
                    };
                }
                if (createNestedSetters) {
                    this.setters[formatAccessor(path, "set")] = (v, callback) => {
                        const updatedState = nestedSetterFactory(this._state, path)(v);
                        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                            resolve(yield this.setState(updatedState, callback));
                        }));
                    };
                }
            }
        }
    }
    _persistToLocalStorage(state) {
        var _a;
        if (this._bindToLocalStorage && !!this.storageOptions.persistKey) {
            const [sanitized, removed] = sanitizeState(state, this.storageOptions.privateState || []);
            (_a = WINDOW === null || WINDOW === void 0 ? void 0 : WINDOW.localStorage) === null || _a === void 0 ? void 0 : _a.setItem(this.storageOptions.persistKey, JSON.stringify(sanitized));
            this._state = restoreState(state, removed);
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
    setState(updater, callback = null) {
        return new Promise(resolve => {
            let updatedPaths = [];
            if (typeof updater === 'object') {
                updatedPaths = getUpdatedPaths(updater, this._state);
                this._state = Object.assign(Object.assign({}, this._state), updater);
            }
            else if (typeof updater === 'function') {
                const updaterValue = updater(this.state);
                updatedPaths = getUpdatedPaths(updaterValue, this._state);
                this._state = Object.assign(Object.assign({}, this._state), updaterValue);
            }
            // const updated = Object.freeze({ ...this._state })
            const updated = this.initOptions.performanceMode ? this._state : createStateProxy(this._state, this._schema);
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
            if (PROTECTED_NAMESPACES[ns]) {
                throw new ProtectedNamespaceError(`The namespace '${ns}' is protected. Please choose a different namespace for you methods.`);
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
        this._eventListeners[eventType] = (_a = this._eventListeners[eventType]) === null || _a === void 0 ? void 0 : _a.filter(cb => cb !== callback);
    }
    emitEvent(eventType, payload) {
        var _a;
        (_a = this._eventListeners[eventType]) === null || _a === void 0 ? void 0 : _a.forEach(callback => {
            callback(payload);
        });
    }
    emitUpdateEventFromPath(path) {
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
        this.storageOptions = Object.assign(Object.assign({}, DEFAULT_STORAGE_OPTIONS), storageOptions);
        // if window does not have a "name" peroperty, default to the provider window id
        if (!WINDOW.name && this.storageOptions.providerID) {
            WINDOW.name = this.storageOptions.providerID;
        }
        if (!WINDOW.name) {
            console.error("If connecting to localStorage, providerID must be defined in sotrageOptions passed to 'connectoToLocalStorage'");
            return;
        }
        this.initOptions.debug && console.log("DEBUG: window.name", WINDOW.name);
        this.initOptions.debug && console.assert(!!WINDOW.name);
        const isProviderWindow = WINDOW.name === this.storageOptions.providerID;
        const isSubscriberWindow = ((_a = this.storageOptions.subscriberIDs) !== null && _a !== void 0 ? _a : []).includes(WINDOW.name);
        this._bindToLocalStorage = true;
        if (this.storageOptions.initializeFromLocalStorage || isSubscriberWindow) {
            if (!!WINDOW.localStorage.getItem(this.storageOptions.persistKey)) {
                if (isProviderWindow && !isSubscriberWindow) {
                    this._state = Object.assign(Object.assign({}, this._state), JSON.parse(WINDOW.localStorage.getItem(this.storageOptions.persistKey)));
                }
                else if (isSubscriberWindow) {
                    this._state = JSON.parse(WINDOW.localStorage.getItem(this.storageOptions.persistKey));
                }
                else {
                    IS_BROWSER && console.warn("window is not a provider and has not been identified as a subscriber. State will not be loaded. See docs on provider and subscriber roles");
                    this._bindToLocalStorage = false;
                }
            }
        }
        if ("addEventListener" in WINDOW && this._bindToLocalStorage) {
            WINDOW.addEventListener("storage", () => {
                this._updateFromLocalStorage();
            });
        }
    }
    _updateFromLocalStorage() {
        this.setState(Object.assign(Object.assign({}, this._state), JSON.parse(WINDOW.localStorage.getItem(this.storageOptions.persistKey))));
    }
    handleUnload(event) {
        var _a;
        // clear local storage only if specified by user AND the window being closed is the provider window
        if (this.storageOptions.clearStorageOnUnload && this.storageOptions.providerID === (WINDOW === null || WINDOW === void 0 ? void 0 : WINDOW.name)) {
            WINDOW === null || WINDOW === void 0 ? void 0 : WINDOW.localStorage.removeItem(this.storageOptions.persistKey);
        }
        // close all children (and grand children) windows if this functionality has been specified by the user   
        if (this.storageOptions.removeChildrenOnUnload) {
            (_a = this.windowManager) === null || _a === void 0 ? void 0 : _a.removeSubscribers();
        }
    }
}
/* Class Properties */
Spiccato.managers = {};
