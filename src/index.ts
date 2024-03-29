/************************************* IMPORTS **************************************/
import {
    formatAccessor,
    getNestedRoutes,
    nestedSetterFactory,
    sanitizeState,
    restoreState,
    WindowManager,
    _localStorage,
    getUpdatedPaths,
    createStateProxy,
    hasCircularReference,
    stateSchemaHasFunctions,
    PathNode,
    PathTree,
} from './utils/helpers'

import {
    StateObject,
    StateUpdateCallback,
    InitializationOptions,
    StorageOptions,
    EventPayload,
    managerID,
    StateSchema,
    DynamicSetterOptions
} from './types/index'
import { 
    InvalidStateSchemaError, 
    ProtectedNamespaceError, 
    ReservedStateKeyError, 
    InvalidStateUpdateError,
    InitializationError
} from './errors';

/************************************* DEFAULTS **************************************/
const DEFAULT_INIT_OPTIONS: InitializationOptions = {
    id: "",
    dynamicGetters: true,
    dynamicSetters: true,
    allowDynamicAccessorOverride: true,
    nestedGetters: true,
    nestedSetters: true,
    debug: false,
    enableWriteProtection: true,
}

const DEFAULT_STORAGE_OPTIONS: StorageOptions = {
    persistKey: "",
    initializeFromLocalStorage: false,
    subscriberIDs: [],
    clearStorageOnUnload: true,
    removeChildrenOnUnload: true,
    privateState: [],
    deepSanitizeState: true
}

const DEFAULT_DYNAMIC_SETTER_OPTIONS = {
    explicitUpdatePath: true
}

let IS_BROWSER: boolean;
export let WINDOW: { [key: string]: any };
try {
    WINDOW = window;
    IS_BROWSER = true;
} catch (err) {
    WINDOW = global;
    IS_BROWSER = false;
}
if (!("localStorage" in WINDOW)) WINDOW.localStorage = new _localStorage

const PROTECTED_NAMESPACES: { [key: string]: any } = {
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
}

const RESERVED_STATE_KEYS: string[] = [
    "*"
]


/* SPICCATO */
export default class Spiccato {
    /* Class Properties */
    private static managers: { [key: string]: Spiccato } = {};

    private static registerManager(instance: Spiccato) {
        if (instance.initOptions.id in this.managers) {
            console.warn(`State Manager with id: '${instance.initOptions.id}' already exists. It has been overwritten`)
        }
        this.managers[instance.initOptions.id] = instance;
    }

    static getManagerById(id: managerID) {
        return this.managers[id];
    }

    static clear() {
        this.managers = {};
    }

    /* Instance Properties */
    private initOptions: InitializationOptions;
    public _schema: StateSchema
    public _state: StateObject;
    getters: { [key: string]: Function };
    setters: { [key: string]: Function };
    methods: { [key: string]: Function };
    private _bindToLocalStorage: boolean;
    private _initialized: boolean;
    private _role: string;
    windowManager: (WindowManager | null);
    private _eventListeners: { [key: string]: Function[] }
    [key: string]: any; /* for runtime added properties */

    constructor(stateSchema: StateSchema = {}, options: InitializationOptions) {
        this.initOptions = { ...DEFAULT_INIT_OPTIONS, ...options };

        if (hasCircularReference(stateSchema)) {
            throw new InvalidStateSchemaError("State Schema has a circular reference. Spiccato does not allow circular references")
        } else if (stateSchemaHasFunctions(stateSchema)) {
            throw new InvalidStateSchemaError("State Schema has `functions` for some of its values. Spiccato does not allow function values in the state schema. Consider using the `addCustomMethods` or `addNamespacedMethods` functionality instead.")
        }

        this._schema = Object.freeze({ ...stateSchema })
        this._state = stateSchema;
        this.paths = new PathTree(this._schema).root;

        const stateKeyViolations = RESERVED_STATE_KEYS.filter(k => Object.keys(this._state).includes(k));
        if (stateKeyViolations.length) {
            throw new ReservedStateKeyError(`The key: '${stateKeyViolations[0]}' is reserved at this level. Please select a different key for this state resource.`)
        }

        this.getters = {}
        this.setters = {}
        this.methods = {}

        this._initialized = false;
        this._bindToLocalStorage = false;
        this._role = "provider";
        this.windowManager = IS_BROWSER ? new WindowManager(WINDOW) : null;

        this._eventListeners = {};

        if (IS_BROWSER) {
            WINDOW?.addEventListener("beforeunload", this.handleUnload.bind(this))
            WINDOW?.addEventListener("onunload", this.handleUnload.bind(this))
        }

        (this.constructor as typeof Spiccato).registerManager(this)
    }

    public get state(): StateObject {
        return this.initOptions.enableWriteProtection ? createStateProxy(this._state, this._schema) : this._state;
    }

    public get id(): managerID {
        return this.initOptions.id;
    }

    init() {
        this._applyState();
        this._initialized = true
    }

    private _applyState() {

        if (this._bindToLocalStorage) {
            this._persistToLocalStorage(this._state)
        }

        if (this.storageOptions?.deepSanitizeState && this._role !== "provider") {
            this._schema = (sanitizeState(this._state, this.storageOptions.privateState)[0] as StateSchema);
            this._state = this._schema;
            Object.freeze(this._schema);
        }


        for (let k in this._state) {
            if (this.initOptions.dynamicGetters) {
                this.getters[formatAccessor(k, "get")] = () => {
                    // this accesses `this.state` and NOT `this._state`. If the getter returns a higher level object, that object should be immutable
                    return this.state[k];
                }
            }

            if (this.initOptions.dynamicSetters) {
                this.setters[formatAccessor(k, "set")] = (v: any, callback: StateUpdateCallback | null, options: DynamicSetterOptions | null) => {
                    options = { ...DEFAULT_DYNAMIC_SETTER_OPTIONS, ...options }
                    return new Promise(async resolve => {
                        resolve(await this.setState({ [k]: v }, callback, options?.explicitUpdatePath ? [[k]] : null));
                    })
                }
            }
        }

        // nested interactions
        const createNestedGetters = this.initOptions.dynamicGetters && this.initOptions.nestedGetters;
        const createNestedSetters = this.initOptions.dynamicSetters && this.initOptions.nestedSetters;
        if (createNestedGetters || createNestedSetters) {
            const nestedPaths: (string[])[] = getNestedRoutes(this._state);
            for (let path of nestedPaths) {

                if (createNestedGetters) {
                    this.getters[formatAccessor(path, "get")] = () => {
                        let value = this._state[path[0]];
                        for (let i = 1; i < path.length; i++) {
                            value = value?.[path[i]];
                        }
                        return value;
                    }
                }

                if (createNestedSetters) {
                    this.setters[formatAccessor(path, "set")] = (v: any, callback: StateUpdateCallback | null, options: DynamicSetterOptions | null): Promise<StateObject> => {
                        options = { ...DEFAULT_DYNAMIC_SETTER_OPTIONS, ...options }
                        const updatedState = nestedSetterFactory(this._state, path)(v);
                        return new Promise(async resolve => {
                            resolve(await this.setState(updatedState, callback, options?.explicitUpdatePath ? [path] : null));
                        })
                    }
                }
            }
        }
    }

    private _persistToLocalStorage(state: StateObject) {
        if (this._bindToLocalStorage && !!this.storageOptions.persistKey) {
            const [sanitized, removed] = sanitizeState(state, this.storageOptions.privateState || [])
            WINDOW?.localStorage?.setItem(this.storageOptions.persistKey, JSON.stringify(sanitized))
            this._state = restoreState(state, removed);
        }
    }

    getStateFromPath(path: string | string[]): any | undefined {
        if (typeof path === "string") {
            return this.state[path]
        } else if (Array.isArray(path)) {
            let val = this.state;
            for (let p of path) {
                val = val[p];
                if (val === undefined) return undefined
            }
            return val
        }
    }

    setState(updater: StateObject | Function, callback: StateUpdateCallback | null = null, updatedPaths: string[][] | PathNode[] | null = null): Promise<StateObject> {

        return new Promise(resolve => {
            if (typeof updater === 'object') {
                updatedPaths ??= getUpdatedPaths(updater, this._state, this._schema)
                if (Array.isArray(updater)) {
                    throw new InvalidStateUpdateError("Update value passed to `setState` is an array - must be an object or a function that returns an object, not an array");
                }
                this._state = { ...this._state, ...updater };
            } else if (typeof updater === 'function') {
                const result: StateObject | [StateObject, string[][] | PathNode[]] = updater(this.state);
                if (typeof result !== "object") throw new InvalidStateUpdateError("Functional update did not return an object. The function passed to `setState` must return an object");
                let updaterValue: StateObject 
                if (Array.isArray(result)) {
                    updaterValue = result[0];
                    updatedPaths = result[1];
                } else {
                    updaterValue = result;
                }
                updatedPaths ??= getUpdatedPaths(updaterValue, this._state, this._schema)
                this._state = { ...this._state, ...updaterValue };
            } else {
                // if state update could not be performed, reset updatedPaths to an empty array
                updatedPaths = [];
            }

            const updated = this.initOptions.enableWriteProtection ? createStateProxy(this._state, this._schema) : this._state;
            resolve(updated);
            callback?.(updated);
            this.emitEvent("update", { state: updated })
            for (let path of updatedPaths) {
                this.emitUpdateEventFromPath(path)
            }
            if (this._bindToLocalStorage && this.storageOptions.persistKey) {
                this._persistToLocalStorage(this._state)
            }
        })
    }

    addCustomGetters(getters: { [key: string]: Function }) {
        if(!this._initialized) {
            throw new InitializationError("`addCustomGetters` called before init(). This may lead to unexpected behavior with dynamic getter overrides")
        }
        for (let [key, callback] of Object.entries(getters)) {
            if(!(key in this.getters) || (key in this.getters && this.initOptions.allowDynamicAccessorOverride)) {
                getters[key] = callback.bind(this);
            }
        }
        this.getters = { ...this.getters, ...getters }
    }

    addCustomSetters(setters: { [key: string]: Function }) {
        if(!this._initialized) {
            throw new InitializationError("`addCustomSetters` called before init(). This may lead to unexpected behavior with dynamic setter overrides")
        }
        for (let [key, callback] of Object.entries(setters)) {
            if(!(key in this.setters) || (key in this.setters && this.initOptions.allowDynamicAccessorOverride)) {
                setters[key] = callback.bind(this);
            }
        }
        this.setters = { ...this.setters, ...setters };
    }

    addCustomMethods(methods: { [key: string]: Function }) {
        for (let [key, callback] of Object.entries(methods)) {
            methods[key] = callback.bind(this);
        }
        this.methods = { ...this.methods, ...methods };
    }

    addNamespacedMethods(namespaces: { [key: string]: { [key: string]: Function } }) {
        for (let ns in namespaces) {
            if (PROTECTED_NAMESPACES[ns]) {
                throw new ProtectedNamespaceError(`The namespace '${ns}' is protected. Please choose a different namespace for you methods.`)
            }
            this[ns] = {}
            for (let [key, callback] of Object.entries(namespaces[ns])) {
                this[ns][key] = callback.bind(this);
            }
        }
    }

    /********** EVENTS **********/

    addEventListener(eventType: string | string[] | PathNode, callback: Function) {
        if (Array.isArray(eventType)) {
            eventType = "on_" + eventType.join("_") + "_update";
        }
        if (eventType instanceof PathNode) {
            eventType = "on_" + eventType.__$path.join("_") + "_update";
        }
        if (eventType in this._eventListeners) {
            this._eventListeners[eventType].push(callback);
        } else {
            this._eventListeners[eventType] = [callback];
        }
    }

    removeEventListener(eventType: string | string[] | PathNode, callback: Function) {
        if (Array.isArray(eventType)) {
            eventType = "on_" + eventType.join("_") + "_update"
        }
        if (eventType instanceof PathNode) {
            eventType = "on_" + eventType.__$path.join("_") + "_update";
        }
        this._eventListeners[eventType] = this._eventListeners[eventType]?.filter(cb => cb !== callback);
    }

    private emitEvent(eventType: string, payload: EventPayload) {
        this._eventListeners[eventType]?.forEach(callback => {
            callback(payload);
        })
    }

    private emitUpdateEventFromPath(path: string[] | PathNode) {
        if (path instanceof PathNode) path = path.__$path;
        let p: string[], v: any;
        for (let i = 0; i < path.length; i++) {
            p = path.slice(0, i + 1)
            v = this._state
            for (let key of p) {
                v = v[key]
            }
            this.emitEvent("on_" + p.join("_") + "_update", { path: p, value: v })
        }
    }

    /********** LOCAL STORAGE **********/
    connectToLocalStorage(storageOptions: StorageOptions) {
        if(this._initialized) {
            throw new InitializationError("`init()` method called before `connectToLocalStorage()`.")
        }
        this.storageOptions = { ...DEFAULT_STORAGE_OPTIONS, ...storageOptions };
        this.storageOptions.privateState = this.storageOptions.privateState.map((ps: string | string[] | PathNode) => ps instanceof PathNode ? ps.__$path : typeof ps === "string" ? [ps] : ps);

        // if window does not have a "name" property, default to the provider window id
        if (!WINDOW.name && this.storageOptions.providerID) {
            WINDOW.name = this.storageOptions.providerID;
        }

        if (!WINDOW.name) {
            console.error("If connecting to localStorage, providerID must be defined in storageOptions passed to 'connectToToLocalStorage'");
            return;
        }

        this.initOptions.debug && console.log("DEBUG: window.name", WINDOW.name)
        this.initOptions.debug && console.assert(!!WINDOW.name)

        const isProviderWindow = WINDOW.name === this.storageOptions.providerID;
        const isSubscriberWindow = (this.storageOptions.subscriberIDs ?? []).includes(WINDOW.name);
        this._role = isProviderWindow ? "provider" : isSubscriberWindow ? "subscriber" : ""

        this._bindToLocalStorage = true;

        if (this.storageOptions.initializeFromLocalStorage || isSubscriberWindow) {
            if (!!WINDOW.localStorage.getItem(this.storageOptions.persistKey)) {
                if (isProviderWindow && !isSubscriberWindow) {
                    this._state = {
                        ...this._state,
                        ...JSON.parse(WINDOW.localStorage.getItem(this.storageOptions.persistKey)),
                    }
                } else if (isSubscriberWindow) {
                    this._state = JSON.parse(WINDOW.localStorage.getItem(this.storageOptions.persistKey))
                } else {
                    IS_BROWSER && console.warn("window is not a provider and has not been identified as a subscriber. State will not be loaded. See docs on provider and subscriber roles");
                    this._bindToLocalStorage = false;
                }
            }
        }

        if ("addEventListener" in WINDOW && this._bindToLocalStorage) {
            WINDOW.addEventListener("storage", () => {
                this._updateFromLocalStorage()
            })
        }
    }

    private _updateFromLocalStorage() {
        this.setState({ ...this._state, ...JSON.parse(WINDOW.localStorage.getItem(this.storageOptions.persistKey)) })
    }

    private handleUnload(event: { [key: string]: any }) {
        // clear local storage only if specified by user AND the window being closed is the provider window
        if (this.storageOptions.clearStorageOnUnload && this.storageOptions.providerID === WINDOW?.name) {
            WINDOW?.localStorage.removeItem(this.storageOptions.persistKey)
        }

        // close all children (and grand children) windows if this functionality has been specified by the user   
        if (this.storageOptions.removeChildrenOnUnload) {
            this.windowManager?.removeSubscribers();
        }
    }

}



